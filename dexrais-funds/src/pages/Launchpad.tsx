import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Grid3x3, List, X } from 'lucide-react';
import Header from '../components/Landing/Header';
import Footer from '../components/Landing/Footer';
import { supabase } from '../lib/supabase';
import type { Campaign } from '../lib/supabase';

type ViewMode = 'grid' | 'list';
type Category = 'all' | 'starter' | 'pro' | 'enterprise' | 'enterprise_audit';
type Status = 'active' | 'funded' | 'ended';

const categoryLabels: Record<Category, string> = {
  all: 'All',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
  enterprise_audit: 'Enterprise+Audit',
};

const statusColors: Record<Status, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-700' },
  funded: { bg: 'bg-blue-100', text: 'text-blue-700' },
  ended: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

export default function Launchpad() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [category, setCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Status[]>(['active', 'funded']);
  const [raisedRange, setRaisedRange] = useState<[number, number]>([0, 1000000]);

  // Fetch campaigns from Supabase
  useEffect(() => {
    async function loadCampaigns() {
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .in('status', ['active', 'funded'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setCampaigns(data);
      } catch (error) {
        console.error('Error loading campaigns:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesCategory =
      category === 'all' || campaign.pricing_tier === category;
    const matchesSearch =
      campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (campaign.short_description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter.includes(campaign.status as Status);
    const matchesRaised =
      campaign.raised_amount >= raisedRange[0] &&
      campaign.raised_amount <= raisedRange[1];
    return matchesCategory && matchesSearch && matchesStatus && matchesRaised;
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Minimalistic Filter Bar */}
          <div className="bg-gray-100 border border-gray-200 rounded-2xl p-3 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div
                className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full transition-all ${
                  searchFocused ? 'flex-1 min-w-[300px] border-gray-400' : 'w-[220px]'
                }`}
              >
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 flex-1">
                {(Object.keys(categoryLabels) as Category[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      category === cat
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {categoryLabels[cat]}
                  </button>
                ))}
              </div>

              {/* View & Filter Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 border ${
                    filterOpen
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>

                <div className="flex items-center gap-1 bg-white rounded-full p-1 border border-gray-300">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded-full transition-all ${
                      viewMode === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Grid3x3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1 rounded-full transition-all ${
                      viewMode === 'list' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {filterOpen && (
            <div className="bg-gray-100 border border-gray-200 rounded-2xl p-6 mb-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Status
                  </label>
                  <div className="space-y-2">
                    {(['active', 'funded', 'ended'] as Status[]).map((status) => (
                      <label key={status} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={statusFilter.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStatusFilter([...statusFilter, status]);
                            } else {
                              setStatusFilter(statusFilter.filter((s) => s !== status));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700 font-medium capitalize">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Raised Amount Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Raised Amount
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="1000000"
                      step="10000"
                      value={raisedRange[1]}
                      onChange={(e) => setRaisedRange([0, parseInt(e.target.value)])}
                      className="w-full"
                    />
                    <p className="text-sm text-gray-600 font-medium">
                      Up to ${(raisedRange[1] / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>

                {/* Results Count */}
                <div className="flex items-end">
                  <p className="text-sm text-gray-600 font-normal">
                    <span className="font-bold text-gray-900">{filteredCampaigns.length}</span>{' '}
                    campaigns found
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Campaign Cards */}
          {loading ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-base font-medium">Loading campaigns...</p>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
                  : 'space-y-5'
              }
            >
              {filteredCampaigns.map((campaign) => {
                return (
                  <Link
                    key={campaign.id}
                    to={`/campaign/${campaign.id}`}
                    className="group bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all"
                  >
                    <div className={viewMode === 'list' ? 'flex items-start gap-6' : ''}>
                      {/* Header Image with Logo Overlay */}
                      <div className="relative">
                        {campaign.header_image_url ? (
                          <img
                            src={campaign.header_image_url}
                            alt={campaign.title}
                            className="w-full h-40 object-cover"
                          />
                        ) : (
                          <div className="w-full h-40 bg-gradient-to-br from-gray-200 to-gray-300" />
                        )}

                        {/* Logo Overlay */}
                        {campaign.logo_image_url && (
                          <img
                            src={campaign.logo_image_url}
                            alt={`${campaign.title} logo`}
                            className="absolute -bottom-6 left-5 w-16 h-16 rounded-lg border-4 border-white object-cover shadow-md"
                          />
                        )}
                      </div>

                      <div className="flex-1 p-6 pt-9">
                        {/* Title & Status */}
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-black pr-2">
                            {campaign.title}
                          </h3>
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
                              statusColors[campaign.status as Status].bg
                            } ${statusColors[campaign.status as Status].text}`}
                          >
                            {campaign.status}
                          </span>
                        </div>

                        {/* Tier Badge */}
                        {campaign.pricing_tier && (
                          <div className="inline-flex items-center px-3 py-1 bg-gray-900 text-white rounded-md text-xs font-semibold mb-3">
                            {categoryLabels[campaign.pricing_tier as Category]}
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-4 font-normal line-clamp-2">
                          {campaign.short_description || campaign.description}
                        </p>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gray-900 transition-all"
                              style={{
                                width: `${Math.min(
                                  (campaign.raised_amount / campaign.goal_amount) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <span className="font-bold text-gray-900">
                              ${(campaign.raised_amount / 1000).toFixed(0)}K
                            </span>
                            <span className="text-gray-600 font-normal">
                              {' '}
                              / ${(campaign.goal_amount / 1000).toFixed(0)}K
                            </span>
                          </div>
                          <span className="text-gray-600 font-medium">
                            {campaign.backer_count} backers
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {filteredCampaigns.length === 0 && !loading && (
            <div className="text-center py-20">
              <p className="text-gray-600 text-base font-medium">No campaigns found matching your filters</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
