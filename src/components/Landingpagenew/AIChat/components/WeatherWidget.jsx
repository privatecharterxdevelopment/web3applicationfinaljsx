import React from 'react';

// Weather Widget - Light gray design
const WeatherWidget = ({ location, weather }) => {
  if (!weather) return null;
  return (
    <div className="bg-gray-200 border border-gray-300 rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-600 font-medium mb-0.5">{location}</p>
          <p className="text-2xl font-semibold text-black">{weather.temp}°C</p>
        </div>
        <p className="text-sm text-gray-700">{weather.condition}</p>
      </div>
    </div>
  );
};

export default WeatherWidget;
