import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, TrendingDown, MapPin, Wallet, ArrowUpRight, ArrowDownRight, Info, Package, Loader2, LayoutGrid, List, Coins, Copy, Check } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { supabase } from '../../lib/supabase';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';

export default function TokenizedAssetsShowcase() {
  const { isConnected, address } = useAccount();
  const { open } = useAppKit();
  const [userAssets, setUserAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedAssetForSale, setSelectedAssetForSale] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');

  // Stats
  const [stats, setStats] = useState({
    totalInvested: 0,
    totalValue: 0,
    totalPnL: 0,
    totalPnLPercentage: 0,
    totalAssets: 0,
    avgAPY: 0
  });

  useEffect(() => {
    if (isConnected && address) {
      fetchUserHoldings();
    } else {
      setLoading(false);
      setUserAssets([]);
      resetStats();
    }
  }, [isConnected, address]);

  const resetStats = () => {
    setStats({
      totalInvested: 0,
      totalValue: 0,
      totalPnL: 0,
      totalPnLPercentage: 0,
      totalAssets: 0,
      avgAPY: 0
    });
  };

  const fetchUserHoldings = async () => {
    setLoading(true);
    try {
      // Fetch real holdings from database
      const { data, error } = await supabase
        .from('user_holdings')
        .select(`
          *,
          asset:user_requests!inner(
            id,
            data,
            status,
            estimated_cost
          )
        `)
        .eq('wallet_address', address.toLowerCase())
        .eq('asset.status', 'live_on_marketplace')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching holdings:', error);
        setUserAssets([]);
        resetStats();
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const formatted = data.map(holding => ({
          id: holding.id,
          assetId: holding.asset_id,
          name: holding.asset?.data?.asset_name || 'Asset',
          description: holding.asset?.data?.description || '',
          category: holding.asset?.data?.category || 'other',
          image: holding.asset?.data?.images?.[0] || 'https://via.placeholder.com/400x300',
          tokenSymbol: holding.token_symbol || 'TKN',
          tokenStandard: holding.token_standard || 'ERC1400',
          tokensOwned: holding.tokens_owned || 0,
          purchasePrice: holding.purchase_price_per_token || 0,
          currentPrice: holding.current_price_per_token || holding.purchase_price_per_token || 0,
          totalInvested: holding.total_invested || 0,
          currentValue: (holding.tokens_owned || 0) * (holding.current_price_per_token || 0),
          priceHistory: holding.price_history || generatePriceHistory(holding.purchase_price_per_token),
          location: holding.asset?.data?.location || '',
          contractAddress: holding.contract_address || '',
          purchaseDate: holding.created_at,
          apy: holding.apy || 0
        }));

        setUserAssets(formatted);
        calculateStats(formatted);
      } else {
        setUserAssets([]);
        resetStats();
      }
    } catch (error) {
      console.error('Error fetching holdings:', error);
      setUserAssets([]);
      resetStats();
    } finally {
      setLoading(false);
    }
  };

  const generatePriceHistory = (basePrice) => {
    const history = [];
    let price = basePrice * 0.9;
    for (let i = 0; i < 30; i++) {
      price = price * (1 + (Math.random() - 0.45) * 0.05);
      history.push({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: parseFloat(price.toFixed(2))
      });
    }
    return history;
  };

  const calculateStats = (assets) => {
    const totalInvested = assets.reduce((sum, asset) => sum + asset.totalInvested, 0);
    const totalCurrentValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const totalPnL = totalCurrentValue - totalInvested;
    const totalPnLPercentage = totalInvested > 0 ? ((totalPnL / totalInvested) * 100) : 0;
    const avgAPY = assets.length > 0 ? assets.reduce((sum, asset) => sum + asset.apy, 0) / assets.length : 0;

    setStats({
      totalInvested,
      totalValue: totalCurrentValue,
      totalPnL,
      totalPnLPercentage,
      totalAssets: assets.length,
      avgAPY
    });
  };

  const handleSellTokens = (asset) => {
    setSelectedAssetForSale(asset);
    setShowSellModal(true);
  };

  const copyWalletAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
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

  // Wallet not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white">
        {/* Minimal Header */}
        <div className="border-b border-black/5">
          <div className="max-w-[1920px] mx-auto px-8 py-6">
            <div>
              <h1 className="text-xl font-medium text-black tracking-tight">My DeFi Assets</h1>
              <p className="text-xs text-black/40 mt-0.5">Portfolio Overview</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center py-32">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-sm border border-black/10 flex items-center justify-center mx-auto mb-4">
              <Wallet size={32} className="text-black/20" />
            </div>
            <h3 className="text-sm font-medium text-black mb-2">Connect Wallet</h3>
            <p className="text-xs text-black/40 mb-6">
              Connect your wallet to view your DeFi asset portfolio
            </p>
            <button
              onClick={() => open()}
              className="px-6 py-2 border border-black hover:bg-black hover:text-white rounded-sm text-xs font-medium transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border border-black/10 border-t-black rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-black/40">Loading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <div className="border-b border-black/5">
        <div className="max-w-[1920px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-medium text-black tracking-tight">My DeFi Assets</h1>
              <p className="text-xs text-black/40 mt-0.5">Portfolio Overview</p>
            </div>
            <div className="flex items-center gap-3">
              {userAssets.length > 0 && (
                <>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="px-3 py-1.5 border border-black/10 rounded-sm text-xs focus:outline-none focus:border-black/30 transition-colors bg-white"
                  >
                    <option value="7d">7d</option>
                    <option value="30d">30d</option>
                    <option value="90d">90d</option>
                  </select>

                  {/* View Toggle */}
                  <div className="flex items-center gap-1 border border-black/10 rounded-sm p-0.5">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-2 py-1 rounded-sm text-xs transition-colors ${
                        viewMode === 'cards'
                          ? 'bg-black text-white'
                          : 'text-black/40 hover:text-black/60'
                      }`}
                    >
                      <LayoutGrid size={12} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-2 py-1 rounded-sm text-xs transition-colors ${
                        viewMode === 'list'
                          ? 'bg-black text-white'
                          : 'text-black/40 hover:text-black/60'
                      }`}
                    >
                      <List size={12} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Bar - Ultra Minimal */}
      <div className="border-b border-black/5">
        <div className="max-w-[1920px] mx-auto px-8 py-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-black/30 mb-1.5">Invested</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-light text-black">
                  {formatCurrency(stats.totalInvested)}
                </span>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-black/30 mb-1.5">Value</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-light text-black">
                  {formatCurrency(stats.totalValue)}
                </span>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-black/30 mb-1.5">P&L</div>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-light ${stats.totalPnL >= 0 ? 'text-black' : 'text-black'}`}>
                  {stats.totalPnL >= 0 ? '+' : ''}{formatCurrency(Math.abs(stats.totalPnL))}
                </span>
                <span className="text-xs text-black/40">
                  {stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnLPercentage.toFixed(2)}%
                </span>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-black/30 mb-1.5">Assets</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-light text-black">{stats.totalAssets}</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-black/30 mb-1.5">Avg APY</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-light text-black">{stats.avgAPY.toFixed(2)}%</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-black/30 mb-1.5">Wallet</div>
              {address ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-black/60">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                  <button
                    onClick={copyWalletAddress}
                    className="p-1 hover:bg-black/5 rounded transition-colors"
                  >
                    {copiedAddress ? (
                      <Check size={12} className="text-black/60" />
                    ) : (
                      <Copy size={12} className="text-black/30" />
                    )}
                  </button>
                </div>
              ) : (
                <span className="text-xs text-black/30">Not connected</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-[1920px] mx-auto px-8 py-8">
        {/* Empty State */}
        {userAssets.length === 0 && (
          <div className="text-center py-32">
            <div className="w-16 h-16 rounded-sm border border-black/10 flex items-center justify-center mx-auto mb-4">
              <Coins size={32} className="text-black/20" />
            </div>
            <p className="text-sm text-black/40 mb-6">No assets in portfolio</p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-6 py-2 border border-black hover:bg-black hover:text-white rounded-sm text-xs font-medium transition-colors inline-flex items-center gap-2"
            >
              <Package size={14} />
              Browse Marketplace
            </button>
          </div>
        )}

        {/* Cards View */}
        {viewMode === 'cards' && userAssets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onSell={() => handleSellTokens(asset)}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && userAssets.length > 0 && (
          <div className="space-y-3">
            {userAssets.map((asset) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                onSell={() => handleSellTokens(asset)}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sell Modal */}
      {showSellModal && selectedAssetForSale && (
        <SellTokenModal
          asset={selectedAssetForSale}
          onClose={() => {
            setShowSellModal(false);
            setSelectedAssetForSale(null);
          }}
          onConfirm={(amount) => {
            console.log(`Selling ${amount} tokens of ${selectedAssetForSale.tokenSymbol}`);
            setShowSellModal(false);
            setSelectedAssetForSale(null);
          }}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}

// Minimal Card View Component
function AssetCard({ asset, onSell, formatCurrency }) {
  const pnl = asset.currentValue - asset.totalInvested;
  const pnlPercentage = asset.totalInvested > 0 ? ((pnl / asset.totalInvested) * 100) : 0;
  const priceChange = asset.currentPrice - asset.purchasePrice;
  const priceChangePercentage = asset.purchasePrice > 0 ? ((priceChange / asset.purchasePrice) * 100) : 0;

  return (
    <div className="border border-black/5 rounded-sm bg-white hover:border-black/10 transition-all group">
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={asset.image}
          alt={asset.name}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-2 right-2">
          <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono bg-black/80 text-white backdrop-blur-sm">
            {asset.tokenStandard}
          </span>
        </div>

        <div className="absolute top-2 left-2">
          <span className={`px-2 py-0.5 rounded-sm text-[10px] font-mono backdrop-blur-sm ${
            pnl >= 0 ? 'bg-black/80 text-white' : 'bg-black/80 text-white'
          }`}>
            {pnl >= 0 ? '+' : ''}{pnlPercentage.toFixed(1)}%
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-medium text-white mb-0.5 truncate">{asset.name}</h3>
          <div className="flex items-center gap-2 text-white/80 text-[10px]">
            <span className="font-mono">{asset.tokenSymbol}</span>
            {asset.location && (
              <>
                <span>•</span>
                <span className="truncate">{asset.location}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price Chart */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-black/30">Price</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-black">{formatCurrency(asset.currentPrice)}</span>
              <span className={`text-[10px] font-mono ${priceChange >= 0 ? 'text-black/40' : 'text-black/40'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChangePercentage.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={asset.priceHistory}>
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={priceChange >= 0 ? '#000000' : '#000000'}
                  strokeWidth={1}
                  dot={false}
                  opacity={0.4}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-black/5">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-black/30 mb-0.5">Tokens</div>
            <div className="text-xs font-mono text-black">{asset.tokensOwned.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-black/30 mb-0.5">Avg Buy</div>
            <div className="text-xs font-mono text-black">{formatCurrency(asset.purchasePrice)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-black/30 mb-0.5">Invested</div>
            <div className="text-xs font-mono text-black">{formatCurrency(asset.totalInvested)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-black/30 mb-0.5">Value</div>
            <div className={`text-xs font-mono ${pnl >= 0 ? 'text-black' : 'text-black'}`}>
              {formatCurrency(asset.currentValue)}
            </div>
          </div>
        </div>

        {/* Contract */}
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wider text-black/30 mb-0.5">Contract</div>
          <div className="text-[10px] font-mono text-black/60 truncate">{asset.contractAddress}</div>
        </div>

        {/* Action */}
        <button
          onClick={onSell}
          className="w-full px-4 py-2 border border-black hover:bg-black hover:text-white rounded-sm text-xs font-medium transition-colors"
        >
          Sell
        </button>
      </div>
    </div>
  );
}

// Minimal List View Component
function AssetRow({ asset, onSell, formatCurrency }) {
  const pnl = asset.currentValue - asset.totalInvested;
  const pnlPercentage = asset.totalInvested > 0 ? ((pnl / asset.totalInvested) * 100) : 0;
  const priceChange = asset.currentPrice - asset.purchasePrice;
  const priceChangePercentage = asset.purchasePrice > 0 ? ((priceChange / asset.purchasePrice) * 100) : 0;

  return (
    <div className="border border-black/5 rounded-sm bg-white hover:border-black/10 transition-all p-4">
      <div className="flex items-center gap-4">
        {/* Image */}
        <div className="relative w-24 h-24 flex-shrink-0 rounded-sm overflow-hidden">
          <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
          <div className="absolute top-1 right-1">
            <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-mono bg-black/80 text-white backdrop-blur-sm">
              {asset.tokenStandard}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-black mb-0.5 truncate">{asset.name}</h3>
              <div className="flex items-center gap-2 text-[10px] text-black/40">
                <span className="font-mono">{asset.tokenSymbol}</span>
                {asset.location && (
                  <>
                    <span>•</span>
                    <span className="truncate">{asset.location}</span>
                  </>
                )}
              </div>
            </div>

            <div className={`px-2 py-0.5 rounded-sm text-[10px] font-mono ${
              pnl >= 0 ? 'bg-black/5 text-black' : 'bg-black/5 text-black'
            }`}>
              {pnl >= 0 ? '+' : ''}{pnlPercentage.toFixed(1)}%
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 items-center">
            {/* Chart */}
            <div className="col-span-3">
              <div className="h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={asset.priceHistory}>
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#000000"
                      strokeWidth={1}
                      dot={false}
                      opacity={0.4}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stats */}
            <div className="col-span-7 grid grid-cols-4 gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-black/30 mb-0.5">Tokens</div>
                <div className="text-xs font-mono text-black">{asset.tokensOwned.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-black/30 mb-0.5">Invested</div>
                <div className="text-xs font-mono text-black">{formatCurrency(asset.totalInvested)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-black/30 mb-0.5">Value</div>
                <div className="text-xs font-mono text-black">{formatCurrency(asset.currentValue)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-black/30 mb-0.5">APY</div>
                <div className="text-xs font-mono text-black">{asset.apy.toFixed(2)}%</div>
              </div>
            </div>

            {/* Action */}
            <div className="col-span-2">
              <button
                onClick={onSell}
                className="w-full px-3 py-1.5 border border-black hover:bg-black hover:text-white rounded-sm text-xs font-medium transition-colors"
              >
                Sell
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal Sell Modal
function SellTokenModal({ asset, onClose, onConfirm, formatCurrency }) {
  const [amount, setAmount] = useState('');
  const [percentage, setPercentage] = useState(0);

  const handleAmountChange = (value) => {
    const numValue = parseFloat(value) || 0;
    setAmount(value);
    setPercentage(asset.tokensOwned > 0 ? (numValue / asset.tokensOwned) * 100 : 0);
  };

  const handlePercentageChange = (percent) => {
    const tokens = Math.floor((percent / 100) * asset.tokensOwned);
    setAmount(tokens.toString());
    setPercentage(percent);
  };

  const estimatedValue = (parseFloat(amount) || 0) * asset.currentPrice;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white border border-black/10 rounded-sm max-w-md w-full p-6">
        <h2 className="text-sm font-medium text-black mb-1">Sell Tokens</h2>
        <p className="text-xs text-black/40 mb-6">{asset.name} ({asset.tokenSymbol})</p>

        <div className="mb-4">
          <label className="block text-[10px] uppercase tracking-wider text-black/40 mb-2">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            max={asset.tokensOwned}
            className="w-full px-3 py-2 border border-black/10 rounded-sm text-sm focus:outline-none focus:border-black/30"
            placeholder="0"
          />
          <p className="text-[10px] text-black/40 mt-1">Available: {asset.tokensOwned} tokens</p>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
          {[25, 50, 75, 100].map(percent => (
            <button
              key={percent}
              onClick={() => handlePercentageChange(percent)}
              className={`px-3 py-1.5 rounded-sm text-[10px] font-medium transition-all ${
                Math.abs(percentage - percent) < 1
                  ? 'bg-black text-white'
                  : 'border border-black/10 text-black/60 hover:border-black/30'
              }`}
            >
              {percent}%
            </button>
          ))}
        </div>

        <div className="border border-black/10 rounded-sm p-4 mb-6">
          <p className="text-[10px] uppercase tracking-wider text-black/40 mb-1">Est. Value</p>
          <p className="text-2xl font-light text-black">{formatCurrency(estimatedValue)}</p>
          <p className="text-[10px] text-black/40 mt-1">@ {formatCurrency(asset.currentPrice)} per token</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-black/10 text-black hover:border-black/30 rounded-sm text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(parseFloat(amount) || 0)}
            disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > asset.tokensOwned}
            className="flex-1 px-4 py-2 bg-black text-white hover:bg-black/90 rounded-sm text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
