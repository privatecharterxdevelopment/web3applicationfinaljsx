import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Search, Filter, ArrowUpDown,
  DollarSign, Share2, Clock, CheckCircle, XCircle, Wallet,
  Plus, Minus, AlertCircle, ExternalLink, Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from 'wagmi';
import PageHeader from './PageHeader';
import Button from './Button';

export default function P2PMarketplace() {
  const { user } = useAuth();
  const { address: walletAddress, isConnected } = useAccount();

  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' or 'my-holdings'
  const [listings, setListings] = useState([]);
  const [myHoldings, setMyHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'price-low', 'price-high'

  // Modal states
  const [showSellModal, setShowSellModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);

  // Form states
  const [sellForm, setSellForm] = useState({
    shares: 0,
    pricePerShare: 0,
    expiresIn: 30 // days
  });
  const [buyQuantity, setBuyQuantity] = useState(0);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'marketplace') {
        await fetchP2PListings();
      } else {
        await fetchMyHoldings();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch active P2P listings
  const fetchP2PListings = async () => {
    const { data, error } = await supabase
      .from('sto_listings')
      .select(`
        *,
        seller:seller_id(email),
        asset:asset_id(
          id,
          data,
          estimated_cost
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      return;
    }

    const formatted = data?.map(listing => ({
      listingId: listing.id,
      assetId: listing.asset_id,
      assetName: listing.asset?.data?.asset_name || 'Unknown Asset',
      category: listing.asset?.data?.category || 'other',
      sellerEmail: listing.seller?.email || 'Anonymous',
      sellerId: listing.seller_id,
      sharesForSale: listing.shares_for_sale,
      pricePerShare: listing.price_per_share,
      totalValue: listing.total_value,
      createdAt: listing.created_at,
      expiresAt: listing.expires_at,
      transactionHash: listing.transaction_hash,
      // Calculate discount vs original price
      originalPrice: listing.asset?.estimated_cost / (listing.asset?.data?.total_supply || 100),
      image: listing.asset?.data?.images?.[0] || null
    })) || [];

    setListings(formatted);
  };

  // Fetch user's holdings (investments)
  const fetchMyHoldings = async () => {
    const { data, error } = await supabase
      .from('sto_investments')
      .select(`
        *,
        asset:asset_id(
          id,
          data,
          estimated_cost
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching holdings:', error);
      return;
    }

    // Group by asset to show total holdings
    const grouped = {};
    data?.forEach(investment => {
      const assetId = investment.asset_id;
      if (!grouped[assetId]) {
        grouped[assetId] = {
          assetId,
          assetName: investment.asset?.data?.asset_name || 'Unknown Asset',
          category: investment.asset?.data?.category || 'other',
          totalShares: 0,
          totalInvested: 0,
          avgPricePerShare: 0,
          currentPrice: investment.asset?.estimated_cost / (investment.asset?.data?.total_supply || 100),
          image: investment.asset?.data?.images?.[0] || null,
          investments: []
        };
      }
      grouped[assetId].totalShares += investment.shares_purchased;
      grouped[assetId].totalInvested += parseFloat(investment.investment_amount);
      grouped[assetId].investments.push(investment);
    });

    // Calculate averages
    Object.values(grouped).forEach(holding => {
      holding.avgPricePerShare = holding.totalInvested / holding.totalShares;
      holding.profitLoss = (holding.currentPrice - holding.avgPricePerShare) * holding.totalShares;
      holding.profitLossPercent = ((holding.currentPrice - holding.avgPricePerShare) / holding.avgPricePerShare) * 100;
    });

    setMyHoldings(Object.values(grouped));
  };

  // Handle sell - create listing
  const handleCreateListing = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (sellForm.shares <= 0 || sellForm.shares > selectedHolding.totalShares) {
      alert('Invalid share amount');
      return;
    }

    if (sellForm.pricePerShare <= 0) {
      alert('Invalid price');
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + sellForm.expiresIn);

      const { data, error } = await supabase
        .from('sto_listings')
        .insert([{
          seller_id: user.id,
          asset_id: selectedHolding.assetId,
          shares_for_sale: sellForm.shares,
          price_per_share: sellForm.pricePerShare,
          status: 'active',
          expires_at: expiresAt.toISOString()
        }])
        .select();

      if (error) throw error;

      alert('✅ Listing created successfully!');
      setShowSellModal(false);
      setSellForm({ shares: 0, pricePerShare: 0, expiresIn: 30 });
      fetchMyHoldings();
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Failed to create listing: ' + error.message);
    }
  };

  // Handle buy from P2P
  const handleBuyFromP2P = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (buyQuantity <= 0 || buyQuantity > selectedListing.sharesForSale) {
      alert('Invalid quantity');
      return;
    }

    try {
      // In production: Call smart contract here
      // For now: Mock transaction
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);

      const totalCost = buyQuantity * selectedListing.pricePerShare;
      const platformFee = totalCost * 0.025; // 2.5% platform fee
      const sellerAmount = totalCost - platformFee;

      // 1. Create investment record for buyer
      const { error: investError } = await supabase
        .from('sto_investments')
        .insert([{
          user_id: user.id,
          asset_id: selectedListing.assetId,
          shares_purchased: buyQuantity,
          investment_amount: totalCost,
          wallet_address: walletAddress,
          transaction_hash: mockTxHash,
          status: 'confirmed'
        }]);

      if (investError) throw investError;

      // 2. Create trade record
      const { error: tradeError } = await supabase
        .from('sto_trades')
        .insert([{
          listing_id: selectedListing.listingId,
          asset_id: selectedListing.assetId,
          seller_id: selectedListing.sellerId,
          buyer_id: user.id,
          shares_traded: buyQuantity,
          price_per_share: selectedListing.pricePerShare,
          total_amount: totalCost,
          platform_fee: platformFee,
          seller_amount: sellerAmount,
          transaction_hash: mockTxHash,
          trade_type: 'p2p_trade',
          status: 'completed'
        }]);

      if (tradeError) throw tradeError;

      // 3. Update listing
      if (buyQuantity === selectedListing.sharesForSale) {
        // Sold out - mark as sold
        await supabase
          .from('sto_listings')
          .update({
            status: 'sold',
            buyer_id: user.id,
            sold_at: new Date().toISOString(),
            transaction_hash: mockTxHash
          })
          .eq('id', selectedListing.listingId);
      } else {
        // Partial buy - reduce shares
        await supabase
          .from('sto_listings')
          .update({
            shares_for_sale: selectedListing.sharesForSale - buyQuantity
          })
          .eq('id', selectedListing.listingId);
      }

      alert('✅ Purchase successful!');
      setShowBuyModal(false);
      setBuyQuantity(0);
      fetchP2PListings();
    } catch (error) {
      console.error('Error buying from P2P:', error);
      alert('Purchase failed: ' + error.message);
    }
  };

  return (
    <div className="w-full h-full p-8 overflow-y-auto">
      {/* Header */}
      <PageHeader
        title="P2P Trading Marketplace"
        subtitle="Buy and sell tokenized asset shares with other investors"
      />

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'marketplace'
              ? 'text-gray-900 border-b-2 border-black'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <TrendingUp size={18} className="inline mr-2" />
          Marketplace ({listings.length})
        </button>
        <button
          onClick={() => setActiveTab('my-holdings')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'my-holdings'
              ? 'text-gray-900 border-b-2 border-black'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wallet size={18} className="inline mr-2" />
          My Holdings ({myHoldings.length})
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="newest">Newest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : activeTab === 'marketplace' ? (
        <MarketplaceListings
          listings={listings}
          onBuy={(listing) => {
            setSelectedListing(listing);
            setBuyQuantity(1);
            setShowBuyModal(true);
          }}
        />
      ) : (
        <MyHoldingsView
          holdings={myHoldings}
          onSell={(holding) => {
            setSelectedHolding(holding);
            setSellForm({
              shares: 1,
              pricePerShare: holding.currentPrice,
              expiresIn: 30
            });
            setShowSellModal(true);
          }}
        />
      )}

      {/* Sell Modal */}
      {showSellModal && (
        <SellModal
          holding={selectedHolding}
          form={sellForm}
          setForm={setSellForm}
          onSubmit={handleCreateListing}
          onClose={() => setShowSellModal(false)}
        />
      )}

      {/* Buy Modal */}
      {showBuyModal && (
        <BuyModal
          listing={selectedListing}
          quantity={buyQuantity}
          setQuantity={setBuyQuantity}
          onSubmit={handleBuyFromP2P}
          onClose={() => setShowBuyModal(false)}
        />
      )}
    </div>
  );
}

