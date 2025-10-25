import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  MessageCircle,
  FileText,
  Plane,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Send
} from 'lucide-react';

interface DashboardOverviewNewProps {
  user: any;
  locationData: any;
  weatherData: any;
  recentRequests: any[];
  onChatSubmit: (message: string) => void;
}

const DashboardOverviewNew: React.FC<DashboardOverviewNewProps> = ({
  user,
  locationData,
  weatherData,
  recentRequests,
  onChatSubmit
}) => {
  const [chatInput, setChatInput] = useState('');

  const getWeatherIcon = (condition: string) => {
    if (condition?.includes('rain') || condition?.includes('drizzle')) return <CloudRain className="w-10 h-10 text-gray-700" />;
    if (condition?.includes('cloud')) return <Cloud className="w-10 h-10 text-gray-700" />;
    return <Sun className="w-10 h-10 text-yellow-500" />;
  };

  const handleChatSubmit = () => {
    if (chatInput.trim()) {
      onChatSubmit(chatInput);
      setChatInput('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-gray-500 text-sm">How can I help you?</p>
        </div>

        {/* Central Chat Input - Glassmorphic */}
        <div className="relative">
          <div className="backdrop-blur-md bg-white/60 border border-white/20 rounded-2xl shadow-xl p-1">
            <div className="flex items-center gap-3 p-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                placeholder="Ask PrivateCharterX AI..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
              />
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Search className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={handleChatSubmit}
                disabled={!chatInput.trim()}
                className="bg-black text-white p-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/80 transition-all text-xs text-gray-700 whitespace-nowrap">
              <Plane className="w-3 h-3" />
              Book flight
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/80 transition-all text-xs text-gray-700 whitespace-nowrap">
              <FileText className="w-3 h-3" />
              Summarize
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/80 transition-all text-xs text-gray-700 whitespace-nowrap">
              <MessageCircle className="w-3 h-3" />
              Help me write
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/80 transition-all text-xs text-gray-700 whitespace-nowrap">
              <Sparkles className="w-3 h-3" />
              Brainstorm
            </button>
          </div>
        </div>

        {/* Weather Widget - Compact Glassmorphic */}
        <div className="backdrop-blur-md bg-white/60 border border-white/20 rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getWeatherIcon(weatherData?.condition)}
              <div>
                <div className="text-3xl font-light text-gray-900">
                  {weatherData?.temperature ? `${Math.round(weatherData.temperature)}°C` : '--°C'}
                </div>
                <div className="text-sm text-gray-500 capitalize">
                  {weatherData?.condition || 'Loading...'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {locationData?.city || 'Location'}
              </div>
              <div className="text-xs text-gray-500">
                H:{weatherData?.high ? `${Math.round(weatherData.high)}°` : '--°'} L:{weatherData?.low ? `${Math.round(weatherData.low)}°` : '--°'}
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Wind className="w-3 h-3" />
                  {weatherData?.windSpeed || '0'} km/h
                </div>
                <div className="flex items-center gap-1">
                  <Droplets className="w-3 h-3" />
                  {weatherData?.humidity || '0'}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Requests - Compact Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900">Your recent chats</h2>
            <button className="text-xs text-gray-500 hover:text-gray-900">View all</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentRequests.slice(0, 3).map((request, idx) => (
              <div
                key={request.id || idx}
                className="backdrop-blur-md bg-white/60 border border-white/20 rounded-xl p-4 hover:bg-white/80 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {request.type === 'jets' ? 'Private Jet' :
                       request.type === 'emptyleg' ? 'Empty Leg' :
                       request.type === 'helicopter' ? 'Helicopter' :
                       request.type === 'cars' ? 'Luxury Car' :
                       request.type === 'adventures' ? 'Adventure' : 'Request'}
                    </h3>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
                </div>

                <div className="space-y-1">
                  {request.data?.from && request.data?.to && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MapPin className="w-3 h-3" />
                      {request.data.from} → {request.data.to}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Recent'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Tokenized Asset Card - Glassmorphic */}
        <div className="backdrop-blur-md bg-white/60 border border-white/20 rounded-xl p-4 flex items-center gap-4 mb-3">
          <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400" alt="Mega yacht Estrelle" className="w-20 h-20 object-cover rounded-lg" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">Latest Tokenized Asset</div>
            <div className="text-base font-bold text-gray-800 mt-1">Mega yacht "Estrelle"</div>
            <div className="text-xs text-gray-600 mt-1">Now available on Web3.0</div>
          </div>
          <div>
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">New</span>
          </div>
        </div>
        {/* Quick Stats - Glassmorphic */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="backdrop-blur-md bg-white/60 border border-white/20 rounded-xl p-4">
            <div className="text-2xl font-light text-gray-900">12</div>
            <div className="text-xs text-gray-500 mt-1">Total Flights</div>
          </div>
          <div className="backdrop-blur-md bg-white/60 border border-white/20 rounded-xl p-4">
            <div className="text-2xl font-light text-gray-900">5</div>
            <div className="text-xs text-gray-500 mt-1">This Month</div>
          </div>
          <div className="backdrop-blur-md bg-white/60 border border-white/20 rounded-xl p-4">
            <div className="text-2xl font-light text-gray-900">3</div>
            <div className="text-xs text-gray-500 mt-1">CO2 Certs</div>
          </div>
          <div className="backdrop-blur-md bg-white/60 border border-white/20 rounded-xl p-4">
            <div className="text-2xl font-light text-gray-900">2</div>
            <div className="text-xs text-gray-500 mt-1">NFT Benefits</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardOverviewNew;
