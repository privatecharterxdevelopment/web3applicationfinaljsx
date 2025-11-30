import React, { useState, useRef, useEffect } from 'react';
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
  Send,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Tag
} from 'lucide-react';

interface DashboardOverviewNewProps {
  user: any;
  locationData: any;
  weatherData: any;
  recentRequests: any[];
  onChatSubmit: (message: string) => void;
}

// Search topics with categories
const searchTopics = [
  { id: 1, title: 'Private Jet Charter', category: 'Services', keywords: ['jet', 'private', 'charter', 'flight', 'aviation'], link: '/jets' },
  { id: 2, title: 'Empty Leg Flights', category: 'Services', keywords: ['empty', 'leg', 'discount', 'one-way', 'deal'], link: '/empty-legs' },
  { id: 3, title: 'Helicopter Charter', category: 'Services', keywords: ['helicopter', 'heli', 'chopper', 'rotary'], link: '/helicopter' },
  { id: 4, title: 'Luxury Car Rental', category: 'Services', keywords: ['car', 'luxury', 'rental', 'supercar', 'exotic'], link: '/luxury-cars' },
  { id: 5, title: 'Adventure Experiences', category: 'Services', keywords: ['adventure', 'experience', 'safari', 'yacht', 'exclusive'], link: '/adventures' },
  { id: 6, title: 'Ground Transportation', category: 'Services', keywords: ['ground', 'transport', 'transfer', 'limousine', 'chauffeur'], link: '/ground-transport' },
  { id: 7, title: 'CO2 Certificates', category: 'Sustainability', keywords: ['co2', 'carbon', 'offset', 'certificate', 'environment', 'green'], link: '/co2-certificates' },
  { id: 8, title: 'NFT Membership Benefits', category: 'Web3', keywords: ['nft', 'membership', 'benefit', 'discount', 'exclusive'], link: '/nft-marketplace' },
  { id: 9, title: 'PVCX Token', category: 'Web3', keywords: ['pvcx', 'token', 'crypto', 'reward', 'earn'], link: '/pvcx-token' },
  { id: 10, title: 'KYC Verification', category: 'Account', keywords: ['kyc', 'verification', 'identity', 'verify', 'document'], link: '/kyc-verification' },
  { id: 11, title: 'Booking a Flight', category: 'Help', keywords: ['book', 'booking', 'how', 'reserve', 'request'], link: '/requests' },
  { id: 12, title: 'Payment Methods', category: 'Help', keywords: ['payment', 'pay', 'crypto', 'usdc', 'card', 'wire'], link: '/transactions' },
  { id: 13, title: 'Escrow Services', category: 'Services', keywords: ['escrow', 'secure', 'payment', 'protection'], link: '/escrow' },
  { id: 14, title: 'Asset Tokenization', category: 'Web3', keywords: ['tokenization', 'tokenize', 'asset', 'rwa', 'real world'], link: '/tokenization' },
  { id: 15, title: 'DAO Governance', category: 'Web3', keywords: ['dao', 'governance', 'vote', 'voting', 'proposal'], link: '/dao' },
];

// Blog posts from privatecharterx.blog
const blogPosts = [
  { id: 1, title: 'The Ultimate Guide to Private Jet Charter', keywords: ['guide', 'jet', 'charter', 'private', 'how'], url: 'https://privatecharterx.blog/ultimate-guide-private-jet-charter' },
  { id: 2, title: 'Empty Leg Flights: How to Save Up to 75%', keywords: ['empty', 'leg', 'save', 'discount', 'cheap'], url: 'https://privatecharterx.blog/empty-leg-flights-save-money' },
  { id: 3, title: 'Understanding Carbon Offsetting in Aviation', keywords: ['carbon', 'offset', 'co2', 'environment', 'green', 'aviation'], url: 'https://privatecharterx.blog/carbon-offsetting-aviation' },
  { id: 4, title: 'NFT Memberships: The Future of Luxury Travel', keywords: ['nft', 'membership', 'luxury', 'travel', 'future', 'web3'], url: 'https://privatecharterx.blog/nft-memberships-luxury-travel' },
  { id: 5, title: 'Top 10 Private Jet Destinations for 2025', keywords: ['destination', 'travel', 'jet', 'top', '2025', 'vacation'], url: 'https://privatecharterx.blog/top-destinations-2025' },
  { id: 6, title: 'Helicopter vs Private Jet: Which to Choose?', keywords: ['helicopter', 'jet', 'compare', 'choose', 'difference'], url: 'https://privatecharterx.blog/helicopter-vs-private-jet' },
  { id: 7, title: 'How Blockchain is Revolutionizing Aviation', keywords: ['blockchain', 'aviation', 'crypto', 'web3', 'technology'], url: 'https://privatecharterx.blog/blockchain-aviation' },
  { id: 8, title: 'Luxury Yacht Charter: A Complete Guide', keywords: ['yacht', 'charter', 'luxury', 'guide', 'boat', 'sea'], url: 'https://privatecharterx.blog/luxury-yacht-charter-guide' },
  { id: 9, title: 'Corporate Jet Travel: Best Practices', keywords: ['corporate', 'business', 'jet', 'travel', 'company'], url: 'https://privatecharterx.blog/corporate-jet-travel' },
  { id: 10, title: 'The Rise of Sustainable Private Aviation', keywords: ['sustainable', 'green', 'eco', 'environment', 'saf', 'fuel'], url: 'https://privatecharterx.blog/sustainable-private-aviation' },
];

