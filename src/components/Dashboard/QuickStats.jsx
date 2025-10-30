import React from 'react';
import { TrendingUp, Target, Award, Zap } from 'lucide-react';

/**
 * QuickStats Component
 *
 * Displays 4 quick summary statistics in a compact grid
 *
 * Props:
 * - stats: Object containing quick stat values
 *   - memberSince: Registration date
 *   - totalValue: Total portfolio value
 *   - completionRate: Success rate percentage
 *   - activityScore: User activity score
 * - loading: Loading state
 */
const QuickStats = ({ stats, loading = false }) => {
  const quickStats = [
    {
      icon: Award,
      label: 'Member Since',
      value: stats?.memberSince || '-',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: TrendingUp,
      label: 'Total Value',
      value: stats?.totalValue ? `$${Number(stats.totalValue).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '$0',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: Target,
      label: 'Completion Rate',
      value: stats?.completionRate ? `${stats.completionRate}%` : '0%',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: Zap,
      label: 'Activity Score',
      value: stats?.activityScore || '0',
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-xl p-4 animate-pulse">
            <div className="w-8 h-8 bg-gray-300 rounded-lg mb-3"></div>
            <div className="h-3 w-20 bg-gray-300 rounded mb-2"></div>
            <div className="h-5 w-16 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {quickStats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-xl p-4
              hover:bg-white/50 hover:border-gray-400/50 transition-all duration-200"
          >
            <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={20} className={stat.color} />
            </div>
            <p className="text-xs font-medium text-gray-600 mb-1">{stat.label}</p>
            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
};

export default QuickStats;
