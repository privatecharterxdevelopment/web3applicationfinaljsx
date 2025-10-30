import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

/**
 * BalanceHeader Component
 *
 * Displays total portfolio balance with monthly income and expense cards
 *
 * Props:
 * - totalBalance: Total balance in USD
 * - monthlyIncome: Income this month
 * - monthlyExpense: Expenses this month
 * - loading: Loading state
 */
const BalanceHeader = ({ totalBalance, monthlyIncome, monthlyExpense, loading = false }) => {
  const formatCurrency = (value) => {
    if (!value || isNaN(value)) return '0.00';
    return Number(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  if (loading) {
    return (
      <div className="bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-2xl p-8 mb-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-300 rounded mb-3"></div>
        <div className="h-12 w-64 bg-gray-300 rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-24 bg-gray-300 rounded-xl"></div>
          <div className="h-24 bg-gray-300 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-2xl p-8 mb-6">
      {/* Total Balance */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-600 mb-2">Total Portfolio Balance</p>
        <div className="flex items-baseline gap-2">
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
            ${formatCurrency(totalBalance)}
          </h1>
          <span className="text-lg font-medium text-gray-500">USD</span>
        </div>
      </div>

      {/* Monthly Income & Expense Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly Income Card */}
        <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 border border-green-200/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp size={18} className="text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">This Month Income</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">
              ${formatCurrency(monthlyIncome)}
            </p>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            From bookings, rewards, and investments
          </p>
        </div>

        {/* Monthly Expense Card */}
        <div className="bg-gradient-to-br from-red-50/50 to-rose-50/50 border border-red-200/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown size={18} className="text-red-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">This Month Expenses</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">
              ${formatCurrency(monthlyExpense)}
            </p>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Bookings, subscriptions, and fees
          </p>
        </div>
      </div>
    </div>
  );
};

export default BalanceHeader;
