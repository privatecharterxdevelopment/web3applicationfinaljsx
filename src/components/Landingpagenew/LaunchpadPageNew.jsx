import React, { useState, useEffect } from 'react';
import {
  Rocket, TrendingUp, Users, Clock, ArrowRight, Loader2, Search,
  Wallet, DollarSign, BarChart3, Shield, Zap, Star, ChevronDown, ChevronLeft, ChevronRight, Coins, Building2,
  Filter, Grid, List, X, Activity, Plane, Ship, Briefcase, TrendingDown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import LaunchDetailPageNew from './LaunchDetailPageNew';
import { useAuth } from '../../context/AuthContext';

export default function LaunchpadPageNew() {
  const [launches, setLaunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLaunch, setSelectedLaunch] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, upcoming, completed
  const [projectTypeFilter, setProjectTypeFilter] = useState('all'); // all, crypto, uto, sto
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('tabs'); // grid or tabs
  const [searchFocused, setSearchFocused] = useState(false);
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { user } = useAuth();

  useEffect(() => {
    fetchLaunches();
  }, []);

  const fetchLaunches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('launchpad_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLaunches(data || []);
    } catch (error) {
      console.error('Error fetching launches:', error);
      setLaunches([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLaunches = launches.filter(launch => {
    const matchesFilter = filter === 'all' || launch.status === filter;
    const matchesProjectType = projectTypeFilter === 'all' || launch.project_type === projectTypeFilter;
    const matchesSearch = launch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         launch.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesProjectType && matchesSearch;
  });

  // If a launch is selected, show detail page
  if (selectedLaunch) {
    return (
      <LaunchDetailPageNew
        launch={selectedLaunch}
        onBack={() => setSelectedLaunch(null)}
        onUpdate={fetchLaunches}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-transparent" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Top Bar - RWS Style */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">Launchpad</h2>

          <div className="flex items-center gap-3">
            {/* Compact Search - Expands on focus */}
            <div className={`relative transition-all duration-200 ${searchFocused ? 'w-64' : 'w-48'}`}>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-9 pr-3 py-2 bg-white/35 border border-gray-300/50 rounded-lg text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
              />
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all backdrop-blur-xl border ${
                showFilters
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-gray-100/60 text-gray-700 border-gray-300/50 hover:bg-gray-200/60'
              }`}
              style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
            >
              <Filter size={14} />
              Filters
            </button>

            {/* Category Quick Filters */}
            <button
              onClick={() => setProjectTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all backdrop-blur-xl border ${
                projectTypeFilter === 'all'
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-gray-100/60 text-gray-700 border-gray-300/50 hover:bg-gray-200/60'
              }`}
              style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
            >
              All
            </button>
            <button
              onClick={() => setProjectTypeFilter('sto')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all backdrop-blur-xl border ${
                projectTypeFilter === 'sto'
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-gray-100/60 text-gray-700 border-gray-300/50 hover:bg-gray-200/60'
              }`}
              style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
            >
              STO
            </button>
            <button
              onClick={() => setProjectTypeFilter('uto')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all backdrop-blur-xl border ${
                projectTypeFilter === 'uto'
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-gray-100/60 text-gray-700 border-gray-300/50 hover:bg-gray-200/60'
              }`}
              style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
            >
              UTO
            </button>
            <button
              onClick={() => setProjectTypeFilter('crypto')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all backdrop-blur-xl border ${
                projectTypeFilter === 'crypto'
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-gray-100/60 text-gray-700 border-gray-300/50 hover:bg-gray-200/60'
              }`}
              style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
            >
              Raising
            </button>
            <button
              onClick={() => setProjectTypeFilter('dao')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all backdrop-blur-xl border ${
                projectTypeFilter === 'dao'
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-gray-100/60 text-gray-700 border-gray-300/50 hover:bg-gray-200/60'
              }`}
              style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
            >
              DAOs
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-gray-100/60 border border-gray-300/50 rounded-lg p-1 backdrop-blur-xl" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-gray-800 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('tabs')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  viewMode === 'tabs'
                    ? 'bg-gray-800 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Tabs
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 p-4 bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-xl" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-800 mb-2">Status</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Live</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Closed</option>
                </select>
              </div>

              {/* Project Type Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-800 mb-2">Project Type</label>
                <select
                  value={projectTypeFilter}
                  onChange={(e) => setProjectTypeFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <option value="all">All Types</option>
                  <option value="crypto">Fundraising</option>
                  <option value="uto">Utility Token</option>
                  <option value="sto">Security Token</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilter('all');
                    setProjectTypeFilter('all');
                  }}
                  className="w-full px-4 py-2.5 bg-white/35 hover:bg-white/40 border border-gray-300/50 text-gray-700 rounded-xl text-sm transition-all"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Launches Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-gray-900 animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-600">Loading projects...</p>
            </div>
          </div>
        ) : filteredLaunches.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Rocket size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
            <p className="text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search or filters' : 'Check back soon for new opportunities'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLaunches.map((launch) => (
              <LaunchCard
                key={launch.id}
                launch={launch}
                onClick={() => setSelectedLaunch(launch)}
              />
            ))}
          </div>
        ) : (
          <div className="w-full space-y-2">
            {filteredLaunches.map((launch) => (
              <LaunchTabItem
                key={launch.id}
                launch={launch}
                onClick={() => setSelectedLaunch(launch)}
                address={address}
                isConnected={isConnected}
                open={open}
                user={user}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Launch Card Component with multiple images
function LaunchCard({ launch, onClick }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const progress = launch.current_raised || 0;
  const target = launch.target_amount || 1000000;
  const progressPercentage = Math.min((progress / target) * 100, 100);

  // Parse images array from launch.images or use single image_url
  const images = launch.images && Array.isArray(launch.images)
    ? launch.images
    : launch.image_url
      ? [launch.image_url]
      : ['https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800'];

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { label: 'Live' },
      upcoming: { label: 'Soon' },
      completed: { label: 'Closed' }
    };
    const badge = badges[status] || badges.upcoming;
    return (
      <span className="px-2.5 py-1 bg-black text-white text-xs font-medium rounded">
        {badge.label}
      </span>
    );
  };

  const getProjectTypeBadge = (projectType) => {
    const badges = {
      crypto: { label: 'Crypto' },
      uto: { label: 'UTO' },
      sto: { label: 'STO' }
    };
    const badge = badges[projectType];
    if (!badge) return null;
    return (
      <span className="px-2.5 py-1 bg-gray-100 text-gray-900 text-xs font-medium rounded">
        {badge.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-200 hover:border-gray-900 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
    >
      {/* Image Carousel */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <img
          src={images[currentImageIndex]}
          alt={launch.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Image Navigation - only show if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm"
            >
              <ChevronLeft size={14} className="text-gray-900" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm"
            >
              <ChevronRight size={14} className="text-gray-900" />
            </button>

            {/* Image Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentImageIndex
                      ? 'w-4 bg-white shadow-sm'
                      : 'w-1.5 bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Badges with backdrop blur */}
        <div className="absolute top-3 left-3 flex gap-2">
          {getStatusBadge(launch.status)}
          {launch.project_type && getProjectTypeBadge(launch.project_type)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title & Token */}
        <div className="mb-3">
          <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
            {launch.name}
          </h3>
          <p className="text-xs text-gray-500">
            {launch.token_symbol || 'TKN'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">Raised</span>
            <span className="text-xs font-medium text-gray-900">{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div>
            <span className="text-gray-500">Raised</span>
            <p className="font-semibold text-gray-900 mt-0.5">{formatCurrency(progress)}</p>
          </div>
          <div>
            <span className="text-gray-500">Target</span>
            <p className="font-semibold text-gray-900 mt-0.5">{formatCurrency(target)}</p>
          </div>
        </div>

        {/* STO Countdown Timer */}
        {launch.project_type === 'sto' && launch.launch_end_date && (
          <div className="mb-4">
            <CountdownTimer endDate={launch.launch_end_date} compact={true} />
          </div>
        )}

        {/* Action Button */}
        <button className="w-full py-3 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group-hover:gap-3">
          <span>View Details</span>
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

// Countdown Timer Component for STO projects
function CountdownTimer({ endDate, compact = false }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (timeLeft.expired) {
    return (
      <div className={`p-3 bg-gray-100 rounded-lg border border-gray-200 ${compact ? '' : 'mb-4'}`}>
        <div className="flex items-center justify-center gap-2">
          <Clock size={compact ? 14 : 18} className="text-gray-500" />
          <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Ended</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 bg-gray-50 rounded-lg border border-gray-200 ${compact ? '' : 'mb-4'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Clock size={compact ? 12 : 14} className="text-gray-600" />
        <span className="text-xs text-gray-600">Ends In</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center">
          <div className={`${compact ? 'text-sm' : 'text-base'} font-bold text-gray-900`}>{timeLeft.days}</div>
          <div className="text-xs text-gray-500">Days</div>
        </div>
        <div className="text-center">
          <div className={`${compact ? 'text-sm' : 'text-base'} font-bold text-gray-900`}>{timeLeft.hours}</div>
          <div className="text-xs text-gray-500">Hrs</div>
        </div>
        <div className="text-center">
          <div className={`${compact ? 'text-sm' : 'text-base'} font-bold text-gray-900`}>{timeLeft.minutes}</div>
          <div className="text-xs text-gray-500">Min</div>
        </div>
        <div className="text-center">
          <div className={`${compact ? 'text-sm' : 'text-base'} font-bold text-gray-900`}>{timeLeft.seconds}</div>
          <div className="text-xs text-gray-500">Sec</div>
        </div>
      </div>
    </div>
  );
}

// Tab Item Component - Blockchain Investment Styled with Token Details
function LaunchTabItem({ launch, onClick, address, isConnected, open, user }) {
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);

  const progress = launch.current_raised || 0;
  const target = launch.target_amount || 1000000;
  const progressPercentage = Math.min((progress / target) * 100, 100);
  const tokenPrice = launch.token_price || 1.0;

  // Mock APY based on project type
  const expectedAPY = launch.project_type === 'sto' ? '8-12%' : launch.project_type === 'uto' ? '15-25%' : '10-18%';

  // Payment token logos
  const tokenLogos = {
    ETH: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/PaymentIcons/ethereum-3d-icon-png-download-3364022.webp',
    USDC: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/PaymentIcons/usdc-3d-icon-png-download-8263869.webp',
    USDT: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/PaymentIcons/green-circle-with-large-t-it-that-is-labeled-t_767610-17.jpg'
  };

  const acceptedTokens = launch.accepted_tokens || ['ETH', 'USDC', 'USDT'];

  // Check waitlist status
  useEffect(() => {
    checkWaitlistStatus();
  }, [address, user, launch.id]);

  const checkWaitlistStatus = async () => {
    try {
      if (address) {
        const { data: walletData } = await supabase
          .from('transactions')
          .select('*')
          .eq('wallet_address', address.toLowerCase())
          .eq('launch_id', launch.id)
          .eq('type', 'waitlist')
          .single();

        if (walletData) {
          setOnWaitlist(true);
          return;
        }
      }

      if (user) {
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('launch_id', launch.id)
          .eq('type', 'waitlist')
          .single();

        if (data) setOnWaitlist(true);
      }
    } catch (error) {
      // Not on waitlist
    }
  };

  const handleJoinWaitlist = async (e) => {
    e.stopPropagation();

    if (!address && !user) {
      if (open) open();
      return;
    }

    setJoiningWaitlist(true);
    try {
      const waitlistData = {
        launch_id: launch.id,
        type: 'waitlist',
        status: 'pending',
        metadata: {
          launch_name: launch.name,
          token_symbol: launch.token_symbol,
          project_type: launch.project_type,
          joined_at: new Date().toISOString()
        }
      };

      if (address) waitlistData.wallet_address = address.toLowerCase();
      if (user) waitlistData.user_id = user.id;

      const { error } = await supabase
        .from('transactions')
        .insert(waitlistData);

      if (error) throw error;

      setOnWaitlist(true);
      alert('Successfully joined the waitlist!');
    } catch (error) {
      if (error.code === '23505') {
        setOnWaitlist(true);
      } else {
        alert('Failed to join waitlist');
      }
    } finally {
      setJoiningWaitlist(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'crypto': return <Rocket size={16} className="text-gray-600" />;
      case 'uto': return <Zap size={16} className="text-gray-600" />;
      case 'sto': return <Shield size={16} className="text-gray-600" />;
      default: return <Coins size={16} className="text-gray-600" />;
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'crypto': return 'Fundraising';
      case 'uto': return 'Utility Token';
      case 'sto': return 'Security Token';
      default: return 'Token';
    }
  };

  // Generate simple chart data points based on progress
  const chartPoints = Array.from({ length: 8 }, (_, i) => {
    const baseProgress = (progressPercentage / 100) * (i / 7);
    const variance = Math.random() * 0.1 - 0.05;
    return Math.max(0, Math.min(1, baseProgress + variance));
  });

  return (
    <div
      onClick={onClick}
      className="bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-lg hover:border-gray-800 transition-all cursor-pointer group"
      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
    >
      <div className="p-4 flex items-center gap-6">
        {/* Token Icon */}
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-600 rounded-xl flex items-center justify-center">
          <span className="text-white text-sm font-bold">{launch.token_symbol?.slice(0, 3) || 'TKN'}</span>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {launch.name}
            </h3>
            <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">
              {getTypeIcon(launch.project_type)}
              <span className="font-medium">{getTypeLabel(launch.project_type)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Token Price Bubble */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 rounded-lg">
              <DollarSign size={12} className="text-gray-600" />
              <span className="font-medium text-gray-900">${tokenPrice.toFixed(2)}</span>
            </div>

            {/* APY Bubble */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 rounded-lg">
              <TrendingUp size={12} className="text-gray-600" />
              <span className="font-medium text-gray-900">{expectedAPY}</span>
            </div>

            {/* Funding Bubble */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 rounded-lg">
              <Activity size={12} className="text-gray-600" />
              <span className="font-medium text-gray-900">{progressPercentage.toFixed(0)}% funded</span>
            </div>
          </div>
        </div>

        {/* Mini Line Chart */}
        <div className="hidden md:flex flex-shrink-0 w-28 h-12 items-center">
          <svg width="100%" height="100%" viewBox="0 0 112 48" preserveAspectRatio="none">
            {/* Background grid lines */}
            <line x1="0" y1="12" x2="112" y2="12" stroke="#f3f4f6" strokeWidth="1" />
            <line x1="0" y1="24" x2="112" y2="24" stroke="#f3f4f6" strokeWidth="1" />
            <line x1="0" y1="36" x2="112" y2="36" stroke="#f3f4f6" strokeWidth="1" />

            {/* Line path */}
            <polyline
              points={chartPoints.map((point, i) => {
                const x = (i / (chartPoints.length - 1)) * 112;
                const y = 44 - (point * 40);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#1f2937"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-70 group-hover:opacity-100 transition-opacity"
            />

            {/* Gradient fill under line */}
            <defs>
              <linearGradient id={`gradient-${launch.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1f2937" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#1f2937" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon
              points={[
                ...chartPoints.map((point, i) => {
                  const x = (i / (chartPoints.length - 1)) * 112;
                  const y = 44 - (point * 40);
                  return `${x},${y}`;
                }),
                `112,44`,
                `0,44`
              ].join(' ')}
              fill={`url(#gradient-${launch.id})`}
              className="opacity-50 group-hover:opacity-70 transition-opacity"
            />
          </svg>
        </div>

        {/* Accepted Tokens */}
        <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-gray-500">Pay with:</span>
          <div className="flex items-center gap-1">
            {acceptedTokens.map((token) => (
              <img
                key={token}
                src={tokenLogos[token]}
                alt={token}
                className="w-6 h-6 rounded-full object-cover border border-gray-200"
                title={token}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onWaitlist ? (
            <div className="px-3 py-1.5 bg-gray-100 border border-gray-300/50 text-gray-600 rounded-lg text-xs font-medium flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              On Waitlist
            </div>
          ) : (
            <button
              onClick={handleJoinWaitlist}
              disabled={joiningWaitlist}
              className="px-3 py-1.5 bg-white/40 hover:bg-white/60 border border-gray-300/50 text-gray-800 rounded-lg text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {joiningWaitlist ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <Wallet size={12} />
                  Join Waitlist
                </>
              )}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
          >
            View Details
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Smart Contract Address Row */}
      {launch.smart_contract_address && (
        <div className="px-4 pb-3 pt-1 border-t border-gray-200/50">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Shield size={12} className="text-gray-500" />
            <span className="text-gray-500">Contract:</span>
            <code className="px-2 py-0.5 bg-gray-100 rounded text-gray-800 font-mono text-xs">
              {launch.smart_contract_address.slice(0, 6)}...{launch.smart_contract_address.slice(-4)}
            </code>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(launch.smart_contract_address);
              }}
              className="ml-1 text-gray-500 hover:text-gray-800 transition-colors"
              title="Copy contract address"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
