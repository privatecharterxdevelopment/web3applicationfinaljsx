import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

/**
 * MultiLineChart Component
 *
 * Displays 4 metrics on a single chart with dual Y-axes:
 * - Portfolio Value (USD) - Left axis
 * - Booking Revenue (EUR) - Left axis
 * - PVCX Balance (tokens) - Right axis
 * - Transaction Count - Right axis
 */
const MultiLineChart = ({ data, loading }) => {
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-white/90 backdrop-blur-xl border border-gray-300/50 rounded-xl p-4 shadow-2xl">
        <p className="text-sm font-semibold text-gray-900 mb-2">
          {format(new Date(label), 'MMM dd, yyyy')}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-600">{entry.name}</span>
              </div>
              <span className="text-xs font-medium text-gray-900">
                {entry.name.includes('Portfolio') || entry.name.includes('Revenue')
                  ? `${entry.name.includes('Portfolio') ? '$' : '€'}${Number(entry.value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                  : Number(entry.value).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Format X-axis date labels
  const formatXAxis = (dateStr) => {
    const date = new Date(dateStr);
    return format(date, 'MMM dd');
  };

  // Format Y-axis labels for USD/EUR
  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toFixed(0);
  };

  // Format Y-axis labels for counts
  const formatCount = (value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value;
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-2xl p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-96 bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-2xl p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-600">No data available yet</p>
          <p className="text-xs text-gray-500 mt-2">
            Start using the platform to see your activity chart
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Lifetime Activity Overview
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />

          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            interval="preserveStartEnd"
          />

          {/* Left Y-axis for USD/EUR values */}
          <YAxis
            yAxisId="currency"
            tickFormatter={formatCurrency}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Value (USD/EUR)', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#6b7280' } }}
          />

          {/* Right Y-axis for counts */}
          <YAxis
            yAxisId="count"
            orientation="right"
            tickFormatter={formatCount}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Count/Balance', angle: 90, position: 'insideRight', style: { fontSize: '12px', fill: '#6b7280' } }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            iconType="line"
          />

          {/* Line 1: Portfolio Value (Black) */}
          <Line
            yAxisId="currency"
            type="monotone"
            dataKey="portfolio_value"
            stroke="#000000"
            strokeWidth={2}
            name="Portfolio (USD)"
            dot={false}
            activeDot={{ r: 6 }}
          />

          {/* Line 2: Booking Revenue (Indigo) */}
          <Line
            yAxisId="currency"
            type="monotone"
            dataKey="booking_revenue"
            stroke="#6366f1"
            strokeWidth={2}
            name="Revenue (EUR)"
            dot={false}
            activeDot={{ r: 6 }}
          />

          {/* Line 3: PVCX Balance (Green) */}
          <Line
            yAxisId="count"
            type="monotone"
            dataKey="pvcx_balance"
            stroke="#10b981"
            strokeWidth={2}
            name="PVCX Tokens"
            dot={false}
            activeDot={{ r: 6 }}
          />

          {/* Line 4: Transaction Count (Amber) */}
          <Line
            yAxisId="count"
            type="monotone"
            dataKey="transaction_count"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Transactions"
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MultiLineChart;
