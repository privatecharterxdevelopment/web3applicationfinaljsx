import React, { useEffect, useState } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, Eye, Gauge } from 'lucide-react';

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  visibility: number;
  wind_speed: number;
  weather: {
    main: string;
    description: string;
    icon: string;
  }[];
  city: string;
}

interface WeatherProps {
  latitude: number;
  longitude: number;
  city?: string;
}

const Weather: React.FC<WeatherProps> = ({ latitude, longitude, city }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);

        // Using OpenWeatherMap API (you'll need to sign up for a free API key)
        const API_KEY = '4135f36e70a7c3f095ae64a58e8a5ec8'; // Replace with your API key
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }

        const data = await response.json();
        setWeather({
          temp: Math.round(data.main.temp),
          feels_like: Math.round(data.main.feels_like),
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          visibility: Math.round(data.visibility / 1000), // Convert to km
          wind_speed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
          weather: data.weather,
          city: city || data.name
        });
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Unable to load weather');
      } finally {
        setLoading(false);
      }
    };

    if (latitude && longitude) {
      fetchWeather();
    }
  }, [latitude, longitude, city]);

  const getWeatherIcon = (weatherMain: string) => {
    switch (weatherMain.toLowerCase()) {
      case 'clear':
        return <Sun size={24} className="text-yellow-500" />;
      case 'clouds':
        return <Cloud size={24} className="text-gray-400" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain size={24} className="text-blue-500" />;
      case 'snow':
        return <CloudSnow size={24} className="text-blue-300" />;
      default:
        return <Cloud size={24} className="text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse flex space-x-4">
            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-center h-32 text-gray-400">
          <Cloud size={32} className="mr-2" />
          <span>{error || 'Weather unavailable'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">{weather.city}</h3>
          <p className="text-sm text-blue-100 capitalize">{weather.weather[0]?.description}</p>
        </div>
        <div className="bg-white/20 rounded-full p-3">
          {getWeatherIcon(weather.weather[0]?.main)}
        </div>
      </div>

      {/* Temperature */}
      <div className="mb-6">
        <div className="text-5xl font-bold mb-1">{weather.temp}°C</div>
        <div className="text-sm text-blue-100">Feels like {weather.feels_like}°C</div>
      </div>

      {/* Weather Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Wind size={16} className="text-blue-200" />
          <div>
            <div className="text-xs text-blue-100">Wind</div>
            <div className="text-sm font-medium">{weather.wind_speed} km/h</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Droplets size={16} className="text-blue-200" />
          <div>
            <div className="text-xs text-blue-100">Humidity</div>
            <div className="text-sm font-medium">{weather.humidity}%</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Gauge size={16} className="text-blue-200" />
          <div>
            <div className="text-xs text-blue-100">Pressure</div>
            <div className="text-sm font-medium">{weather.pressure} hPa</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Eye size={16} className="text-blue-200" />
          <div>
            <div className="text-xs text-blue-100">Visibility</div>
            <div className="text-sm font-medium">{weather.visibility} km</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Weather;