// Marketplace Listings Component
function MarketplaceListings({ listings, onBuy }) {
  if (listings.length === 0) {
    return (
      <div className="text-center py-20">
        <Share2 size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 text-lg">No active listings at the moment</p>
        <p className="text-gray-500 text-sm mt-2">Check back soon for new opportunities</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => {
        const discount = listing.originalPrice > 0
          ? ((listing.originalPrice - listing.pricePerShare) / listing.originalPrice * 100).toFixed(1)
          : 0;
        const isDiscount = discount > 0;

        return (
          <div key={listing.listingId} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            {/* Asset Image */}
            {listing.image && (
              <img
                src={listing.image}
                alt={listing.assetName}
                className="w-full h-40 object-cover rounded-lg mb-4"
              />
            )}

            {/* Asset Info */}
            <h3 className="font-bold text-lg text-gray-900 mb-2">{listing.assetName}</h3>
            <p className="text-sm text-gray-500 mb-4">Seller: {listing.sellerEmail}</p>

            {/* Pricing */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Price per share</span>
                <span className="font-bold text-gray-900">${listing.pricePerShare.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Shares available</span>
                <span className="font-semibold text-gray-900">{listing.sharesForSale}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total value</span>
                <span className="font-bold text-gray-900">${listing.totalValue.toLocaleString()}</span>
              </div>
            </div>

            {/* Discount Badge */}
            {isDiscount && (
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  {discount}% below original price
                </span>
              </div>
            )}

            {/* Buy Button */}
            <Button
              onClick={() => onBuy(listing)}
              variant="primary"
              size="md"
              fullWidth
            >
              Buy Shares
            </Button>

            {/* Listed Date */}
            <p className="text-xs text-gray-500 mt-3 text-center">
              Listed {new Date(listing.createdAt).toLocaleDateString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// My Holdings Component
function MyHoldingsView({ holdings, onSell }) {
  if (holdings.length === 0) {
    return (
      <div className="text-center py-20">
        <Wallet size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 text-lg">You don't have any holdings yet</p>
        <p className="text-gray-500 text-sm mt-2">Start by investing in assets from the marketplace</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {holdings.map((holding) => {
        const isProfitable = holding.profitLoss >= 0;

        return (
          <div key={holding.assetId} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-6">
              {/* Asset Image */}
              {holding.image && (
                <img
                  src={holding.image}
                  alt={holding.assetName}
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}

              {/* Details */}
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-900 mb-2">{holding.assetName}</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Shares</p>
                    <p className="font-bold text-gray-900">{holding.totalShares}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg Price</p>
                    <p className="font-bold text-gray-900">${holding.avgPricePerShare.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Current Price</p>
                    <p className="font-bold text-gray-900">${holding.currentPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Invested</p>
                    <p className="font-bold text-gray-900">${holding.totalInvested.toLocaleString()}</p>
                  </div>
                </div>

                {/* Profit/Loss */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isProfitable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isProfitable ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  <span className="font-bold">
                    {isProfitable ? '+' : ''}${holding.profitLoss.toLocaleString()}
                    ({holding.profitLossPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Sell Button */}
              <Button
                onClick={() => onSell(holding)}
                variant="primary"
                size="md"
                className="whitespace-nowrap"
              >
                Sell Shares
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Sell Modal Component
function SellModal({ holding, form, setForm, onSubmit, onClose }) {
  const totalValue = form.shares * form.pricePerShare;
  const platformFee = totalValue * 0.025;
  const youReceive = totalValue - platformFee;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Sell Shares</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle size={24} />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Asset</p>
          <p className="font-bold text-gray-900">{holding.assetName}</p>
          <p className="text-xs text-gray-500 mt-1">You own {holding.totalShares} shares</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Shares to Sell
            </label>
            <input
              type="number"
              min="1"
              max={holding.totalShares}
              value={form.shares}
              onChange={(e) => setForm({...form, shares: parseInt(e.target.value) || 0})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price per Share (USD)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.pricePerShare}
              onChange={(e) => setForm({...form, pricePerShare: parseFloat(e.target.value) || 0})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            <p className="text-xs text-gray-500 mt-1">
              Current market: ${holding.currentPrice.toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Listing Expires In (days)
            </label>
            <select
              value={form.expiresIn}
              onChange={(e) => setForm({...form, expiresIn: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Value</span>
            <span className="font-semibold text-gray-900">${totalValue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Platform Fee (2.5%)</span>
            <span className="text-red-600">-${platformFee.toLocaleString()}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="font-semibold text-gray-900">You Receive</span>
            <span className="font-bold text-green-600">${youReceive.toLocaleString()}</span>
          </div>
        </div>

        <Button
          onClick={onSubmit}
          disabled={form.shares <= 0 || form.pricePerShare <= 0}
          variant="primary"
          size="lg"
          fullWidth
        >
          Create Listing
        </Button>
      </div>
    </div>
  );
}

// Buy Modal Component
function BuyModal({ listing, quantity, setQuantity, onSubmit, onClose }) {
  const totalCost = quantity * listing.pricePerShare;
  const maxQuantity = listing.sharesForSale;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Buy Shares</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle size={24} />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Asset</p>
          <p className="font-bold text-gray-900">{listing.assetName}</p>
          <p className="text-xs text-gray-500 mt-1">Seller: {listing.sellerEmail}</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Shares
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Minus size={18} />
            </button>
            <input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
              className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Plus size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Available: {maxQuantity} shares
          </p>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Price per Share</span>
            <span className="font-semibold text-gray-900">${listing.pricePerShare.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Quantity</span>
            <span className="font-semibold text-gray-900">{quantity}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="font-semibold text-gray-900">Total Cost</span>
            <span className="font-bold text-gray-900">${totalCost.toLocaleString()}</span>
          </div>
        </div>

        <Button
          onClick={onSubmit}
          disabled={quantity <= 0 || quantity > maxQuantity}
          variant="primary"
          size="lg"
          fullWidth
        >
          Buy Shares
        </Button>
      </div>
    </div>
  );
}
