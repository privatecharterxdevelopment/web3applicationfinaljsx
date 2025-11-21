import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Rocket, Clock, Eye, Users, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Header from '../components/Landing/Header';
import { getTierDetails, formatPrice, PricingTier } from '../lib/pricing';

interface Campaign {
  id: string;
  title: string;
  description: string;
  logo_image_url: string | null;
  goal_amount: number;
  raised_amount: number;
  status: string;
  pricing_tier: PricingTier | null;
  launch_fee_paid_amount: number | null;
  transaction_fee_percentage: number | null;
  featured_until: string | null;
  backer_count: number;
  view_count: number;
  created_at: string;
  published_at: string | null;
}

interface UserStats {
  total_campaigns: number;
  active_campaigns: number;
  total_raised: number;
  total_fees_paid: number;
}

export default function CreatorDashboard() {
  const { user, isConnected } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total_campaigns: 0,
    active_campaigns: 0,
    total_raised: 0,
    total_fees_paid: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isConnected && user) {
      loadDashboardData();
    }
  }, [isConnected, user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Fetch user's campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('creator_wallet', user.wallet_address)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      setCampaigns(campaignsData || []);

      // Calculate stats
      const totalCampaigns = campaignsData?.length || 0;
      const activeCampaigns = campaignsData?.filter(c => c.status === 'active').length || 0;
      const totalRaised = campaignsData?.reduce((sum, c) => sum + (c.raised_amount || 0), 0) || 0;
      const totalFeesPaid = campaignsData?.reduce((sum, c) => sum + (c.launch_fee_paid_amount || 0), 0) || 0;

      setStats({
        total_campaigns: totalCampaigns,
        active_campaigns: activeCampaigns,
        total_raised: totalRaised,
        total_fees_paid: totalFeesPaid,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
      pending_payment: { label: 'Awaiting Payment', className: 'bg-yellow-100 text-yellow-700' },
      active: { label: 'Active', className: 'bg-green-100 text-green-700' },
      funded: { label: 'Funded', className: 'bg-blue-100 text-blue-700' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
      completed: { label: 'Completed', className: 'bg-purple-100 text-purple-700' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-500' },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getTierBadge = (tier: PricingTier | null) => {
    if (!tier) return null;

    const tierDetails = getTierDetails(tier);
    const tierColors: Record<PricingTier, string> = {
      starter: 'bg-blue-100 text-blue-700',
      pro: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-gray-900 text-white',
      enterprise_audit: 'bg-amber-100 text-amber-700',
    };

    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${tierColors[tier]}`}>
        {tierDetails.name}
      </span>
    );
  };

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min(Math.round((raised / goal) * 100), 100);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-32 px-6 text-center">
          <h1 className="text-4xl font-light text-gray-900 mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600">Please connect your wallet to view your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-light text-gray-900 mb-2">
              Creator <span className="font-medium">Dashboard</span>
            </h1>
            <p className="text-gray-600 font-light">
              Manage your campaigns and track performance
            </p>
          </div>
          <button
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors font-medium"
          >
            <Plus size={20} />
            New Campaign
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Campaigns */}
          <div className="glassmorphic-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Rocket size={24} className="text-gray-600" />
              <span className="text-3xl font-light text-gray-900">
                {stats.total_campaigns}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-light">Total Campaigns</p>
          </div>

          {/* Active Campaigns */}
          <div className="glassmorphic-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock size={24} className="text-green-600" />
              <span className="text-3xl font-light text-gray-900">
                {stats.active_campaigns}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-light">Active Campaigns</p>
          </div>

          {/* Total Raised */}
          <div className="glassmorphic-card p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign size={24} className="text-blue-600" />
              <span className="text-3xl font-light text-gray-900">
                ${stats.total_raised.toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-light">Total Raised</p>
          </div>

          {/* Total Fees Paid */}
          <div className="glassmorphic-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Users size={24} className="text-purple-600" />
              <span className="text-3xl font-light text-gray-900">
                ${stats.total_fees_paid.toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-light">Fees Paid</p>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="glassmorphic-card p-8">
          <h2 className="text-2xl font-medium text-gray-900 mb-6">Your Campaigns</h2>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-light">Loading campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Rocket size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 font-light mb-6">
                Create your first campaign to start fundraising
              </p>
              <button
                onClick={() => navigate('/pricing')}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors font-medium"
              >
                Create Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => {
                const progress = getProgressPercentage(campaign.raised_amount, campaign.goal_amount);
                const isFeatured = campaign.featured_until && new Date(campaign.featured_until) > new Date();

                return (
                  <div
                    key={campaign.id}
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                    className="bg-white hover:bg-gray-50 rounded-xl p-6 cursor-pointer transition-all border border-gray-200 hover:border-gray-900"
                  >
                    <div className="flex items-start gap-6">
                      {/* Logo */}
                      {campaign.logo_image_url && (
                        <img
                          src={campaign.logo_image_url}
                          alt={campaign.title}
                          className="w-20 h-20 object-cover rounded-xl"
                        />
                      )}

                      {/* Content */}
                      <div className="flex-1">
                        {/* Title and Badges */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-medium text-gray-900 mb-2">
                              {campaign.title}
                              {isFeatured && (
                                <span className="ml-2 text-xs text-amber-600">⭐ Featured</span>
                              )}
                            </h3>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(campaign.status)}
                              {getTierBadge(campaign.pricing_tier)}
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="text-gray-900 font-medium">{progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gray-900 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <DollarSign size={16} />
                            <span>
                              ${campaign.raised_amount.toLocaleString()} / ${campaign.goal_amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={16} />
                            <span>{campaign.backer_count} backers</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye size={16} />
                            <span>{campaign.view_count} views</span>
                          </div>
                          {campaign.launch_fee_paid_amount && (
                            <div className="flex items-center gap-1 text-purple-600">
                              <DollarSign size={16} />
                              <span>Fee: ${campaign.launch_fee_paid_amount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
