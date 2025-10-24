import React, { useState, useEffect } from 'react';
import { Rocket, TrendingUp, Users, Clock, CheckCircle, ArrowRight, Loader2, Filter, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LaunchDetailPage from './LaunchDetailPage';

export default function LaunchpadPage() {
  const [launches, setLaunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLaunch, setSelectedLaunch] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, upcoming, completed
  const [searchQuery, setSearchQuery] = useState('');

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-black text-white';
      case 'upcoming':
        return 'bg-black/5 text-black';
      case 'completed':
        return 'bg-black/5 text-black/40';
      default:
        return 'bg-black/5 text-black';
    }
  };

  const filteredLaunches = launches.filter(launch => {
    const matchesFilter = filter === 'all' || launch.status === filter;
    const matchesSearch = launch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         launch.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // If a launch is selected, show detail page
  if (selectedLaunch) {
    return (
      <LaunchDetailPage
        launch={selectedLaunch}
        onBack={() => setSelectedLaunch(null)}
        onUpdate={fetchLaunches}
      />
    );
  }

  return (
    <div className="w-full h-full bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter mb-2">
              Launchpad
            </h1>
            <p className="text-sm text-gray-600 font-light">
              Invest in upcoming tokenized asset launches
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All Launches' },
              { id: 'active', label: 'Live Now' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'completed', label: 'Completed' }
            ].map(tab => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-black text-white'
                      : 'bg-white/35 hover:bg-white/40 border border-gray-300/50 text-gray-800 backdrop-blur-xl'
                  }`}
                  style={!isActive ? { backdropFilter: 'blur(20px) saturate(180%)' } : {}}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Assets Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading launchpad...</p>
            </div>
          </div>
        ) : filteredLaunches.length === 0 ? (
          <div className="text-center py-20">
            <Rocket size={64} className="text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Launches Available</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'No launch projects are currently available.'
                : 'No launches available in this category.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLaunches.map((launch) => (
              <LaunchCard
                key={launch.id}
                launch={launch}
                onClick={() => setSelectedLaunch(launch)}
                formatCurrency={formatCurrency}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LaunchCard({ launch, onClick, formatCurrency, getStatusColor }) {
  const progress = launch.current_waitlist || 0;
  const target = launch.target_waitlist || 100;
  const progressPercentage = target > 0 ? (progress / target) * 100 : 0;

  // Map status to T-REX style badges
  const getStatusBadges = (status) => {
    if (status === 'active') {
      return (
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-white text-gray-800 text-xs font-medium rounded-md shadow-sm">
            Live
          </span>
          <span className="px-3 py-1 bg-white text-gray-800 text-xs font-medium rounded-md shadow-sm">
            Qualified
          </span>
        </div>
      );
    } else if (status === 'upcoming') {
      return (
        <span className="px-3 py-1 bg-white text-gray-800 text-xs font-medium rounded-md shadow-sm">
          Upcoming
        </span>
      );
    } else if (status === 'completed') {
      return (
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-white text-gray-800 text-xs font-medium rounded-md shadow-sm">
            Closed
          </span>
          <span className="px-3 py-1 bg-white text-gray-800 text-xs font-medium rounded-md shadow-sm">
            Registered
          </span>
        </div>
      );
    }
    return (
      <span className="px-3 py-1 bg-white text-gray-800 text-xs font-medium rounded-md shadow-sm">
        Open
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
    >
      {/* Image with overlay pattern */}
      <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        <img
          src={launch.image_url || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800'}
          alt={launch.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>

        {/* Status Badges - Top Left */}
        <div className="absolute top-3 left-3">
          {getStatusBadges(launch.status)}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Logo and Token Symbol */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* PCX Logo for tokenization projects */}
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
              <img
                src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
                alt="PCX"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-0.5">
                {launch.token_symbol || 'TOKEN'}
              </h3>
              <p className="text-sm text-gray-500">
                {launch.name}
              </p>
            </div>
          </div>
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
            Fund
          </span>
        </div>

        {/* Asset Title */}
        <h4 className="text-base font-medium text-gray-900 mb-3">
          {launch.name}
        </h4>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {launch.description || 'Premium tokenized asset available for investment'}
        </p>

        {/* Key Metrics - Clean layout */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Token price</span>
            <span className="text-gray-900 font-medium">${launch.token_price || '0'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Start date</span>
            <span className="text-gray-900 font-medium">
              {launch.start_date ? new Date(launch.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">End date</span>
            <span className="text-gray-900 font-medium">
              {launch.end_date ? new Date(launch.end_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Min. investment</span>
            <span className="text-gray-900 font-medium">{formatCurrency(launch.min_investment || 1000)}</span>
          </div>
        </div>

        {/* Join Waitlist Button */}
        <button className="w-full py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors">
          Join Waitlist
        </button>
      </div>
    </div>
  );
}
