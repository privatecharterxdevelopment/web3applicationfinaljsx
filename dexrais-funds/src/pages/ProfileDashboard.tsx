import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useBalance } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import {
  Wallet,
  Send,
  Download,
  Settings,
  User,
  Mail,
  FileText,
  ExternalLink,
  Copy,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUsdcBalance } from '../hooks/useUsdcBalance';
import { supabase, Campaign as CampaignType, Transaction } from '../lib/supabase';
import Header from '../components/Landing/Header';

type TabType = 'overview' | 'campaigns' | 'transactions' | 'settings';

interface UserCampaign extends CampaignType {
  progress_percentage: number;
}

export default function ProfileDashboard() {
  const { address, isConnected } = useAccount();
  const { user, updateUserProfile } = useAuth();
  const { open } = useAppKit();
  const navigate = useNavigate();

  // Wallet balances
  const { data: ethBalance } = useBalance({ address });
  const { balanceFormatted: usdcBalance } = useUsdcBalance(address);

  // State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [campaigns, setCampaigns] = useState<UserCampaign[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Settings form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
    }
  }, [user]);

  useEffect(() => {
    if (isConnected && address) {
      loadUserData();
    }
  }, [isConnected, address, activeTab]);

  const loadUserData = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      // Load campaigns
      if (activeTab === 'campaigns') {
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('creator_wallet', address.toLowerCase())
          .order('created_at', { ascending: false });

        if (!campaignsError && campaignsData) {
          const campaignsWithProgress = campaignsData.map(c => ({
            ...c,
            progress_percentage: Math.min(Math.round((c.raised_amount / c.goal_amount) * 100), 100),
          }));
          setCampaigns(campaignsWithProgress);
        }
      }

      // Load transactions
      if (activeTab === 'transactions') {
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('wallet_address', address.toLowerCase())
          .order('created_at', { ascending: false })
          .limit(50);

        if (!txError && txData) {
          setTransactions(txData);
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateUserProfile({
        username: username || null,
        email: email || null,
        bio: bio || null,
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-32 px-6 text-center max-w-2xl mx-auto">
          <Wallet className="w-16 h-16 mx-auto mb-6 text-gray-400" />
          <h1 className="text-3xl font-light text-gray-900 mb-3">Connect Your Wallet</h1>
          <p className="text-sm text-gray-600 mb-8">
            Please connect your wallet to view your profile dashboard
          </p>
          <button
            onClick={() => open()}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all text-sm font-medium"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        {/* Profile Header */}
        <div className="glassmorphic-card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-medium text-gray-900">
                  {user?.username || 'Anonymous User'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-gray-600 font-mono">
                    {formatAddress(address)}
                  </p>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1 hover:bg-gray-200/50 rounded transition-colors"
                  >
                    {copied ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'campaigns', label: 'My Campaigns', icon: FileText },
            { id: 'transactions', label: 'Transactions', icon: Clock },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-xs font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white/50 text-gray-600 hover:bg-white border border-gray-300/50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Wallet Balances */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ETH Balance */}
              <div className="glassmorphic-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs text-gray-600 font-medium">ETH on Base</span>
                  </div>
                </div>
                <p className="text-2xl font-light text-gray-900 mb-4">
                  {ethBalance ? parseFloat(ethBalance.formatted).toFixed(4) : '0.0000'} ETH
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => open()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all text-xs font-medium"
                  >
                    <Send className="w-3 h-3" />
                    Send
                  </button>
                  <button
                    onClick={() => open()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-300/50 text-gray-900 rounded-lg hover:bg-gray-50 transition-all text-xs font-medium"
                  >
                    <Download className="w-3 h-3" />
                    Receive
                  </button>
                </div>
              </div>

              {/* USDC Balance */}
              <div className="glassmorphic-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-xs text-gray-600 font-medium">USDC on Base</span>
                  </div>
                </div>
                <p className="text-2xl font-light text-gray-900 mb-4">
                  {parseFloat(usdcBalance).toFixed(2)} USDC
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => open()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all text-xs font-medium"
                  >
                    <Send className="w-3 h-3" />
                    Send
                  </button>
                  <button
                    onClick={() => open()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-300/50 text-gray-900 rounded-lg hover:bg-gray-50 transition-all text-xs font-medium"
                  >
                    <Download className="w-3 h-3" />
                    Receive
                  </button>
                </div>
              </div>
            </div>

            {/* Portfolio Chart Placeholder */}
            <div className="glassmorphic-card p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Portfolio Overview</h3>
              <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center">
                <p className="text-xs text-gray-500">Chart coming soon...</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="glassmorphic-card p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Your Campaigns</h3>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-gray-600">Loading campaigns...</p>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <h4 className="text-sm font-medium text-gray-900 mb-2">No campaigns yet</h4>
                <p className="text-xs text-gray-600 mb-4">Create your first campaign to start fundraising</p>
                <button
                  onClick={() => navigate('/pricing')}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all text-xs font-medium"
                >
                  Create Campaign
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map(campaign => (
                  <div
                    key={campaign.id}
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                    className="bg-white hover:bg-gray-50 rounded-lg p-4 cursor-pointer transition-all border border-gray-200 hover:border-gray-900"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">{campaign.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{campaign.short_description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>${campaign.raised_amount.toLocaleString()} raised</span>
                          <span>•</span>
                          <span>{campaign.backer_count} backers</span>
                          <span>•</span>
                          <span className={`px-2 py-0.5 rounded ${
                            campaign.status === 'live' ? 'bg-green-100 text-green-700' :
                            campaign.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {campaign.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-900 transition-all"
                        style={{ width: `${campaign.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="glassmorphic-card p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Transaction History</h3>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-gray-600">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <h4 className="text-sm font-medium text-gray-900 mb-2">No transactions yet</h4>
                <p className="text-xs text-gray-600">Your transaction history will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-gray-600 font-medium">Date</th>
                      <th className="text-left py-3 px-2 text-gray-600 font-medium">Type</th>
                      <th className="text-left py-3 px-2 text-gray-600 font-medium">Amount</th>
                      <th className="text-left py-3 px-2 text-gray-600 font-medium">Status</th>
                      <th className="text-left py-3 px-2 text-gray-600 font-medium">Tx Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2 text-gray-900">{formatDate(tx.created_at)}</td>
                        <td className="py-3 px-2">
                          <span className="capitalize text-gray-900">{tx.type.replace('_', ' ')}</span>
                        </td>
                        <td className="py-3 px-2 text-gray-900 font-medium">${tx.amount.toLocaleString()}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            tx.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <a
                            href={`https://basescan.org/tx/${tx.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="font-mono">{formatAddress(tx.tx_hash)}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glassmorphic-card p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Profile Settings</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveSettings();
              }}
              className="space-y-4"
            >
              {/* Username */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white/50 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
