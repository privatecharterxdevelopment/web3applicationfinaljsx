import React, { useState, useEffect } from 'react';
import { X, Cloud, MapPin, Thermometer, Wind, Eye, Droplets, Navigation, Plane, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { Location } from '../types';

interface WeatherWidgetProps {
  location: Location;
  origin?: Location | null;
  onClose: () => void;
}

interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  icon: string;
  feelsLike: number;
}

export default function WeatherWidget({ location, origin, onClose }: WeatherWidgetProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(true); // Start minimized by default

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      if (!location?.lat || !location?.lng) return;
      
      try {
        setLoading(true);
        
        // Enhanced mock data based on location and current time
        const getMockWeatherByLocation = () => {
          const locationName = formatLocation(location).toLowerCase();
          const currentHour = new Date().getHours();
          const isDay = currentHour >= 6 && currentHour < 20;
          
          if (locationName.includes('london')) {
            return {
              temperature: isDay ? 14 : 11,
              description: currentHour < 12 ? 'light rain' : 'overcast clouds',
              humidity: 82,
              windSpeed: isDay ? 22 : 18,
              visibility: 9,
              icon: isDay ? '10d' : '04n',
              feelsLike: isDay ? 12 : 8
            };
          } else if (locationName.includes('zurich') || locationName.includes('geneva')) {
            return {
              temperature: isDay ? 19 : 15,
              description: 'partly cloudy',
              humidity: 68,
              windSpeed: 14,
              visibility: 18,
              icon: isDay ? '02d' : '02n',
              feelsLike: isDay ? 21 : 13
            };
          } else if (locationName.includes('paris')) {
            return {
              temperature: isDay ? 23 : 19,
              description: currentHour < 10 ? 'clear sky' : 'few clouds',
              humidity: 58,
              windSpeed: 12,
              visibility: 25,
              icon: isDay ? '01d' : '02n',
              feelsLike: isDay ? 25 : 17
            };
          } else if (locationName.includes('amsterdam')) {
            return {
              temperature: isDay ? 17 : 14,
              description: 'scattered clouds',
              humidity: 75,
              windSpeed: 19,
              visibility: 15,
              icon: isDay ? '03d' : '03n',
              feelsLike: isDay ? 15 : 12
            };
          } else {
            return {
              temperature: isDay ? 22 : 18,
              description: isDay ? 'partly cloudy' : 'clear sky',
              humidity: 62,
              windSpeed: 15,
              visibility: 20,
              icon: isDay ? '02d' : '01n',
              feelsLike: isDay ? 24 : 16
            };
          }
        };
        
        setWeatherData(getMockWeatherByLocation());
        
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location]);

  const formatLocation = (loc: Location) => {
    if (!loc?.address) return 'Unknown Location';
    const parts = loc.address.split('(');
    return parts[0].trim();
  };

  const getWeatherIcon = (iconCode: string) => {
    const iconMap: { [key: string]: string } = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[iconCode] || '🌤️';
  };

  const getFlightConditions = () => {
    if (!weatherData) return { status: 'unknown', message: 'Checking conditions...' };
    
    const { windSpeed, visibility, description } = weatherData;
    
    if (windSpeed > 50 || visibility < 3 || description.includes('thunderstorm')) {
      return { status: 'poor', message: 'Challenging conditions' };
    } else if (windSpeed > 30 || visibility < 8 || description.includes('rain')) {
      return { status: 'fair', message: 'Moderate conditions' };
    } else {
      return { status: 'good', message: 'Excellent conditions' };
    }
  };

  const flightConditions = getFlightConditions();

  // Loading state for minimized widget
  if (loading && isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-lg z-50 p-2.5">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-xs text-gray-600 font-medium">Loading weather...</span>
        </div>
      </div>
    );
  }

  // Improved minimized state - more compact and refined
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group z-50 p-2.5 flex items-center gap-2.5 min-w-[120px] max-w-[160px]"
        title="Expand weather details"
      >
        {weatherData && (
          <>
            {/* Weather Icon */}
            <div className="flex-shrink-0">
              <span className="text-lg leading-none">{getWeatherIcon(weatherData.icon)}</span>
            </div>
            
            {/* Weather Info */}
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-semibold text-gray-900 leading-tight">
                {weatherData.temperature}°C
              </div>
              <div className="text-xs text-gray-600 truncate leading-tight">
                {weatherData.description}
              </div>
            </div>
            
            {/* Flight Status Indicator */}
            <div className="flex-shrink-0 flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${
                flightConditions.status === 'good' ? 'bg-green-500' :
                flightConditions.status === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <ChevronUp 
                size={14} 
                className="text-gray-400 group-hover:text-gray-600 transition-colors" 
              />
            </div>
          </>
        )}
      </button>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 sm:w-72">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-light text-gray-900 text-sm">Weather Conditions</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Minimize widget"
            >
              <ChevronDown size={14} className="text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Close widget"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center py-6">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg w-64 sm:w-72 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-light text-gray-900 text-sm">Weather Conditions</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Minimize widget"
            >
              <ChevronDown size={14} className="text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Close widget"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Location */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <MapPin size={12} />
          <span className="truncate">{formatLocation(location)}</span>
        </div>
      </div>

      {/* Content */}
      {weatherData && (
        <div className="p-4 space-y-4">
          {/* Main Weather Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getWeatherIcon(weatherData.icon)}</span>
              <div>
                <div className="text-xl font-light text-gray-900">{weatherData.temperature}°C</div>
                <div className="text-sm text-gray-600 capitalize">{weatherData.description}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Feels like</div>
              <div className="text-sm font-medium text-gray-900">{weatherData.feelsLike}°C</div>
            </div>
          </div>

          {/* Flight Conditions */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Plane size={14} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Flight Conditions</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${
                flightConditions.status === 'good' ? 'bg-green-500' :
                flightConditions.status === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
            </div>
            <div className="text-xs text-gray-600">{flightConditions.message}</div>
          </div>

          {/* Weather Details - Minimal N26 Style */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <Wind size={12} className="text-gray-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Wind</div>
              <div className="text-sm font-medium text-gray-900">{weatherData.windSpeed} km/h</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <Eye size={12} className="text-gray-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Visibility</div>
              <div className="text-sm font-medium text-gray-900">{weatherData.visibility} km</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <Droplets size={12} className="text-gray-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Humidity</div>
              <div className="text-sm font-medium text-gray-900">{weatherData.humidity}%</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <Clock size={12} className="text-gray-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Updated</div>
              <div className="text-sm font-medium text-gray-900">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}