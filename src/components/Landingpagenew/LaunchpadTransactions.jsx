import React, { useState, useEffect } from 'react';
import { Rocket, Copy, CheckCircle, Loader2, Calendar, ExternalLink, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAccount } from 'wagmi';

export default function LaunchpadTransactions({ limit = null, showHeader = true, onViewAll = null }) {
  const { address: walletAddress } = useAccount();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (walletAddress) {
      fetchTransactions();
    } else {
      setLoading(false);
      setTransactions([]);
    }
  }, [walletAddress, limit]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('launchpad_transactions')
        .select(`
          *,
          launch:launchpad_projects(name, image_url, category)
        `)
        .eq('wallet_address', walletAddress.toLowerCase())
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching launchpad transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const copySignature = (signature) => {
    navigator.clipboard.writeText(signature);
  };

  const getActionLabel = (type) => {
    switch (type) {
      case 'waitlist_join':
        return 'Joined Waitlist';
      case 'investment':
        return 'Investment';
      case 'refund':
        return 'Refund';
      default:
        return type;
    }
  };

  const getActionColor = (type) => {
    switch (type) {
      case 'waitlist_join':
        return 'text-purple-600';
      case 'investment':
        return 'text-green-600';
      case 'refund':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="w-full bg-transparent flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-light">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className="text-center py-20">
        <Rocket size={64} className="text-gray-300 mx-auto mb-6" />
        <h3 className="text-xl font-light text-gray-900 mb-2">Wallet Not Connected</h3>
        <p className="text-gray-600 font-light">
          Connect your wallet to view launchpad transactions
        </p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-20">
        <Rocket size={64} className="text-gray-300 mx-auto mb-6" />
        <h3 className="text-xl font-light text-gray-900 mb-2">No Transactions Yet</h3>
        <p className="text-gray-600 font-light mb-4">
          Join a waitlist to see your signatures here
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-transparent">
      {showHeader && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-light text-gray-900">Signed Transactions</h2>
            {onViewAll && (
              <button
                onClick={onViewAll}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light"
              >
                See All →
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left side: Launch info */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {tx.launch?.image_url && (
                  <div className="flex-shrink-0">
                    <img
                      src={tx.launch.image_url}
                      alt={tx.launch?.name || 'Launch'}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium ${getActionColor(tx.transaction_type)}`}>
                      {getActionLabel(tx.transaction_type)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      {tx.launch?.category || 'Asset'}
                    </span>
                  </div>
                  <h3 className="text-base font-light text-gray-900 mb-2 truncate">
                    {tx.launch?.name || 'Unknown Launch'}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500 font-light">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {formatDate(tx.created_at)}
                    </span>
                    <span>{formatTime(tx.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Right side: Signature and status */}
              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                {/* Status badge */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  tx.status === 'completed'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}>
                  {tx.status === 'completed' && <CheckCircle size={14} />}
                  {tx.status === 'pending' && <Loader2 size={14} className="animate-spin" />}
                  {tx.status === 'completed' ? 'Completed' : 'Pending'}
                </span>

                {/* Signature */}
                {tx.signature && (
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                    <code className="text-xs font-mono text-gray-600">
                      {tx.signature.slice(0, 6)}...{tx.signature.slice(-4)}
                    </code>
                    <button
                      onClick={() => copySignature(tx.signature)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Copy signature"
                    >
                      <Copy size={14} className="text-gray-500" />
                    </button>
                  </div>
                )}

                {/* Amount if exists */}
                {tx.amount && (
                  <span className="text-sm font-light text-gray-900">
                    ${tx.amount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View all footer for limited view */}
      {limit && transactions.length >= limit && onViewAll && (
        <div className="mt-6">
          <button
            onClick={onViewAll}
            className="w-full py-3 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-xl transition-all font-light bg-white/50 hover:bg-white/80 backdrop-blur-sm"
          >
            View All Transactions →
          </button>
        </div>
      )}
    </div>
  );
}