const DashboardOverviewNew: React.FC<DashboardOverviewNewProps> = ({
  user,
  locationData,
  weatherData,
  recentRequests,
  onChatSubmit
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredTopics, setFilteredTopics] = useState<typeof searchTopics>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<typeof blogPosts>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const getWeatherIcon = (condition: string) => {
    if (condition?.includes('rain') || condition?.includes('drizzle')) return <CloudRain className="w-10 h-10 text-gray-700" />;
    if (condition?.includes('cloud')) return <Cloud className="w-10 h-10 text-gray-700" />;
    return <Sun className="w-10 h-10 text-yellow-500" />;
  };

  // Filter results based on search input
  useEffect(() => {
    if (searchInput.trim().length > 0) {
      const query = searchInput.toLowerCase();

      // Filter topics
      const matchedTopics = searchTopics.filter(topic =>
        topic.title.toLowerCase().includes(query) ||
        topic.keywords.some(k => k.includes(query))
      ).slice(0, 5);

      // Filter blog posts
      const matchedBlogs = blogPosts.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.keywords.some(k => k.includes(query))
      ).slice(0, 3);

      setFilteredTopics(matchedTopics);
      setFilteredBlogs(matchedBlogs);
      setShowDropdown(matchedTopics.length > 0 || matchedBlogs.length > 0);
    } else {
      setFilteredTopics([]);
      setFilteredBlogs([]);
      setShowDropdown(false);
    }
  }, [searchInput]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTopicClick = (link: string) => {
    setShowDropdown(false);
    setSearchInput('');
    // Navigate to the internal page - this will be handled by the parent component
    window.dispatchEvent(new CustomEvent('navigate-to-category', { detail: { category: link.replace('/', '') } }));
  };

  const handleBlogClick = (url: string) => {
    setShowDropdown(false);
    setSearchInput('');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Services': return <Plane className="w-4 h-4" />;
      case 'Web3': return <Sparkles className="w-4 h-4" />;
      case 'Sustainability': return <Tag className="w-4 h-4" />;
      case 'Account': return <FileText className="w-4 h-4" />;
      case 'Help': return <HelpCircle className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
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

        {/* Central Search Input - Glassmorphic */}
        <div className="relative" ref={searchRef}>
          <div className="backdrop-blur-md bg-white/60 border border-white/20 rounded-2xl shadow-xl p-1">
            <div className="flex items-center gap-3 p-3">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => searchInput.trim() && setShowDropdown(true)}
                placeholder="Search services, topics, or articles..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(''); setShowDropdown(false); }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Search Results Dropdown */}
          {showDropdown && (filteredTopics.length > 0 || filteredBlogs.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 backdrop-blur-xl bg-white/95 border border-gray-200/50 rounded-xl shadow-2xl overflow-hidden z-50">
              {/* Topics Section */}
              {filteredTopics.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Topics & Services
                  </div>
                  {filteredTopics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => handleTopicClick(topic.link)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 rounded-lg transition-colors text-left group"
                    >
                      <div className="w-8 h-8 bg-gray-100 group-hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 transition-colors">
                        {getCategoryIcon(topic.category)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{topic.title}</div>
                        <div className="text-xs text-gray-500">{topic.category}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* Divider */}
              {filteredTopics.length > 0 && filteredBlogs.length > 0 && (
                <div className="border-t border-gray-100" />
              )}

              {/* Blog Posts Section */}
              {filteredBlogs.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                    <BookOpen className="w-3 h-3" />
                    From Our Blog
                  </div>
                  {filteredBlogs.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => handleBlogClick(post.url)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 rounded-lg transition-colors text-left group"
                    >
                      <div className="w-8 h-8 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center text-blue-600 transition-colors">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{post.title}</div>
                        <div className="text-xs text-blue-600">privatecharterx.blog</div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* View All Blog Link */}
              <div className="border-t border-gray-100 p-2">
                <a
                  href="https://privatecharterx.blog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <span>View all articles on privatecharterx.blog</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            <button
              onClick={() => handleTopicClick('/jets')}
              className="flex items-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/80 transition-all text-xs text-gray-700 whitespace-nowrap"
            >
              <Plane className="w-3 h-3" />
              Book flight
            </button>
            <button
              onClick={() => handleTopicClick('/empty-legs')}
              className="flex items-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/80 transition-all text-xs text-gray-700 whitespace-nowrap"
            >
              <Tag className="w-3 h-3" />
              Empty Legs
            </button>
            <button
              onClick={() => handleTopicClick('/co2-certificates')}
              className="flex items-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/80 transition-all text-xs text-gray-700 whitespace-nowrap"
            >
              <FileText className="w-3 h-3" />
              CO2 Offset
            </button>
            <button
              onClick={() => handleTopicClick('/nft-marketplace')}
              className="flex items-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/80 transition-all text-xs text-gray-700 whitespace-nowrap"
            >
              <Sparkles className="w-3 h-3" />
              NFT Benefits
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
