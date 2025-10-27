import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  metadata: any;
  created_at: string;
  user?: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface TransactionStats {
  totalVolume: number;
  totalCount: number;
  bonuses: number;
  rewards: number;
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    totalVolume: 0,
    totalCount: 0,
    bonuses: 0,
    rewards: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'admin_bonus' | 'booking_reward' | 'co2_reward'>('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(false);

      // Fetch PVCX transactions
      const { data, error } = await supabase
        .from('pvcx_transactions')
        .select(`
          *,
          user:user_id (
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setTransactions(data || []);

      // Calculate stats
      const totalVolume = data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalCount = data?.length || 0;
      const bonuses = data?.filter(t => t.type === 'admin_bonus').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const rewards = data?.filter(t => t.type.includes('reward')).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      setStats({ totalVolume, totalCount, bonuses, rewards });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'admin_bonus':
        return 'bg-green-100 text-green-800';
      case 'booking_reward':
        return 'bg-blue-100 text-blue-800';
      case 'co2_reward':
        return 'bg-purple-100 text-purple-800';
      case 'referral':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'admin_bonus' || type.includes('reward')) {
      return <TrendingUp className="w-4 h-4" />;
    }
    return <TrendingDown className="w-4 h-4" />;
  };

  const formatType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">PVCX Transactions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track all PVCX token transactions, bonuses, and rewards
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Volume</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.totalVolume.toFixed(2)} PVCX</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.totalCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Bonuses Issued</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.bonuses.toFixed(2)} PVCX</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Rewards Paid</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.rewards.toFixed(2)} PVCX</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('admin_bonus')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'admin_bonus'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bonuses
          </button>
          <button
            onClick={() => setFilter('booking_reward')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'booking_reward'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Booking Rewards
          </button>
          <button
            onClick={() => setFilter('co2_reward')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'co2_reward'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            CO2 Rewards
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {transaction.user?.first_name} {transaction.user?.last_name}
                  </div>
                  <div className="text-sm text-gray-500">{transaction.user?.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                    {getTypeIcon(transaction.type)}
                    <span className="ml-1">{formatType(transaction.type)}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    +{Number(transaction.amount).toFixed(2)} PVCX
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{transaction.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(transaction.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all'
                ? 'No transactions have been made yet.'
                : `No ${formatType(filter)} transactions found.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
