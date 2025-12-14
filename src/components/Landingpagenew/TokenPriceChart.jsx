import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

const TokenPriceChart = ({
  chartData,
  tokenPrice,
  priceChange,
  chartPeriod,
  onPeriodChange
}) => {
  // Convert SVG chartData to Recharts format
  const rechartsData = chartData.map((point, index) => ({
    name: point.month || index,
    value: 100 - point.y, // Invert y since SVG y was inverted
  }));

  return (
    <div className="space-y-3">
      {/* Chart Header - Token Price */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <h2 className="text-2xl sm:text-3xl font-medium text-gray-900">
              ${tokenPrice.toFixed(6)}
            </h2>
            <span className={`text-xs font-medium ${priceChange >= 0 ? 'text-gray-600' : 'text-gray-500'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange}%
            </span>
          </div>
          <p className="text-xs text-gray-500">Token Price (USD)</p>
        </div>
      </div>

      {/* Recharts Line Chart - matching CryptoBalanceDashboard style */}
      <div className="h-24 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rechartsData}>
            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
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

      {/* X-axis time labels */}
      <div className="flex justify-between text-[10px] text-gray-400 px-2">
        {chartData.length > 0 && (
          <>
            <span>{chartData[0]?.month || 'Start'}</span>
            <span>{chartData[Math.floor(chartData.length / 2)]?.month || ''}</span>
            <span>Now</span>
          </>
        )}
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-1 pt-2 border-t border-gray-200/50">
        {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((period) => (
          <button
            key={period}
            onClick={() => onPeriodChange(period)}
            className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all ${
              chartPeriod === period
                ? 'bg-black text-white'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
            }`}
          >
            {period}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TokenPriceChart;
