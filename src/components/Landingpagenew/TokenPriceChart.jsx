import React from 'react';

const TokenPriceChart = ({
  chartData,
  tokenPrice,
  priceChange,
  chartPeriod,
  onPeriodChange
}) => {
  return (
    <div className="space-y-4">
      {/* Chart Header - Token Price */}
      <div>
        <div className="flex items-baseline gap-3 mb-1">
          <h2 className="text-4xl font-light text-gray-900">
            ${tokenPrice.toFixed(6)}
          </h2>
          <span className="text-sm font-light text-green-600">
            +{priceChange}%
          </span>
        </div>
        <p className="text-sm font-light text-gray-600">Token Price (USD)</p>
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-2">
        {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((period) => (
          <button
            key={period}
            onClick={() => onPeriodChange(period)}
            className={`px-3 py-1 rounded-lg text-xs font-light transition-colors ${
              chartPeriod === period
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900 bg-white/40'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-48 relative">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* Grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="#f3f4f6" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#f3f4f6" strokeWidth="0.5" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#f3f4f6" strokeWidth="0.5" />

          {/* Gradient fill */}
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1f2937" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#1f2937" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path
            d={`M 0,${chartData[0].y} ${chartData.map((d) => `L ${d.x},${d.y}`).join(' ')} L 100,100 L 0,100 Z`}
            fill="url(#chartGradient)"
          />

          {/* Line */}
          <path
            d={`M 0,${chartData[0].y} ${chartData.map((d) => `L ${d.x},${d.y}`).join(' ')}`}
            fill="none"
            stroke="#1f2937"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* X-axis labels (months) */}
        <div className="flex justify-between mt-2 px-1">
          {chartData.map((point, index) => (
            <span
              key={index}
              className="text-xs font-light text-gray-500"
            >
              {point.month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TokenPriceChart;
