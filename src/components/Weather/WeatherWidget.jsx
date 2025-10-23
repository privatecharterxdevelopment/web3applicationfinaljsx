import React from 'react';
import { Cloud, CloudRain, Sun, Wind } from 'lucide-react';

const WeatherWidget = ({ location, weather }) => {
  if (!weather) return null;

  const getWeatherIcon = (condition) => {
    const conditionLower = condition?.toLowerCase() || '';
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      return <CloudRain size={32} className="text-black/40" />;
    }
    if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
      return <Cloud size={32} className="text-black/40" />;
    }
    if (conditionLower.includes('wind')) {
      return <Wind size={32} className="text-black/40" />;
    }
    return <Sun size={32} className="text-black/40" />;
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-black/5 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] text-black/30 tracking-widest uppercase mb-2">DESTINATION WEATHER</p>
          <p className="text-sm text-black/60 font-light">{location}</p>
        </div>
        {getWeatherIcon(weather.condition)}
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-4xl font-light text-black">{weather.temp}°</span>
        <span className="text-sm text-black/40">celsius</span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-black/30 tracking-widest uppercase">Conditions</span>
          <span className="text-xs text-black/60">{weather.condition}</span>
        </div>

        {weather.wind && (
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-black/30 tracking-widest uppercase">Wind</span>
            <span className="text-xs text-black/60">{weather.wind} km/h</span>
          </div>
        )}

        {weather.humidity && (
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-black/30 tracking-widest uppercase">Humidity</span>
            <span className="text-xs text-black/60">{weather.humidity}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherWidget;