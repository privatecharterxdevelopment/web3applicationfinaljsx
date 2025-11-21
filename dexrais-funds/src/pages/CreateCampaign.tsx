import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, X, DollarSign, Calendar, Tag, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWalletClient } from 'wagmi';
import { supabase, uploadCampaignImage } from '../lib/supabase';
import Header from '../components/Landing/Header';
import TieredPayment from '../components/Payment/TieredPayment';
import { getTierDetails, PricingTier } from '../lib/pricing';
import { createAragonClient, createCampaignDAO } from '../lib/aragon';
import { walletClientToSigner } from '../lib/ethers';

const CATEGORIES = [
  { value: 'defi', label: 'DeFi' },
  { value: 'nft', label: 'NFT' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'dao', label: 'DAO' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Other' },
];

const DURATIONS = [
  { value: 30, label: '30 Days' },
  { value: 60, label: '60 Days' },
  { value: 90, label: '90 Days' },
];

export default function CreateCampaign() {
  const { user, session, isConnected, openLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: walletClient } = useWalletClient();

  // Check if user is authenticated (has session OR wallet connected with user profile)
  const isAuthenticated = session !== null || (isConnected && user !== null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      openLogin();
      navigate('/', { state: { message: 'Please login to create a campaign' } });
    }
  }, [isAuthenticated, navigate, openLogin]);

  // Get selected tier from location state
  const selectedTier = (location.state?.selectedTier as PricingTier) || 'pro';
  const tierDetails = getTierDetails(selectedTier);

  // Campaign state (for payment step)
  const [campaignId, setCampaignId] = useState<string | null>(null);

  // DAO creation state
  const [createDAO, setCreateDAO] = useState(true); // Enable DAO by default
  const [daoCreating, setDaoCreating] = useState(false);
  const [daoAddress, setDaoAddress] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('dao');
  const [goalAmount, setGoalAmount] = useState('');
  const [duration, setDuration] = useState(30);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  // Images
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Links
  const [videoUrl, setVideoUrl] = useState('');
  const [whitepaperUrl, setWhitepaperUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: Form, 2: Preview, 3: Payment

  // Image handlers
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'header' | 'cover'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      if (type === 'logo') {
        setLogoFile(file);
        setLogoPreview(preview);
      } else if (type === 'header') {
        setHeaderFile(file);
        setHeaderPreview(preview);
      } else {
        setCoverFile(file);
        setCoverPreview(preview);
      }
    };
    reader.readAsDataURL(file);
  };

  // Tag handlers
  const addTag = () => {
    if (currentTag && !tags.includes(currentTag) && tags.length < 5) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Form validation
  const validateForm = () => {
    if (!title.trim()) return 'Title is required';
    if (!description.trim()) return 'Description is required';
    if (!goalAmount || parseFloat(goalAmount) < 1000) {
      return 'Goal must be at least $1,000 USDC';
    }
    // Check tier max fundraise limit
    if (tierDetails.maxFundraise && parseFloat(goalAmount) > tierDetails.maxFundraise) {
      return `${tierDetails.name} tier has a maximum fundraise limit of CHF ${tierDetails.maxFundraise.toLocaleString()}`;
    }
    if (!logoFile) return 'Logo image is required';
    if (!headerFile) return 'Header image is required';
    return null;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create campaign in draft status with pricing tier
      // Use temporary wallet address if not connected yet
      const creatorWallet = user?.wallet_address || 'pending';

      const { data: campaign, error: createError } = await supabase
        .from('campaigns')
        .insert({
          creator_wallet: creatorWallet,
          title: title.trim(),
          short_description: shortDescription.trim() || null,
          description: description.trim(),
          category,
          goal_amount: parseFloat(goalAmount),
          duration_days: duration,
          tags: tags.length > 0 ? tags : null,
          video_url: videoUrl.trim() || null,
          whitepaper_url: whitepaperUrl.trim() || null,
          github_url: githubUrl.trim() || null,
          status: 'pending_payment',
          pricing_tier: selectedTier,
          transaction_fee_percentage: tierDetails.transactionFee,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Upload images
      if (logoFile) {
        const logoUrl = await uploadCampaignImage(logoFile, campaign.id, 'logo');
        await supabase
          .from('campaigns')
          .update({ logo_image_url: logoUrl })
          .eq('id', campaign.id);
      }

      if (headerFile) {
        const headerUrl = await uploadCampaignImage(headerFile, campaign.id, 'header');
        await supabase
          .from('campaigns')
          .update({ header_image_url: headerUrl })
          .eq('id', campaign.id);
      }

      if (coverFile) {
        const coverUrl = await uploadCampaignImage(coverFile, campaign.id, 'cover');
        await supabase
          .from('campaigns')
          .update({ cover_image_url: coverUrl })
          .eq('id', campaign.id);
      }

      // Create DAO if enabled
      if (createDAO && walletClient) {
        try {
          setDaoCreating(true);
          setError('Creating DAO for governance... This may take a minute.');

          const signer = walletClientToSigner(walletClient);
          const aragonClient = createAragonClient(signer);
          const treasuryAddress = user?.wallet_address || creatorWallet; // Use creator wallet as initial treasury

          const daoInfo = await createCampaignDAO(
            aragonClient,
            title.trim(),
            creatorWallet,
            treasuryAddress
          );

          // Update campaign with DAO information
          await supabase
            .from('campaigns')
            .update({
              dao_address: daoInfo.daoAddress,
              dao_name: daoInfo.daoName,
              dao_voting_plugin_address: daoInfo.votingPluginAddress,
              dao_treasury_address: treasuryAddress,
              dao_metadata: daoInfo.metadata,
              dao_created_at: new Date().toISOString(),
            })
            .eq('id', campaign.id);

          setDaoAddress(daoInfo.daoAddress);
          setDaoCreating(false);
          setError(null);
        } catch (daoError: any) {
          console.error('DAO creation error:', daoError);
          setDaoCreating(false);
          // Don't fail the campaign creation if DAO fails, just warn
          setError(`Campaign created, but DAO creation failed: ${daoError.message}. You can add a DAO later.`);
        }
      }

      // Save campaign ID and move to payment step
      setCampaignId(campaign.id);
      setStep(3);

    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async (txHash: string) => {
    if (!campaignId || !user) return;

    try {
      // Calculate featured_until date
      let featuredUntil = null;
      if (tierDetails.features.featuredDays > 0) {
        const date = new Date();
        date.setDate(date.getDate() + tierDetails.features.featuredDays);
        featuredUntil = date.toISOString();
      }

      // Update campaign with payment info, actual creator wallet, and publish
      await supabase
        .from('campaigns')
        .update({
          creator_wallet: user.wallet_address, // Update with actual wallet
          status: 'active',
          launch_fee_paid_amount: tierDetails.priceUsdc,
          launch_fee_tx_hash: txHash,
          featured_until: featuredUntil,
          published_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      // Redirect to campaign page
      navigate(`/campaign/${campaignId}`);
    } catch (err) {
      console.error('Failed to update campaign after payment:', err);
      setError('Payment successful but failed to publish campaign. Please contact support.');
    }
  };

  // Handle payment cancellation
  const handlePaymentCancel = () => {
    setStep(1);
  };

  // Show loading state while checking auth
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-3xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-medium text-gray-900 mb-2 tracking-tight" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            Create Campaign
          </h1>
          <p className="text-sm text-gray-600">
            {tierDetails.name} Tier · {tierDetails.priceUsdc} USDC launch fee · {tierDetails.transactionFee}% transaction fee
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center mb-8 border-b border-gray-200 pb-4">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step >= 1 ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
              1
            </div>
            <span className="text-xs font-medium">Details</span>
          </div>
          <div className="flex-1 h-px bg-gray-200 mx-2" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step >= 2 ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
              2
            </div>
            <span className="text-xs font-medium">Preview</span>
          </div>
          <div className="flex-1 h-px bg-gray-200 mx-2" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step >= 3 ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
              3
            </div>
            <span className="text-xs font-medium">Payment</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Payment Step */}
        {step === 3 && campaignId && (
          <TieredPayment
            tier={tierDetails}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        )}

        {/* Form */}
        {step === 1 && (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="space-y-4">
            <h2 className="text-xl font-medium text-gray-900">Basic Information</h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Campaign Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 transition-colors text-sm"
                placeholder="e.g., Build the Next Generation DEX"
                maxLength={100}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Short Description
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 transition-colors text-sm"
                placeholder="One-line pitch for your campaign"
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Full Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 transition-colors min-h-[150px] text-sm"
                placeholder="Describe your project, goals, and how funds will be used..."
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 transition-colors text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* DAO Governance Option */}
            <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="createDAO"
                  checked={createDAO}
                  onChange={(e) => setCreateDAO(e.target.checked)}
                  className="mt-0.5 w-4 h-4"
                />
                <div className="flex-1">
                  <label htmlFor="createDAO" className="flex items-center gap-2 text-sm font-medium text-gray-900 cursor-pointer">
                    <Shield className="w-4 h-4" />
                    Create DAO for Governance (Recommended)
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    Automatically create an Aragon DAO for decentralized governance. Backers will receive governance tokens and can vote on proposals.
                  </p>
                  {daoAddress && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                      <p className="text-green-700 font-medium">DAO Created!</p>
                      <p className="text-green-600 font-mono text-xs mt-1">{daoAddress.slice(0, 20)}...</p>
                    </div>
                  )}
                  {daoCreating && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-3 h-3 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                      Creating DAO...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Tags (up to 5)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 transition-colors text-sm"
                  placeholder="e.g., DeFi, Ethereum, Layer2"
                  disabled={tags.length >= 5}
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={tags.length >= 5}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-black transition-colors disabled:opacity-50"
                >
                  <Tag size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-600"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Funding Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-medium text-gray-900">Funding Details</h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Goal Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Funding Goal (USDC) *
                </label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 transition-colors text-sm"
                    placeholder="1000"
                    min="1000"
                    step="100"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum: $1,000 USDC</p>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Campaign Duration *
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 transition-colors text-sm"
                  >
                    {DURATIONS.map((dur) => (
                      <option key={dur.value} value={dur.value}>
                        {dur.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h2 className="text-xl font-medium text-gray-900">Images</h2>

            <div className="space-y-4">
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Logo (Square, 500x500px recommended) *
                </label>
                <div className="flex items-center gap-3">
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-900 transition-colors">
                      <Upload size={20} className="mx-auto mb-1 text-gray-400" />
                      <p className="text-xs text-gray-600">
                        {logoFile ? logoFile.name : 'Click to upload logo'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'logo')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Header */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Header Image (1200x400px recommended) *
                </label>
                <div className="space-y-3">
                  {headerPreview && (
                    <img
                      src={headerPreview}
                      alt="Header preview"
                      className="w-full h-24 object-cover rounded-md"
                    />
                  )}
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-900 transition-colors">
                      <Upload size={20} className="mx-auto mb-1 text-gray-400" />
                      <p className="text-xs text-gray-600">
                        {headerFile ? headerFile.name : 'Click to upload header image'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'header')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Cover (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Cover Image (Optional)
                </label>
                <div className="space-y-3">
                  {coverPreview && (
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-24 object-cover rounded-md"
                    />
                  )}
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-900 transition-colors">
                      <Upload size={20} className="mx-auto mb-1 text-gray-400" />
                      <p className="text-xs text-gray-600">
                        {coverFile ? coverFile.name : 'Click to upload cover image'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'cover')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Links (Optional) */}
          <div className="space-y-4">
            <h2 className="text-xl font-medium text-gray-900">Additional Links</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Video URL (YouTube, Vimeo)
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 transition-colors text-sm"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Whitepaper URL
                </label>
                <input
                  type="url"
                  value={whitepaperUrl}
                  onChange={(e) => setWhitepaperUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 transition-colors text-sm"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 transition-colors text-sm"
                  placeholder="https://github.com/..."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-md hover:bg-black transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Campaign...
                </span>
              ) : (
                'Create Campaign'
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
