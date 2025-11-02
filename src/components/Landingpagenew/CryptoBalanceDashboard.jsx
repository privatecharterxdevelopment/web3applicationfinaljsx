import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, History, Wallet, MessageCircle, Shield, User, Award, Plus, X, ExternalLink } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { supabase } from '../../lib/supabase';
import { formatEther } from 'viem';
import { base, mainnet } from 'viem/chains';
import { web3Service } from '../../lib/web3';

export default function CryptoBalanceDashboard() {
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const chainId = useChainId();

  // State for balances
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [showChart, setShowChart] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // State for user data
  const [userRequests, setUserRequests] = useState([]);
  const [kycData, setKycData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [nftCount, setNftCount] = useState(0);
  const [investments, setInvestments] = useState([]);

  // Fetch ETH balance on Base
  const { data: baseEthBalance } = useBalance({
    address: address,
    chainId: base.id,
    watch: true,
  });

  // Fetch ETH balance on Ethereum mainnet
  const { data: ethMainnetBalance } = useBalance({
    address: address,
    chainId: mainnet.id,
    watch: true,
  });

  // Fetch USDC balance on Base
  const { data: usdcBalance } = useBalance({
    address: address,
    token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    chainId: base.id,
    watch: true,
  });

  // Fetch user profile and KYC data
  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
      fetchKYCData();
      fetchUserRequests();
      fetchInvestments();
      fetchNFTCount();
    }
  }, [user?.id]);

  // Fetch transactions when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchAllTransactions();
    }
  }, [isConnected, address]);

  // Update balances when wallet data changes
  useEffect(() => {
    if (isConnected && address) {
      updateBalances();
      generateChartData();
    } else {
      // Show empty state when not connected
      setBalances([]);
      setTransactions([]);
    }
  }, [baseEthBalance, ethMainnetBalance, usdcBalance, isConnected, address]);

  // Auto-refresh balances and transactions every 60 seconds
  useEffect(() => {
    if (!isConnected || !address) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing balances and transactions (60s interval)');
      fetchAllTransactions();
      updateBalances();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [isConnected, address]);

  const fetchAllTransactions = async () => {
    if (!address) return;

    setLoadingTransactions(true);
    try {
      const allTxs = await web3Service.getAllChainTransactions(address, 50);
      setTransactions(allTxs);
      console.log(`✅ Loaded ${allTxs.length} transactions`);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchKYCData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('kyc_status, kyc_hash, kyc_verified_at, verification_level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setKycData(data);
      }
    } catch (error) {
      console.error('Error fetching KYC data:', error);
    }
  };

  const fetchUserRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setUserRequests(data);
      }
    } catch (error) {
      console.error('Error fetching user requests:', error);
    }
  };

  const fetchInvestments = async () => {
    if (!address) return;

    try {
      const { data, error } = await supabase
        .from('launchpad_investments')
        .select('*, launchpad_projects(*)')
        .eq('wallet_address', address.toLowerCase())
        .order('created_at', { ascending: false });

      if (!error && data) {
        setInvestments(data);
      }
    } catch (error) {
      console.error('Error fetching investments:', error);
    }
  };

  const fetchNFTCount = async () => {
    if (!address) return;

    try {
      // Query NFT ownership - adjust table name based on your schema
      const { data, error } = await supabase
        .from('nft_memberships')
        .select('*')
        .eq('wallet_address', address.toLowerCase());

      if (!error && data) {
        setNftCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching NFT count:', error);
      // Default to showing 0 if table doesn't exist
      setNftCount(0);
    }
  };

  const updateBalances = async () => {
    setLoading(true);
    const newBalances = [];
    const ethPrice = 3000; // Mock price - integrate coingecko API for real prices

    // Add ETH balance from Base
    if (baseEthBalance) {
      const ethValue = parseFloat(formatEther(baseEthBalance.value));
      if (ethValue > 0) {
        newBalances.push({
          symbol: 'ETH',
          name: 'Ethereum (Base)',
          balance: ethValue,
          value: ethValue * ethPrice,
          change: 2.4,
          chain: 'Base',
          chainId: base.id,
        });
      }
    }

    // Add ETH balance from Ethereum mainnet
    if (ethMainnetBalance) {
      const ethValue = parseFloat(formatEther(ethMainnetBalance.value));
      if (ethValue > 0) {
        newBalances.push({
          symbol: 'ETH',
          name: 'Ethereum (Mainnet)',
          balance: ethValue,
          value: ethValue * ethPrice,
          change: 2.4,
          chain: 'Ethereum',
          chainId: mainnet.id,
        });
      }
    }

    // Add USDC balance from Base
    if (usdcBalance) {
      const usdcValue = parseFloat(formatEther(usdcBalance.value));
      if (usdcValue > 0) {
        newBalances.push({
          symbol: 'USDC',
          name: 'USD Coin (Base)',
          balance: usdcValue,
          value: usdcValue * 1.0,
          change: 0.0,
          chain: 'Base',
          chainId: base.id,
        });
      }
    }

    setBalances(newBalances);
    setLoading(false);
  };

  const generateChartData = () => {
    // Generate mock chart data based on current portfolio
    // In production, fetch historical data from transactions table
    const data = [];
    const baseValue = balances.reduce((sum, b) => sum + b.value, 0) || 50000;

    for (let i = 0; i < 6; i++) {
      const variance = (Math.random() - 0.5) * 2000;
      data.push({
        time: `${i * 4}:00`,
        value: Math.max(0, baseValue + variance),
      });
    }

    setChartData(data);
  };

  const totalValue = balances.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...balances.map(b => b.value), 1);

  const handleSend = () => {
    // Open AppKit modal with send view
    open({ view: 'Account' });
  };

  const handleReceive = () => {
    // Open AppKit modal to show wallet address
    open({ view: 'Account' });
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const getRequestTypeLabel = (type) => {
    const labels = {
      'private_jet_charter': 'Private Jet',
      'helicopter_charter': 'Helicopter',
      'empty_leg': 'Empty Leg',
      'luxury_car': 'Luxury Car',
      'adventure_package': 'Adventure',
      'co2_certificate': 'CO2 Certificate',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Wallet Not Connected Banner */}
        {!isConnected && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-4 border border-gray-200">
            <div className="text-center">
              <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-light text-gray-900 mb-2">Wallet nicht verbunden</h2>
              <p className="text-gray-600 mb-4 text-sm">
                Verbinden Sie Ihre Wallet, um Ihre Krypto-Balances und Portfolio zu sehen.
              </p>
              <button
                onClick={() => open()}
                className="px-6 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all text-sm"
              >
                Wallet verbinden
              </button>
            </div>
          </div>
        )}

        {/* Total Balance Card with Chart - Only show when wallet is connected */}
        {isConnected && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-4 border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <p className="text-gray-500 text-xs mb-1">Gesamtwert</p>
              <h2 className="text-4xl font-light text-black mb-1">
                ${totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="text-xs text-gray-500 mt-1">+2.4% heute</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">24h</p>
                <div className="px-2 py-1 bg-white rounded-full text-xs text-gray-600 border border-gray-200">
                  Live
                </div>
              </div>
              <button
                onClick={() => setShowChart(!showChart)}
                className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center transition-all active:scale-95"
              >
                {showChart ? (
                  <X className="w-6 h-6 text-black transition-transform duration-300" />
                ) : (
                  <Plus className="w-6 h-6 text-black transition-transform duration-300" />
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Line Chart */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showChart ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
            {chartData.length > 0 && (
              <>
                <div className="h-24 -mx-4 mb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#000000"
                        strokeWidth={2}
                        dot={false}
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex justify-between text-xs text-gray-400 px-4">
                  <span>00:00</span>
                  <span>12:00</span>
                  <span>Jetzt</span>
                </div>
              </>
            )}
          </div>
        </div>
        )}

        {/* Action Buttons - Only show when wallet is connected */}
        {isConnected && (
        <div className="flex gap-3 mb-4">
          <button
            onClick={handleSend}
            className="flex-1 bg-black text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-sm font-medium">Senden</span>
          </button>
          <button
            onClick={handleReceive}
            className="flex-1 bg-gray-100 text-black rounded-xl py-3 px-4 flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95 border border-gray-200"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Empfangen</span>
          </button>
        </div>
        )}

        {/* Quick Access Sections */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* My Assets Section - Only show when wallet is connected */}
            {isConnected && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('assets')}
                className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">My Assets</span>
                </div>
                <Plus className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${activeSection === 'assets' ? 'rotate-45' : ''}`} />
              </button>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeSection === 'assets' ? 'max-h-96' : 'max-h-0'}`}>
                <div className="p-4 bg-gray-50 space-y-2">
                  {balances.length > 0 ? (
                    balances.map((item) => (
                      <div key={item.symbol} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">{item.symbol[0]}</span>
                          </div>
                          <span className="text-sm text-gray-900">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-600">${item.value.toLocaleString('de-DE', { maximumFractionDigits: 0 })}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Keine Assets gefunden</p>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* Blockchain Transactions Section - Only show when wallet is connected */}
            {isConnected && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('transactions')}
                className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Transactions</span>
                  {transactions.length > 0 && (
                    <span className="px-2 py-0.5 bg-black text-white rounded-full text-xs">
                      {transactions.length}
                    </span>
                  )}
                </div>
                <Plus className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${activeSection === 'transactions' ? 'rotate-45' : ''}`} />
              </button>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeSection === 'transactions' ? 'max-h-96 overflow-y-auto' : 'max-h-0'}`}>
                <div className="p-4 bg-gray-50 space-y-2">
                  {loadingTransactions ? (
                    <p className="text-sm text-gray-500">Loading transactions...</p>
                  ) : transactions.length > 0 ? (
                    transactions.slice(0, 10).map((tx) => (
                      <div key={tx.hash} className="py-2 border-b border-gray-200 last:border-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 capitalize">{tx.type}</p>
                              {tx.type === 'send' ? (
                                <ArrowUpRight className="w-3 h-3 text-red-500" />
                              ) : (
                                <ArrowDownLeft className="w-3 h-3 text-green-500" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(tx.timestamp).toLocaleDateString('de-DE')}
                            </p>
                            <a
                              href={tx.etherscanUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                            >
                              View on Explorer <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {tx.tokenTransfers && tx.tokenTransfers.length > 0
                                ? tx.tokenTransfers[0].valueFormatted
                                : `${parseFloat(tx.valueInEth).toFixed(4)} ETH`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No transactions found</p>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* My Requests Section */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('requests')}
                className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">My Requests</span>
                  {userRequests.length > 0 && (
                    <span className="px-2 py-0.5 bg-black text-white rounded-full text-xs">
                      {userRequests.length}
                    </span>
                  )}
                </div>
                <Plus className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${activeSection === 'requests' ? 'rotate-45' : ''}`} />
              </button>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeSection === 'requests' ? 'max-h-96 overflow-y-auto' : 'max-h-0'}`}>
                <div className="p-4 bg-gray-50 space-y-2">
                  {userRequests.length > 0 ? (
                    userRequests.map((request) => (
                      <div key={request.id} className="py-2 border-b border-gray-200 last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs text-gray-500">
                              {formatDate(request.created_at)}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            request.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Keine aktiven Anfragen</p>
                  )}
                </div>
              </div>
            </div>

            {/* Wallet & NFTs Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Wallet & NFTs</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Connected Wallet</span>
                  {isConnected && address ? (
                    <span className="text-xs font-mono text-gray-900">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">Not connected</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Network</span>
                  {isConnected && chainId ? (
                    <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-900">
                      {chainId === base.id ? 'Base' : chainId === mainnet.id ? 'Ethereum' : `Chain ${chainId}`}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">-</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">NFTs Owned</span>
                  <span className="text-xs font-medium text-gray-900">{nftCount}</span>
                </div>
                {!isConnected ? (
                  <button
                    onClick={() => open()}
                    className="w-full py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-all"
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <button className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-900 transition-all">
                    View NFT Gallery
                  </button>
                )}
              </div>
            </div>

            {/* Support Section */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('support')}
                className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Chat Support</span>
                </div>
                <Plus className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${activeSection === 'support' ? 'rotate-45' : ''}`} />
              </button>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeSection === 'support' ? 'max-h-96' : 'max-h-0'}`}>
                <div className="p-4 bg-gray-50">
                  <p className="text-sm text-gray-500 mb-2">Support ist verfügbar 24/7</p>
                  <button className="w-full py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-all">
                    Chat starten
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* KYC Badge */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">KYC Status</span>
                </div>
                <div className={`px-2 py-1 rounded-full ${
                  kycData?.kyc_status === 'verified' ? 'bg-black' : 'bg-gray-300'
                }`}>
                  <span className="text-xs text-white font-medium">
                    {kycData?.kyc_status === 'verified' ? 'Verifiziert' : 'Ausstehend'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Verification Level</span>
                  <span className="text-xs font-medium text-gray-900">
                    Level {kycData?.verification_level || '0'}
                  </span>
                </div>
                {kycData?.kyc_hash && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Hash</span>
                    <span className="text-xs font-mono text-gray-900">
                      {kycData.kyc_hash.slice(0, 6)}...{kycData.kyc_hash.slice(-4)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Verified Date</span>
                  <span className="text-xs text-gray-900">
                    {formatDate(kycData?.kyc_verified_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Settings Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.name || user?.email?.split('@')[0] || 'User'}
                  </h3>
                  <p className="text-xs text-gray-500">{user?.email || 'No email'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-900">2FA Authentication</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-900">Email Notifications</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-900">Trade Notifications</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
              </div>

              <button className="w-full mt-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-900 transition-all">
                Edit Profile
              </button>
            </div>

            {/* NFT Memberships Section */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('nft')}
                className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">NFT Memberships</span>
                  {nftCount > 0 && (
                    <span className="px-2 py-0.5 bg-black text-white rounded-full text-xs">
                      {nftCount}
                    </span>
                  )}
                </div>
                <Plus className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${activeSection === 'nft' ? 'rotate-45' : ''}`} />
              </button>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeSection === 'nft' ? 'max-h-96' : 'max-h-0'}`}>
                <div className="p-4 bg-gray-50">
                  {investments.length > 0 ? (
                    <div className="space-y-2">
                      {investments.slice(0, 5).map((inv) => (
                        <div key={inv.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                          <span className="text-sm text-gray-900">
                            {inv.launchpad_projects?.name || 'Investment'}
                          </span>
                          <span className="text-xs text-gray-500">
                            ${inv.amount_invested || '0'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Keine Investments</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Cards - Only show when wallet is connected */}
        {isConnected && balances.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {balances.map((item) => (
              <div
                key={item.symbol}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">{item.symbol}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-black">{item.symbol}</h3>
                      <p className="text-xs text-gray-400">{item.name}</p>
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    item.change > 0 ? 'bg-gray-100 text-gray-600' :
                    item.change < 0 ? 'bg-gray-100 text-gray-600' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                    {item.change > 0 ? '+' : ''}{item.change}%
                  </div>
                </div>

                <div>
                  <p className="text-xl font-light text-black mb-1">
                    ${item.value.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {item.balance.toLocaleString('de-DE', { minimumFractionDigits: 4 })} {item.symbol}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart Overview - Only show when wallet is connected */}
        {isConnected && balances.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-light text-black mb-6">Verteilung</h3>

            {/* Donut Chart */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={balances.map(b => ({ name: b.symbol, value: b.value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {balances.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={['#000000', '#404040', '#808080', '#A0A0A0'][index]}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <p className="text-xs text-gray-400 mb-1">Total</p>
                  <p className="text-xl font-light text-black">
                    ${(totalValue / 1000).toFixed(0)}k
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {balances.map((item) => {
                const percentage = (item.value / totalValue * 100);
                const barWidth = (item.value / maxValue * 100);

                return (
                  <div key={item.symbol} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-600">{item.symbol}</span>
                      <span className="text-xs text-gray-400">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-gray-800 rounded-full transition-all duration-500 group-hover:bg-black"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-xs text-gray-400">
                        {item.balance.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </span>
                      <span className="text-xs font-medium text-gray-600">
                        ${item.value.toLocaleString('de-DE', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Assets</p>
            <p className="text-xl font-light text-black">{isConnected ? balances.length : 0}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Requests</p>
            <p className="text-xl font-light text-black">{userRequests.length}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">NFTs</p>
            <p className="text-xl font-light text-black">{nftCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
