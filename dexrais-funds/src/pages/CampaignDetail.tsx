import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { parseUnits, formatUnits } from 'viem';
import { base } from 'wagmi/chains';
import { config } from '../main';
import {
  DollarSign,
  Users,
  Clock,
  Target,
  Shield,
  CheckCircle,
  ExternalLink,
  Share2,
  Copy,
  ArrowLeft,
  AlertCircle,
  Building2,
  MapPin,
  Briefcase,
  TrendingUp,
  PieChart,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Header from '../components/Landing/Header';
import { getTierDetails, PricingTier } from '../lib/pricing';

// USDC on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_DECIMALS = 6;

// ERC20 ABI (approve and transfer functions)
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

interface Campaign {
  id: string;
  creator_wallet: string;
  title: string;
  description: string;
  short_description: string | null;
  category: string;
  logo_image_url: string | null;
  header_image_url: string | null;
  goal_amount: number;
  raised_amount: number;
  currency: string;
  duration_days: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  safe_address: string | null;
  backer_count: number;
  view_count: number;
  pricing_tier: PricingTier | null;
  featured_until: string | null;
  tags: string[] | null;
  video_url: string | null;
  github_url: string | null;
  whitepaper_url: string | null;
  created_at: string;
  published_at: string | null;

  // Transparency fields
  company_name: string | null;
  company_description: string | null;
  company_location: string | null;
  company_website: string | null;
  company_registration: string | null;
  dao_purpose: string | null;
  dao_governance: string | null;
  contributor_benefits: string | null;
  utility_type: 'token' | 'nft' | 'rwa' | 'governance' | 'revenue_share' | null;
  token_details: Record<string, any> | null;
  rwa_details: Record<string, any> | null;
  risk_factors: string | null;
  legal_structure: string | null;
  audit_report_url: string | null;
  team_description: string | null;
  team_linkedin: string | null;
  telegram_url: string | null;
  medium_url: string | null;
  funds_allocation: Record<string, number> | null;
  roadmap: Record<string, any> | null;
}

interface Milestone {
  id: string;
  campaign_id: string;
  title: string;
  description: string | null;
  target_percentage: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

interface Backer {
  id: string;
  wallet_address: string;
  amount: number;
  contributed_at: string;
  tx_hash: string;
  currency: string;
}

// Hardcoded dummy campaign data
const DUMMY_CAMPAIGN: Campaign = {
  id: 'c1e5a8b0-1234-4567-89ab-123456789abc',
  creator_wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
  title: 'DeFi Yield Optimizer - Next Generation Smart Contracts',
  description: `## About the Project

DeFi Yield Optimizer is a revolutionary protocol that automatically optimizes yield farming strategies across multiple DeFi protocols. Our smart contracts analyze real-time market conditions and automatically reallocate your assets to maximize returns while minimizing risk.

## Key Features

- **Automated Strategy Optimization**: AI-powered algorithms continuously monitor and adjust your portfolio
- **Multi-Chain Support**: Works seamlessly across Ethereum, Polygon, Arbitrum, and Base
- **Gas-Efficient**: Advanced batching techniques reduce transaction costs by up to 80%
- **Security First**: Audited by leading security firms with $10M bug bounty program
- **DAO Governance**: Community-driven decision making through token holders

## Technology Stack

Built on cutting-edge blockchain technology:
- Solidity 0.8.20 smart contracts
- Chainlink oracles for price feeds
- The Graph for indexing
- IPFS for decentralized storage

## Use of Funds

- 40% Development and Engineering
- 25% Security Audits and Bug Bounties
- 20% Marketing and Community Growth
- 15% Operations and Legal`,
  short_description: 'Automated yield optimization protocol maximizing DeFi returns across multiple chains with AI-powered strategies and DAO governance.',
  category: 'defi',
  logo_image_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop',
  header_image_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=600&fit=crop',
  goal_amount: 500000,
  raised_amount: 287500,
  currency: 'USDC',
  duration_days: 90,
  start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  end_date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'active',
  safe_address: '0x1234567890123456789012345678901234567890',
  backer_count: 156,
  view_count: 3247,
  pricing_tier: 'pro',
  featured_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  tags: ['DeFi', 'Yield Farming', 'Multi-Chain', 'DAO', 'Base Chain'],
  video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  github_url: 'https://github.com/defiyield',
  whitepaper_url: 'https://defiyield.example/whitepaper.pdf',
  created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  published_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  company_name: 'DeFi Yield Labs Inc.',
  company_description: 'DeFi Yield Labs is a blockchain technology company focused on building innovative DeFi protocols that make crypto investing accessible and profitable for everyone.',
  company_location: 'San Francisco, CA, USA',
  company_website: 'https://defiyield.example',
  company_registration: 'Delaware C-Corp',
  dao_purpose: 'The DAO governs protocol parameters, strategy whitelisting, fee structures, and treasury management. All major decisions require community voting.',
  dao_governance: 'Token-based voting with 1 token = 1 vote. Proposals require 100,000 tokens to create and 4% quorum to pass. Voting period: 7 days.',
  contributor_benefits: 'Contributors receive governance tokens proportional to their contribution. Additional benefits include early access to new strategies, reduced fees, and participation in revenue sharing.',
  utility_type: 'governance',
  token_details: null,
  rwa_details: null,
  risk_factors: 'Smart contract risks, market volatility, regulatory uncertainty, dependency on third-party protocols, potential for impermanent loss.',
  legal_structure: 'Delaware C-Corp with proper legal structure for DAO operations.',
  audit_report_url: null,
  team_description: 'Led by Alex Chen (ex-Uniswap), Sarah Martinez (ex-Aave Security), and Dr. James Wilson (PhD in Cryptography from MIT). 15+ years combined experience in DeFi.',
  team_linkedin: null,
  telegram_url: null,
  medium_url: null,
  funds_allocation: { development: 40, security: 25, marketing: 20, operations: 15 },
  roadmap: null,
};

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();

  const [campaign, setCampaign] = useState<Campaign>(DUMMY_CAMPAIGN);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [backers, setBackers] = useState<Backer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [isContributing, setIsContributing] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'backers' | 'updates'>('overview');

  // Get USDC balance
  const { data: usdcBalance } = useBalance({
    address: address,
    token: USDC_ADDRESS,
    chainId: base.id,
  });

  // Write contract hooks
  const {
    writeContract: approveUsdc,
    data: approveHash,
    isPending: isApprovePending
  } = useWriteContract();

  const {
    writeContract: transferUsdc,
    data: transferHash,
    isPending: isTransferPending
  } = useWriteContract();

  const { isLoading: isApproveConfirming } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isTransferConfirming } = useWaitForTransactionReceipt({
    hash: transferHash,
  });

  // Load campaign data from Supabase, fallback to dummy data
  const loadCampaignData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);

      // Try to fetch campaign from database
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (campaignError) {
        console.log('Campaign not found in database, using dummy data');
        setCampaign(DUMMY_CAMPAIGN);
      } else {
        setCampaign(campaignData);
      }

      // Load milestones
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .eq('campaign_id', id)
        .order('target_date', { ascending: true });

      if (milestonesData) {
        setMilestones(milestonesData);
      }

      // Load backers
      const { data: backersData } = await supabase
        .from('backers')
        .select('*')
        .eq('campaign_id', id)
        .order('created_at', { ascending: false });

      if (backersData) {
        setBackers(backersData);
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
      setCampaign(DUMMY_CAMPAIGN);
    } finally {
      setIsLoading(false);
    }
  };

  const incrementViewCount = async () => {
    if (!id) return;

    try {
      const { data: currentData } = await supabase
        .from('campaigns')
        .select('view_count')
        .eq('id', id)
        .single();

      if (currentData) {
        await supabase
          .from('campaigns')
          .update({ view_count: (currentData.view_count || 0) + 1 })
          .eq('id', id);
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const checkApproval = async () => {
    if (!campaign?.safe_address || !contributionAmount || !address) return;

    try {
      const amount = parseUnits(contributionAmount, USDC_DECIMALS);
      const allowance = await readContract(config, {
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, campaign.safe_address as `0x${string}`],
        chainId: base.id,
      });

      setNeedsApproval((allowance as bigint) < amount);
    } catch (error) {
      console.error('Error checking approval:', error);
      setNeedsApproval(true);
    }
  };

  // Load campaign data on mount
  useEffect(() => {
    if (id) {
      loadCampaignData();
      incrementViewCount();
    }
  }, [id]);

  // Check if approval is needed when contribution amount changes
  useEffect(() => {
    if (contributionAmount && campaign?.safe_address && address) {
      checkApproval();
    }
  }, [contributionAmount, campaign?.safe_address, address]);

  const handleApprove = async () => {
    if (!campaign?.safe_address || !contributionAmount) return;

    try {
      const amount = parseUnits(contributionAmount, USDC_DECIMALS);

      approveUsdc({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [campaign.safe_address as `0x${string}`, amount],
        chainId: base.id,
      });
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Failed to approve USDC. Please try again.');
    }
  };

  const handleContribute = async () => {
    if (!campaign?.safe_address || !contributionAmount || !address) {
      alert('Please connect your wallet and enter an amount');
      return;
    }

    const amount = parseFloat(contributionAmount);
    if (amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const balance = usdcBalance ? parseFloat(formatUnits(usdcBalance.value, USDC_DECIMALS)) : 0;
    if (amount > balance) {
      alert('Insufficient USDC balance');
      return;
    }

    try {
      setIsContributing(true);
      const amountWei = parseUnits(contributionAmount, USDC_DECIMALS);

      // Transfer USDC to Safe
      transferUsdc({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [campaign.safe_address as `0x${string}`, amountWei],
        chainId: base.id,
      });

    } catch (error) {
      console.error('Contribution failed:', error);
      alert('Failed to contribute. Please try again.');
      setIsContributing(false);
    }
  };

  // Handle successful transfer
  useEffect(() => {
    if (transferHash && !isTransferConfirming) {
      recordContribution(transferHash);
    }
  }, [transferHash, isTransferConfirming]);

  const recordContribution = async (txHash: string) => {
    if (!campaign || !address) return;

    try {
      const amount = parseFloat(contributionAmount);

      // Create backer record
      await supabase.from('backers').insert({
        campaign_id: campaign.id,
        wallet_address: address,
        amount: amount,
        currency: 'USDC',
        tx_hash: txHash,
        status: 'confirmed',
      });

      // Update campaign raised amount
      const newRaisedAmount = campaign.raised_amount + amount;
      const newBackerCount = campaign.backer_count + 1;

      await supabase
        .from('campaigns')
        .update({
          raised_amount: newRaisedAmount,
          backer_count: newBackerCount,
        })
        .eq('id', campaign.id);

      // Create transaction record
      await supabase.from('transactions').insert({
        campaign_id: campaign.id,
        wallet_address: address,
        amount: amount,
        tx_hash: txHash,
        type: 'contribution',
        status: 'confirmed',
      });

      alert(`Successfully contributed $${amount} USDC!`);
      setContributionAmount('');
      setIsContributing(false);

      // Reload campaign data
      loadCampaignData();
    } catch (error) {
      console.error('Failed to record contribution:', error);
      alert('Contribution succeeded but failed to update database. Please contact support.');
      setIsContributing(false);
    }
  };

  const getProgressPercentage = () => {
    if (!campaign) return 0;
    return Math.min(Math.round((campaign.raised_amount / campaign.goal_amount) * 100), 100);
  };

  const getDaysRemaining = () => {
    if (!campaign?.end_date) return 0;
    const now = new Date();
    const end = new Date(campaign.end_date);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const shareOnTwitter = () => {
    const url = window.location.href;
    const text = `Check out ${campaign?.title} on DexRais.funds!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  // Removed loading and not found states - using hardcoded data

  const progress = getProgressPercentage();
  const daysLeft = getDaysRemaining();
  const tierDetails = campaign.pricing_tier ? getTierDetails(campaign.pricing_tier) : null;
  const isFeatured = campaign.featured_until && new Date(campaign.featured_until) > new Date();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Back Button */}
        <button
          onClick={() => navigate('/launchpad')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Launchpad
        </button>

        {/* Header Image */}
        {campaign.header_image_url && (
          <div className="w-full h-64 rounded-2xl overflow-hidden mb-8">
            <img
              src={campaign.header_image_url}
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Creator */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="flex items-start gap-6 mb-6">
                {campaign.logo_image_url && (
                  <img
                    src={campaign.logo_image_url}
                    alt={campaign.title}
                    className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-4xl font-medium text-gray-900 tracking-tight" style={{ fontFamily: 'Satoshi, sans-serif' }}>{campaign.title}</h1>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{campaign.short_description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">
                      by {campaign.creator_wallet.slice(0, 4)}...{campaign.creator_wallet.slice(-4)}
                    </span>
                    {tierDetails && (
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-900 text-white">
                        {tierDetails.name}
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-900 border border-gray-200">
                      {campaign.status}
                    </span>
                    {isFeatured && <span className="text-xs text-gray-500">⭐ Featured</span>}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">Funding Progress</span>
                  <span className="text-gray-900 font-medium">{progress}%</span>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-900 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <DollarSign className="mx-auto mb-2 text-gray-900" size={20} />
                  <p className="text-xl font-medium text-gray-900">
                    ${campaign.raised_amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Raised</p>
                </div>
                <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <Target className="mx-auto mb-2 text-gray-900" size={20} />
                  <p className="text-xl font-medium text-gray-900">
                    ${campaign.goal_amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Goal</p>
                </div>
                <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <Users className="mx-auto mb-2 text-gray-900" size={20} />
                  <p className="text-xl font-medium text-gray-900">{campaign.backer_count}</p>
                  <p className="text-xs text-gray-600 mt-1">Backers</p>
                </div>
                <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <Clock className="mx-auto mb-2 text-gray-900" size={20} />
                  <p className="text-xl font-medium text-gray-900">{daysLeft}</p>
                  <p className="text-xs text-gray-600 mt-1">Days Left</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border border-gray-200 rounded-2xl p-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('milestones')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'milestones'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Milestones
                </button>
                <button
                  onClick={() => setActiveTab('backers')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'backers'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Backers
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-medium text-gray-900 mb-4">About This Campaign</h3>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {campaign.description}
                    </p>
                  </div>

                  {campaign.tags && campaign.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {campaign.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(campaign.github_url || campaign.whitepaper_url || campaign.video_url) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Resources</h4>
                      <div className="flex flex-wrap gap-3">
                        {campaign.github_url && (
                          <a
                            href={campaign.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-lg text-sm text-gray-700 hover:bg-white transition-colors"
                          >
                            <ExternalLink size={16} />
                            GitHub
                          </a>
                        )}
                        {campaign.whitepaper_url && (
                          <a
                            href={campaign.whitepaper_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-lg text-sm text-gray-700 hover:bg-white transition-colors"
                          >
                            <ExternalLink size={16} />
                            Whitepaper
                          </a>
                        )}
                        {campaign.video_url && (
                          <a
                            href={campaign.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-lg text-sm text-gray-700 hover:bg-white transition-colors"
                          >
                            <ExternalLink size={16} />
                            Video
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Company Information Section */}
                  {campaign.company_name && (
                    <div className="pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Building2 size={20} className="text-gray-700" />
                        <h3 className="text-xl font-medium text-gray-900">Company Information</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">Company Name</p>
                          <p className="text-sm text-gray-900">{campaign.company_name}</p>
                        </div>
                        {campaign.company_location && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">Location</p>
                            <div className="flex items-center gap-1">
                              <MapPin size={14} className="text-gray-500" />
                              <p className="text-sm text-gray-900">{campaign.company_location}</p>
                            </div>
                          </div>
                        )}
                        {campaign.legal_structure && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">Legal Structure</p>
                            <p className="text-sm text-gray-900">{campaign.legal_structure}</p>
                          </div>
                        )}
                        {campaign.company_website && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">Website</p>
                            <a
                              href={campaign.company_website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {campaign.company_website}
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        )}
                        {campaign.company_description && (
                          <div className="md:col-span-2">
                            <p className="text-xs font-medium text-gray-600 mb-1">About the Company</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{campaign.company_description}</p>
                          </div>
                        )}
                        {campaign.company_registration && (
                          <div className="md:col-span-2">
                            <p className="text-xs font-medium text-gray-600 mb-1">Registration</p>
                            <p className="text-xs text-gray-600">{campaign.company_registration}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DAO Purpose & Benefits Section */}
                  {(campaign.dao_purpose || campaign.contributor_benefits) && (
                    <div className="pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Target size={20} className="text-gray-700" />
                        <h3 className="text-xl font-medium text-gray-900">DAO Purpose & Benefits</h3>
                      </div>

                      {campaign.dao_purpose && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-gray-600 mb-2">Mission Statement</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{campaign.dao_purpose}</p>
                        </div>
                      )}

                      {campaign.contributor_benefits && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-gray-600 mb-2">What Contributors Receive</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{campaign.contributor_benefits}</p>
                        </div>
                      )}

                      {campaign.utility_type && (
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-2">Utility Type</p>
                          <div className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium capitalize">
                            {campaign.utility_type.replace('_', ' ')}
                          </div>
                        </div>
                      )}

                      {campaign.dao_governance && (
                        <div className="mt-4">
                          <p className="text-xs font-medium text-gray-600 mb-2">Governance Model</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{campaign.dao_governance}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Token Economics Section */}
                  {campaign.token_details && (
                    <div className="pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={20} className="text-gray-700" />
                        <h3 className="text-xl font-medium text-gray-900">Token Economics</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(campaign.token_details).map(([key, value]) => (
                          <div key={key} className="bg-white/50 p-3 rounded-lg">
                            <p className="text-xs font-medium text-gray-600 mb-1 capitalize">
                              {key.replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm text-gray-900 font-medium">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RWA Details Section */}
                  {campaign.rwa_details && (
                    <div className="pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Briefcase size={20} className="text-gray-700" />
                        <h3 className="text-xl font-medium text-gray-900">Real World Asset Details</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(campaign.rwa_details).map(([key, value]) => (
                          <div key={key} className="bg-white/50 p-3 rounded-lg">
                            <p className="text-xs font-medium text-gray-600 mb-1 capitalize">
                              {key.replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm text-gray-900 font-medium">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Team Section */}
                  {campaign.team_description && (
                    <div className="pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Users size={20} className="text-gray-700" />
                        <h3 className="text-xl font-medium text-gray-900">Team</h3>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed mb-4">{campaign.team_description}</p>
                      {campaign.team_linkedin && (
                        <a
                          href={campaign.team_linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                        >
                          <ExternalLink size={16} />
                          View Team on LinkedIn
                        </a>
                      )}
                    </div>
                  )}

                  {/* Fund Allocation Section */}
                  {campaign.funds_allocation && (
                    <div className="pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-4">
                        <PieChart size={20} className="text-gray-700" />
                        <h3 className="text-xl font-medium text-gray-900">Use of Funds</h3>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(campaign.funds_allocation).map(([category, percentage]) => (
                          <div key={category}>
                            <div className="flex justify-between mb-1.5">
                              <span className="text-sm text-gray-700 capitalize">{category.replace(/_/g, ' ')}</span>
                              <span className="text-sm font-medium text-gray-900">{percentage}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gray-900 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Factors Section */}
                  {campaign.risk_factors && (
                    <div className="pt-6 border-t border-gray-200">
                      <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
                          <div>
                            <h3 className="text-base font-medium text-amber-900 mb-2">Risk Factors</h3>
                            <p className="text-sm text-amber-800 leading-relaxed">{campaign.risk_factors}</p>
                          </div>
                        </div>

                        {campaign.audit_report_url && (
                          <a
                            href={campaign.audit_report_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white border border-amber-300 text-amber-900 rounded-lg text-sm hover:bg-amber-50 transition-colors"
                          >
                            <Shield size={16} />
                            View Security Audit Report
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Social Links Section */}
                  {(campaign.telegram_url || campaign.medium_url) && (
                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Community & Updates</h4>
                      <div className="flex flex-wrap gap-3">
                        {campaign.telegram_url && (
                          <a
                            href={campaign.telegram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                          >
                            <ExternalLink size={16} />
                            Telegram Community
                          </a>
                        )}
                        {campaign.medium_url && (
                          <a
                            href={campaign.medium_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                          >
                            <FileText size={16} />
                            Medium Blog
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'milestones' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-medium text-gray-900 mb-4">Campaign Milestones</h3>
                  {milestones.length === 0 ? (
                    <p className="text-gray-600 text-sm">No milestones defined yet.</p>
                  ) : (
                    milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="p-4 bg-white/50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {milestone.is_completed ? (
                              <CheckCircle className="text-green-600" size={20} />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                            )}
                            <h4 className="text-base font-medium text-gray-900">
                              {milestone.title}
                            </h4>
                          </div>
                          <span className="text-xs text-gray-600">
                            {milestone.target_percentage}% funding
                          </span>
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-gray-600 ml-7">{milestone.description}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'backers' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-medium text-gray-900 mb-4">
                    Transaction History ({backers.length})
                  </h3>
                  {backers.length === 0 ? (
                    <p className="text-gray-600 text-sm">No contributions yet. Be the first!</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-2 text-xs font-medium text-gray-600">Date</th>
                            <th className="text-left py-3 px-2 text-xs font-medium text-gray-600">From</th>
                            <th className="text-right py-3 px-2 text-xs font-medium text-gray-600">Amount</th>
                            <th className="text-right py-3 px-2 text-xs font-medium text-gray-600">Transaction</th>
                          </tr>
                        </thead>
                        <tbody>
                          {backers.map((backer) => (
                            <tr key={backer.id} className="border-b border-gray-100 hover:bg-white/50 transition-colors">
                              <td className="py-3 px-2 text-sm text-gray-700">
                                {new Date(backer.contributed_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </td>
                              <td className="py-3 px-2">
                                <code className="text-xs text-gray-900 font-mono">
                                  {backer.wallet_address.slice(0, 6)}...{backer.wallet_address.slice(-4)}
                                </code>
                              </td>
                              <td className="py-3 px-2 text-sm text-right font-medium text-gray-900">
                                ${backer.amount.toLocaleString()} {backer.currency || 'USDC'}
                              </td>
                              <td className="py-3 px-2 text-right">
                                <a
                                  href={`https://basescan.org/tx/${backer.tx_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  View
                                  <ExternalLink size={12} />
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
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Contribute Card */}
            <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-lg p-5 sticky top-20">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contribute to Campaign</h3>

              {!isConnected ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600 mb-4">Connect your wallet to contribute</p>
                  <button
                    onClick={() => {/* open wallet modal */}}
                    className="w-full px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors text-sm font-medium"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : campaign.status !== 'active' ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600">Campaign is not currently accepting contributions</p>
                </div>
              ) : !campaign.safe_address ? (
                <div className="text-center py-8">
                  <p className="text-sm text-red-600">Campaign Safe not configured yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* USDC Balance */}
                  <div className="p-3 bg-white/50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Your USDC Balance</p>
                    <p className="text-lg font-medium text-gray-900">
                      {usdcBalance
                        ? `$${parseFloat(formatUnits(usdcBalance.value, USDC_DECIMALS)).toFixed(2)}`
                        : '$0.00'}
                    </p>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Amount (USDC)</label>
                    <input
                      type="number"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-white/50 border border-gray-300/50 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>

                  {/* Contribute Button */}
                  {needsApproval && contributionAmount && parseFloat(contributionAmount) > 0 ? (
                    <button
                      onClick={handleApprove}
                      disabled={isApprovePending || isApproveConfirming}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isApprovePending || isApproveConfirming
                        ? 'Approving...'
                        : 'Approve USDC'}
                    </button>
                  ) : (
                    <button
                      onClick={handleContribute}
                      disabled={
                        !contributionAmount ||
                        parseFloat(contributionAmount) <= 0 ||
                        isContributing ||
                        isTransferPending ||
                        isTransferConfirming
                      }
                      className="w-full px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isContributing || isTransferPending || isTransferConfirming
                        ? 'Contributing...'
                        : 'Contribute Now'}
                    </button>
                  )}

                  <p className="text-xs text-gray-500 text-center">
                    Funds are held in a Gnosis Safe escrow until milestones are completed
                  </p>
                </div>
              )}
            </div>

            {/* Gnosis Safe Info */}
            {campaign.safe_address && (
              <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="text-green-600" size={20} />
                  <h3 className="text-base font-medium text-gray-900">Gnosis Safe Escrow</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Safe Address</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono text-gray-900 break-all">
                        {campaign.safe_address}
                      </p>
                      <button
                        onClick={() => copyToClipboard(campaign.safe_address!)}
                        className="p-1 hover:bg-white/50 rounded transition-colors"
                      >
                        <Copy size={14} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <a
                    href={`https://app.safe.global/base:${campaign.safe_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white/50 rounded-lg text-sm text-gray-700 hover:bg-white transition-colors"
                  >
                    <ExternalLink size={16} />
                    View on Safe
                  </a>
                </div>
              </div>
            )}

            {/* Share Card */}
            <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-lg p-5">
              <h3 className="text-base font-medium text-gray-900 mb-4">Share Campaign</h3>
              <div className="space-y-2">
                <button
                  onClick={shareOnTwitter}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
                >
                  <Share2 size={16} />
                  Share on Twitter
                </button>
                <button
                  onClick={() => copyToClipboard(window.location.href)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white/50 rounded-lg text-sm text-gray-700 hover:bg-white transition-colors"
                >
                  <Copy size={16} />
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
