import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Shield, CheckCircle, Clock, XCircle,
  TrendingUp, FileText, Building2, Coins, AlertCircle, Edit, Eye, Download,
  Activity, DollarSign, Plane, Ship, Home as HomeIcon, Briefcase, Plus, ExternalLink, Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { web3Service } from '../../lib/web3';
import { useAccount } from 'wagmi';

export default function ProfileOverview() {
  const { user } = useAuth();
  const { address: walletAddress, isConnected, chain } = useAccount();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [spvs, setSpvs] = useState([]);
  const [tokenizedAssets, setTokenizedAssets] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [loadingNFTs, setLoadingNFTs] = useState(false);
  const [stats, setStats] = useState({
    totalInvestment: 0,
    activeAssets: 0,
    totalReturns: 0,
    activeSPVs: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchAllData();
    } else {
      // If no user, stop loading and show empty state
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user.id, not entire user object

  // Fetch NFTs when wallet is connected
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!isConnected || !walletAddress || chain?.id !== 8453) {
        setNfts([]);
        return;
      }

      setLoadingNFTs(true);
      try {
        const nftResult = await web3Service.getUserNFTsViaAlchemy(walletAddress);
        setNfts(nftResult);
      } catch (error) {
        console.error('Failed to fetch NFTs:', error);
        setNfts([]);
      } finally {
        setLoadingNFTs(false);
      }
    };

    fetchNFTs();
  }, [isConnected, walletAddress, chain?.id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfile(),
        fetchActivities(),
        fetchSPVs(),
        fetchTokenizedAssets()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setProfileData(data || {
        kyc_status: 'not_started',
        wallet_address: null,
        created_at: user.created_at
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      // Fetch user requests (existing table in database)
      const { data: requests } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch CO2 certificate requests
      const { data: co2Requests } = await supabase
        .from('co2_certificate_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Combine all activities
      const allActivities = [];

      // Add user service requests
      if (requests) {
        requests.forEach(request => {
          const typeIcons = {
            'private_jet_charter': Plane,
            'empty_leg': Plane,
            'helicopter': Plane,
            'yacht': Ship,
            'luxury_car': Activity,
            'adventure': Activity,
            'tokenization': Coins,
            'spv_formation': Building2
          };

          allActivities.push({
            id: `request-${request.id}`,
            type: request.type,
            title: request.service_type || request.type || 'Service Request',
            description: request.details || request.description || 'Request submitted',
            amount: request.estimated_cost ? `$${Number(request.estimated_cost).toLocaleString()}` : null,
            date: new Date(request.created_at),
            status: request.status || 'pending',
            icon: typeIcons[request.type] || Activity
          });
        });
      }

      // Add CO2 certificate requests
      if (co2Requests) {
        co2Requests.forEach(co2 => {
          allActivities.push({
            id: `co2-${co2.id}`,
            type: 'co2',
            title: 'CO2 Certificate Purchase',
            description: `Offset ${co2.amount_tons || 0} tons of CO2`,
            amount: co2.total_cost ? `€${Number(co2.total_cost).toLocaleString()}` : null,
            date: new Date(co2.created_at),
            status: co2.status || 'pending',
            icon: Activity
          });
        });
      }

      // Sort by date
      allActivities.sort((a, b) => b.date - a.date);
      setActivities(allActivities.slice(0, 10));
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    }
  };

  const fetchSPVs = async () => {
    try {
      // Check user_requests for SPV formation requests
      const { data: spvRequests } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'spv_formation')
        .order('created_at', { ascending: false});

      if (spvRequests && spvRequests.length > 0) {
        const formattedSPVs = spvRequests.map(spv => ({
          id: spv.id,
          name: spv.service_type || 'SPV Formation',
          jurisdiction: spv.details || 'Pending',
          status: spv.status || 'pending',
          formed_date: spv.created_at,
          assets: ['SPV Formation Request'],
          value: spv.estimated_cost ? `€${Number(spv.estimated_cost).toLocaleString()}` : 'N/A'
        }));

        setSpvs(formattedSPVs);

        const activeSPVs = formattedSPVs.filter(s => s.status === 'completed' || s.status === 'active').length;
        setStats(prev => ({
          ...prev,
          activeSPVs
        }));
      } else {
        setSpvs([]);
      }
    } catch (error) {
      console.error('Error fetching SPVs:', error);
      setSpvs([]);
    }
  };

  const fetchTokenizedAssets = async () => {
    try {
      // Check user_requests for tokenization requests
      const { data: tokenRequests } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'tokenization')
        .order('created_at', { ascending: false });

      if (tokenRequests && tokenRequests.length > 0) {
        const assetIcons = {
          'jet': '✈️',
          'helicopter': '🚁',
          'yacht': '🛥️',
          'real-estate': '🏠',
          'luxury-car': '🏎️',
          'art': '🎨',
          'business': '💼'
        };

        const formattedAssets = tokenRequests.map(asset => ({
          id: asset.id,
          name: asset.service_type || 'Tokenization Request',
          type: 'Asset Tokenization',
          tokens: 0,
          totalTokens: 1000,
          value: asset.estimated_cost ? `$${Number(asset.estimated_cost).toLocaleString()}` : 'N/A',
          apy: 'N/A',
          status: asset.status,
          icon: '📦'
        }));

        setTokenizedAssets(formattedAssets);

        const activeAssets = formattedAssets.filter(a => a.status === 'completed').length;
        const totalInvestment = formattedAssets
          .filter(a => a.status === 'completed' && a.value !== 'N/A')
          .reduce((sum, a) => {
            const value = parseFloat(a.value.replace(/[$,]/g, ''));
            return sum + (isNaN(value) ? 0 : value);
          }, 0);

        setStats(prev => ({
          ...prev,
          activeAssets,
          totalInvestment,
          totalReturns: totalInvestment * 0.075 // Estimate 7.5% average return
        }));
      } else {
        setTokenizedAssets([]);
      }
    } catch (error) {
      console.error('Error fetching tokenized assets:', error);
      setTokenizedAssets([]);
    }
  };

  const getKYCStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-500/20 text-green-700 border-green-500/40';
      case 'pending': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/40';
      case 'rejected': return 'bg-red-500/20 text-red-700 border-red-500/40';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-500/40';
    }
  };

  const getKYCStatusIcon = (status) => {
    switch (status) {
      case 'verified': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'rejected': return <XCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'active': return 'bg-green-500/20 text-green-700';
      case 'pending': return 'bg-yellow-500/20 text-yellow-700';
      case 'in_progress': return 'bg-blue-500/20 text-blue-700';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Not Logged In</h2>
          <p className="text-gray-600">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-4 tracking-tighter">
            Profile Overview
          </h1>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto font-light">
            Manage your account, view your assets, SPVs, and activity history
          </p>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={24} className="text-gray-600" />
            <TrendingUp size={16} className="text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalInvestment)}</h3>
          <p className="text-sm text-gray-500">Total Investment</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Coins size={24} className="text-gray-600" />
            <span className="text-xs font-medium text-gray-500">{stats.activeAssets} Active</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.activeAssets}</h3>
          <p className="text-sm text-gray-500">Tokenized Assets</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={24} className="text-gray-600" />
            <span className="text-xs font-medium text-green-600">+12.5%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalReturns)}</h3>
          <p className="text-sm text-gray-500">Total Returns</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Building2 size={24} className="text-gray-600" />
            <span className="text-xs font-medium text-gray-500">{stats.activeSPVs} Active</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.activeSPVs}</h3>
          <p className="text-sm text-gray-500">SPV Formations</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Info & KYC */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              <button className="text-gray-600 hover:text-gray-900">
                <Edit size={16} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={32} className="text-gray-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {user?.first_name} {user?.last_name}
                </h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-gray-400" />
                <span className="text-gray-700">{user?.email || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-gray-400" />
                <span className="text-gray-700">{profileData?.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={14} className="text-gray-400" />
                <span className="text-gray-700">{profileData?.city || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-gray-700">Joined {formatDate(profileData?.created_at)}</span>
              </div>
            </div>
          </div>

          {/* KYC Status Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={20} className="text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">KYC Verification</h2>
            </div>

            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${getKYCStatusColor(profileData?.kyc_status || 'not_started')}`}>
              {getKYCStatusIcon(profileData?.kyc_status || 'not_started')}
              <span className="font-medium capitalize">
                {profileData?.kyc_status === 'not_started' ? 'Not Started' : profileData?.kyc_status || 'Not Started'}
              </span>
            </div>

            {profileData?.kyc_status !== 'verified' && (
              <button className="mt-4 w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                {profileData?.kyc_status === 'not_started' ? 'Start Verification' : 'View Status'}
              </button>
            )}

            <p className="mt-4 text-xs text-gray-500">
              {profileData?.kyc_status === 'verified'
                ? 'Your account is fully verified'
                : 'Complete KYC to unlock all features and higher investment limits'}
            </p>
          </div>

          {/* NFT Membership Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles size={20} className="text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">VIP Membership NFT</h2>
            </div>

            {loadingNFTs ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
              </div>
            ) : !isConnected || chain?.id !== 8453 ? (
              <div className="text-center py-6">
                <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                  <div className="text-center">
                    <Sparkles size={48} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">Connect Wallet</p>
                    <p className="text-xs text-gray-300 mt-1">on Base Network</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Connect your wallet on Base to see your NFT membership
                </p>
              </div>
            ) : nfts.length > 0 ? (
              <div>
                <div className="relative group">
                  <div className="w-full aspect-square bg-gray-900 rounded-xl overflow-hidden shadow-lg">
                    <video
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    >
                      <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivateCharterX_transparent-_3_.mp4" type="video/mp4" />
                    </video>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                      ✓ OWNED
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-gray-900">{nfts[0].name}</h3>
                    <span className="text-xs font-medium text-gray-500">#{nfts[0].tokenId}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    VIP Membership • {nfts[0].discountPercent}% Discount Active
                  </p>
                  <a
                    href="https://opensea.io/collection/privatecharterx-membership-card"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors text-sm font-medium"
                  >
                    <ExternalLink size={14} />
                    View on OpenSea
                  </a>
                </div>
              </div>
            ) : (
              <div>
                <a
                  href="https://opensea.io/collection/privatecharterx-membership-card"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-gray-900 transition-all duration-300 cursor-pointer mb-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-center relative z-10">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:scale-110 transition-transform">
                        <Plus size={40} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Your NFT Here</p>
                      <p className="text-xs text-gray-400 mt-2">Click to buy on OpenSea</p>
                    </div>
                  </div>
                </a>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-900 mb-2">Unlock VIP Benefits:</h4>
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      Free Empty Leg Flight
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      Up to 10% Permanent Discount
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      Priority Support & Access
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      $PVCX Token Rewards
                    </li>
                  </ul>
                  <a
                    href="https://opensea.io/collection/privatecharterx-membership-card"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm font-medium mt-4"
                  >
                    <ExternalLink size={14} />
                    Buy on OpenSea
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Column - Activity & Transactions */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <button className="text-sm text-gray-600 hover:text-gray-900">View All</button>
            </div>

            <div className="space-y-4">
              {activities.slice(0, 4).map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent size={18} className="text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{activity.title}</h4>
                      <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{formatDate(activity.date)}</span>
                        {activity.amount && (
                          <span className="text-xs font-medium text-gray-900">{activity.amount}</span>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tokenized Assets */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Tokenized Assets</h2>
              <button className="text-sm text-gray-600 hover:text-gray-900">View All</button>
            </div>

            <div className="space-y-4">
              {tokenizedAssets.map((asset) => (
                <div key={asset.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{asset.icon}</span>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{asset.name}</h4>
                        <p className="text-xs text-gray-500">{asset.type}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(asset.status)}`}>
                      {asset.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Your Tokens</p>
                      <p className="text-sm font-bold text-gray-900">{asset.tokens}/{asset.totalTokens}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Value</p>
                      <p className="text-sm font-bold text-gray-900">{asset.value}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">APY</p>
                      <p className="text-sm font-bold text-green-600">{asset.apy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - SPVs */}
        <div className="space-y-6">
          {/* SPV Formations */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">SPV Formations</h2>
              <button className="text-sm text-gray-600 hover:text-gray-900">View All</button>
            </div>

            <div className="space-y-4">
              {spvs.map((spv) => (
                <div key={spv.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{spv.name}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin size={12} />
                        {spv.jurisdiction}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(spv.status)}`}>
                      {spv.status}
                    </span>
                  </div>

                  {spv.formed_date && (
                    <div className="text-xs text-gray-500 mb-2">
                      Formed: {formatDate(spv.formed_date)}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mb-3">
                    {spv.assets.map((asset, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                        {asset}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-500">Total Value</span>
                    <span className="text-sm font-bold text-gray-900">{spv.value}</span>
                  </div>

                  <button className="mt-3 w-full px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium flex items-center justify-center gap-2">
                    <Eye size={14} />
                    View Details
                  </button>
                </div>
              ))}
            </div>

            <button className="mt-4 w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
              + New SPV Formation
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left text-sm font-medium text-gray-700 transition-colors flex items-center gap-2">
                <FileText size={16} />
                Download Statement
              </button>
              <button className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left text-sm font-medium text-gray-700 transition-colors flex items-center gap-2">
                <Download size={16} />
                Export Data
              </button>
              <button className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left text-sm font-medium text-gray-700 transition-colors flex items-center gap-2">
                <Briefcase size={16} />
                Tax Documents
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
