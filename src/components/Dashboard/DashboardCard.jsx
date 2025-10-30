import React from 'react';
import { ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * DashboardCard Component
 *
 * Reusable clickable card for dashboard metrics
 *
 * Props:
 * - icon: Lucide icon component
 * - title: Card title
 * - value: Main metric value (number or string)
 * - subtitle: Secondary information
 * - badge: Optional badge text (e.g., "NEW", "+12%")
 * - badgeColor: Badge background color (e.g., "bg-green-100 text-green-700")
 * - onClick: Click handler for navigation
 * - trend: Optional trend indicator (up/down)
 * - loading: Loading state
 */
const DashboardCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  badge,
  badgeColor = 'bg-blue-100 text-blue-700',
  onClick,
  trend,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-6 bg-gray-300 rounded-lg mb-4"></div>
        <div className="h-4 w-24 bg-gray-300 rounded mb-3"></div>
        <div className="h-8 w-32 bg-gray-300 rounded mb-2"></div>
        <div className="h-3 w-40 bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-2xl p-6
        hover:bg-white/50 hover:border-gray-400/50 hover:shadow-xl
        transition-all duration-300 ease-in-out
        transform hover:scale-[1.02] active:scale-[0.98]
        text-left w-full group relative overflow-hidden"
    >
      {/* Hover effect gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0
        group-hover:from-blue-50/30 group-hover:to-purple-50/30
        transition-all duration-300 rounded-2xl"></div>

      <div className="relative z-10">
        {/* Header with icon and badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-900/5 rounded-xl group-hover:bg-gray-900/10 transition-colors">
              <Icon size={20} className="text-gray-900" />
            </div>
            {badge && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
                {badge}
              </span>
            )}
          </div>
          <ArrowUpRight
            size={18}
            className="text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
          />
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>

        {/* Value with trend indicator */}
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString('en-US') : value}
          </p>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.direction === 'up' ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>

        {/* Subtitle */}
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </button>
  );
};

export default DashboardCard;
