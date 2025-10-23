import React, { useState, useEffect } from 'react';
import {
  Coins, TrendingUp, Users, DollarSign, ExternalLink, RefreshCw,
  AlertCircle, CheckCircle, Clock, Plus, Wallet, ArrowUpRight,
  ArrowDownRight, Copy, Check, Shield, Info
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { web3Service } from '../../lib/web3';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../../thefinalwebapplicationpcx-main/src/context/AuthContext';
import PageHeader from './PageHeader';
import Button from './Button';

export default function STOUTLDashboard() {
  const { user } = useAuth();
  const { address: walletAddress, isConnected, chain } = useAccount();
  const [loading, setLoading] = useState(true);
  const [createdAssets, setCreatedAssets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalRoyalties: 0,
    totalSales: 0,
    activeListings: 0
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user?.id && isConnected && walletAddress) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user?.id, isConnected, walletAddress]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCreatedAssets(),
        fetchTransactions()
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreatedAssets = async () => {
    try {
      // Fetch tokenization requests from user_requests
      const { data: tokenizations, error } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'tokenization')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format assets data
      const formattedAssets = tokenizations?.map(asset => ({
        id: asset.id,
        name: asset.data?.asset_name || 'Unnamed Asset',
        type: asset.data?.asset_type || 'Unknown',
        tokenType: asset.data?.token_type || 'NFT',
        value: asset.estimated_cost || 0,
        totalSupply: asset.data?.total_supply || 1,
        sold: 0, // Will be calculated from OpenSea API in production
        status: asset.status,
        createdAt: asset.created_at,
        openseaUrl: asset.data?.opensea_url || null,
        contractAddress: asset.data?.contract_address || null
      })) || [];

      setCreatedAssets(formattedAssets);

      // Update stats
      setStats(prev => ({
        ...prev,
        totalAssets: formattedAssets.length,
        activeListings: formattedAssets.filter(a => a.status === 'active').length
      }));
    } catch (error) {
      console.error('Failed to fetch created assets:', error);
      setCreatedAssets([]);
    }
  };

  const fetchTransactions = async () => {
    try {
      // Mock transaction data - in production, fetch from OpenSea API
      const mockTransactions = [
        {
          id: '1',
          type: 'sale',
          assetName: 'Premium Real Estate Token #42',
          buyer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          seller: walletAddress,
          amount: '2.5 ETH',
          royalty: '0.25 ETH',
          timestamp: Date.now() - 86400000,
          txHash: '0x1234567890abcdef...'
        },
        {
          id: '2',
          type: 'mint',
          assetName: 'Luxury Yacht Share #15',
          buyer: walletAddress,
          seller: null,
          amount: '0 ETH',
          royalty: '0 ETH',
          timestamp: Date.now() - 172800000,
          txHash: '0xabcdef1234567890...'
        }
      ];

      setTransactions(mockTransactions);

      // Calculate total royalties
      const totalRoyalties = mockTransactions
        .filter(tx => tx.type === 'sale')
        .reduce((sum, tx) => sum + parseFloat(tx.royalty.split(' ')[0]), 0);

      const totalSales = mockTransactions
        .filter(tx => tx.type === 'sale').length;

      setStats(prev => ({
        ...prev,
        totalRoyalties,
        totalSales
      }));
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
    }
  };

  const copyAddress = (address) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isConnected || !walletAddress) {
    return (
      <div className="w-full h-full bg-transparent flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <Wallet size={64} className="text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet on Base Network to access your STO/UTL dashboard
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Info size={20} className="text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-800">
              Make sure to connect the wallet that created your NFTs and security tokens
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (chain?.id !== 8453) {
    return (
      <div className="w-full h-full bg-transparent flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <AlertCircle size={64} className="text-orange-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Wrong Network</h2>
          <p className="text-gray-600 mb-6">
            Please switch to Base Network to view your assets and transactions
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full bg-transparent flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
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
            title="STO / UTL Dashboard"
            subtitle="Manage your Security Tokens and Utility Tokens"
            action={
              <Button
                onClick={fetchDashboardData}
                variant="secondary"
                size="sm"
                icon={<RefreshCw size={16} />}
              >
                Refresh
              </Button>
            }
          />

          {/* Wallet Info */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Shield size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Connected Wallet</p>
                <p className="text-sm font-mono font-medium text-gray-900">
                  {web3Service.formatAddress(walletAddress)}
                </p>
              </div>
            </div>
            <Button
              onClick={() => copyAddress(walletAddress)}
              variant="ghost"
              size="sm"
              icon={copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Coins size={24} className="text-gray-600" />
              <TrendingUp size={16} className="text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalAssets}</h3>
            <p className="text-sm text-gray-500">Created Assets</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <DollarSign size={24} className="text-gray-600" />
              <span className="text-xs font-medium text-green-600">+{stats.totalRoyalties} ETH</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalRoyalties.toFixed(2)} ETH</h3>
            <p className="text-sm text-gray-500">Total Royalties</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Users size={24} className="text-gray-600" />
              <span className="text-xs font-medium text-gray-500">{stats.totalSales} sales</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalSales}</h3>
            <p className="text-sm text-gray-500">Total Sales</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle size={24} className="text-gray-600" />
              <span className="text-xs font-medium text-gray-500">Active</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.activeListings}</h3>
            <p className="text-sm text-gray-500">Active Listings</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Created Assets */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Your Created Assets</h2>
                <Button
                  onClick={() => {/* Navigate to tokenize */}}
                  variant="ghost"
                  size="sm"
                  icon={<Plus size={16} />}
                >
                  Create New
                </Button>
              </div>

              <div className="space-y-4">
                {createdAssets.length === 0 ? (
                  <div className="text-center py-12">
                    <Coins size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No assets created yet</p>
                    <p className="text-sm text-gray-400">
                      Start tokenizing your assets to see them here
                    </p>
                  </div>
                ) : (
                  createdAssets.map((asset) => (
                    <div key={asset.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900">{asset.name}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(asset.status)}`}>
                              {asset.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {asset.tokenType} • {asset.type}
                          </p>
                        </div>
                        {asset.openseaUrl && (
                          <a
                            href={asset.openseaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-gray-500">Total Supply</p>
                          <p className="text-sm font-bold text-gray-900">{asset.totalSupply}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Sold</p>
                          <p className="text-sm font-bold text-gray-900">{asset.sold}/{asset.totalSupply}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Value</p>
                          <p className="text-sm font-bold text-gray-900">${asset.value.toLocaleString()}</p>
                        </div>
                      </div>

                      {asset.contractAddress && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Contract Address</p>
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono text-gray-600 flex-1 truncate">
                              {asset.contractAddress}
                            </code>
                            <button
                              onClick={() => copyAddress(asset.contractAddress)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              </div>

              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock size={32} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No transactions yet</p>
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div key={tx.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          tx.type === 'sale' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {tx.type === 'sale' ? (
                            <ArrowUpRight size={16} className="text-green-600" />
                          ) : (
                            <Plus size={16} className="text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {tx.type === 'sale' ? 'Sale' : 'Minted'}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">{tx.assetName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">{formatDate(tx.timestamp)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{tx.amount}</p>
                          {tx.type === 'sale' && (
                            <p className="text-xs text-green-600">+{tx.royalty} royalty</p>
                          )}
                        </div>
                      </div>

                      {tx.buyer && tx.buyer !== walletAddress && (
                        <div className="mt-2 ml-11">
                          <p className="text-xs text-gray-500">
                            Buyer: <code className="font-mono">{web3Service.formatAddress(tx.buyer)}</code>
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {transactions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a
                    href={`https://basescan.org/address/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    View all on BaseScan
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">OpenSea Integration</h4>
                  <p className="text-xs text-blue-800">
                    All NFTs are created and verified on OpenSea for security and authenticity.
                    Transactions and royalties are tracked automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
