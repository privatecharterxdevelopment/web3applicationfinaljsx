import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Coins,
  Upload,
  AlertCircle,
  Sparkles,
  Lock,
  X,
  Loader2,
  Plane,
  Ship,
  Home,
  Building2,
  Shield
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../../thefinalwebapplicationpcx-main/src/context/AuthContext';

const TokenizeAssetFlow = ({ onBack }) => {
  console.log('🚀 NEW TOKENIZE FLOW WITH MODAL LOADED - USDC/USDT IN STEP 3');
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState(null);
  const [tokenType, setTokenType] = useState(null); // 'utility' or 'security'
  const [modalStep, setModalStep] = useState(1);
  const totalModalSteps = 6;

  const [formData, setFormData] = useState({
    assetType: null,
    assetName: '',
    assetCategory: '',
    description: '',
    assetValue: '',
    location: '',
    tokenStandard: 'ERC-1155',
    totalSupply: '',
    tokenSymbol: '',
    pricePerToken: '',
    minimumInvestment: '',
    expectedAPY: '',
    revenueDistribution: 'quarterly',
    revenueCurrency: 'USDC',
    lockupPeriod: '',
    hasSPV: null,
    operator: '',
    jurisdiction: '',
    managementFee: 2,
    needsAudit: false,
    contactEmail: '',
    contactPhone: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Asset Type Cards
  const assetTypes = [
    {
      id: 'jet',
      label: 'Private Jet',
      emoji: '✈️',
      imageUrl: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/pngtree-sleek-private-jet-in-flight-ready-for-business-travel-png-image_20073193.png',
      description: 'Tokenize private jets and enable fractional ownership',
      priceRange: '$500K - $50M',
      popular: false,
      imageScale: 'scale-125'
    },
    {
      id: 'helicopter',
      label: 'Helicopter',
      emoji: '🚁',
      imageUrl: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/centaurium_505_header.png',
      description: 'Tokenize helicopters for shared investment opportunities',
      priceRange: '$200K - $10M'
    },
    {
      id: 'limousine-service',
      label: 'Limousine Service',
      emoji: '🚙',
      imageUrl: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/cc5cd5b105760f0db228cf73975880b3.png',
      description: 'Tokenize luxury transportation and chauffeur services',
      priceRange: '$50K - $2M'
    },
    {
      id: 'evtol',
      label: 'eVTOL',
      emoji: '🛸',
      imageUrl: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/CityAirbus_NG__1_-removebg-preview.png',
      description: 'Tokenize next-generation electric vertical take-off aircraft',
      priceRange: '$1M - $5M',
      popular: true
    },
    {
      id: 'yacht',
      label: 'Yacht',
      emoji: '🛥️',
      imageUrl: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/pngtree-white-modern-yachts-png-image_11385792.png',
      description: 'Tokenize luxury yachts for fractional ownership',
      priceRange: '$1M - $100M',
      popular: false,
      imageScale: 'scale-125'
    },
    {
      id: 'real-estate',
      label: 'Real Estate / Hangar',
      emoji: '🏠',
      imageUrl: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/01_01%20(1).jpg',
      description: 'Tokenize properties and real estate investments',
      priceRange: '$100K - $50M',
      imageScale: 'scale-75'
    },
    {
      id: 'luxury-car',
      label: 'Luxury Car',
      emoji: '🏎️',
      imageUrl: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/HOR_XB1_Ferrari_250_62_GTO.webp',
      description: 'Tokenize high-value luxury and classic vehicles',
      priceRange: '$50K - $5M'
    },
    {
      id: 'art',
      label: 'Art & Collectibles',
      emoji: '🎨',
      imageUrl: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/danseur_ii_by_yann_guillon_master-removebg-preview.png',
      description: 'Tokenize fine art, collectibles, and rare items',
      priceRange: '$10K - $100M'
    },
    {
      id: 'business',
      label: 'Business Revenue',
      emoji: '💼',
      imageUrl: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/istockphoto-506918827-612x612-removebg-preview%20(1).png',
      description: 'Tokenize business revenue streams and equity',
      priceRange: 'Varies'
    }
  ];

  const handleAssetTypeSelect = (assetType) => {
    setSelectedAssetType(assetType);
    updateFormData('assetType', assetType.id);
    setShowModal(true);
    setModalStep(1);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalStep(1);
    setSelectedAssetType(null);
    setTokenType(null);
  };

  const nextModalStep = () => {
    if (modalStep < totalModalSteps) {
      setModalStep(modalStep + 1);
    }
  };

  const prevModalStep = () => {
    if (modalStep > 1) {
      setModalStep(modalStep - 1);
    }
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      alert('Please login to submit tokenization request');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare request data
      const requestData = {
        asset_type: selectedAssetType.id,
        asset_label: selectedAssetType.label,
        token_type: tokenType,
        asset_name: formData.assetName,
        asset_description: formData.assetDescription,
        asset_value: formData.assetValue,
        asset_location: formData.assetLocation,
        token_symbol: formData.tokenSymbol,
        total_supply: formData.totalSupply,
        price_per_token: formData.pricePerToken,
        expected_apy: formData.expectedAPY,
        needs_spv: formData.needsSPV,
        jurisdiction: formData.jurisdiction,
        submitted_at: new Date().toISOString()
      };

      // Insert into user_requests table
      const { data, error } = await supabase
        .from('user_requests')
        .insert([{
          user_id: user.id,
          type: 'tokenization',
          status: 'pending',
          service_type: `${selectedAssetType.label} Tokenization`,
          details: `${formData.assetName} - ${tokenType} token`,
          estimated_cost: parseFloat(formData.assetValue) || 0,
          data: requestData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('Tokenization request saved:', data);

      setIsSubmitting(false);
      setShowModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting tokenization:', error);
      alert('Failed to submit request. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Modal Step 1: Token Type Selection
  const renderModalStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Token Type</h3>
        <p className="text-sm text-gray-700">Choose between utility or security token for your asset</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => {
            setTokenType('utility');
            updateFormData('tokenType', 'utility');
          }}
          className={`p-6 rounded-xl border-2 transition-all ${
            tokenType === 'utility'
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-300 bg-white/40 hover:bg-white/60 text-gray-900'
          }`}
        >
          <Coins size={32} className={tokenType === 'utility' ? 'text-white' : 'text-gray-900'} />
          <h4 className="text-lg font-semibold mt-3 mb-2">Utility Token</h4>
          <p className={`text-sm ${tokenType === 'utility' ? 'text-gray-200' : 'text-gray-700'}`}>
            Access rights, usage benefits, membership perks
          </p>
        </button>

        <button
          onClick={() => {
            setTokenType('security');
            updateFormData('tokenType', 'security');
          }}
          className={`p-6 rounded-xl border-2 transition-all ${
            tokenType === 'security'
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-300 bg-white/40 hover:bg-white/60 text-gray-900'
          }`}
        >
          <Shield size={32} className={tokenType === 'security' ? 'text-white' : 'text-gray-900'} />
          <h4 className="text-lg font-semibold mt-3 mb-2">Security Token</h4>
          <p className={`text-sm ${tokenType === 'security' ? 'text-gray-200' : 'text-gray-700'}`}>
            Revenue sharing, equity ownership, investment returns
          </p>
        </button>
      </div>

      <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
        <p className="text-xs text-gray-700 leading-relaxed">
          <strong>Utility Tokens:</strong> Provide access rights or usage benefits without representing ownership or investment returns.<br />
          <strong>Security Tokens:</strong> Represent ownership or investment and may provide revenue sharing or equity rights.
        </p>
      </div>
    </div>
  );

  // Modal Step 2: Asset Information
  const renderModalStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Asset Information</h3>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Asset Name *</label>
        <input
          type="text"
          value={formData.assetName}
          onChange={(e) => updateFormData('assetName', e.target.value)}
          placeholder="e.g., Gulfstream G650"
          className="w-full px-4 py-3 bg-white/40 border border-gray-300/50 rounded-xl"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          placeholder="Describe your asset in detail..."
          className="w-full px-4 py-3 bg-white/40 border border-gray-300/50 rounded-xl"
          rows="4"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Asset Value (USD) *</label>
          <input
            type="number"
            value={formData.assetValue}
            onChange={(e) => updateFormData('assetValue', e.target.value)}
            placeholder="5000000"
            className="w-full px-4 py-3 bg-white/40 border border-gray-300/50 rounded-xl"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => updateFormData('location', e.target.value)}
            placeholder="e.g., Geneva, Switzerland"
            className="w-full px-4 py-3 bg-white/40 border border-gray-300/50 rounded-xl"
          />
        </div>
      </div>
    </div>
  );

  // Modal Step 3: Token Configuration
  const renderModalStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Token Configuration</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Token Symbol *</label>
          <input
            type="text"
            value={formData.tokenSymbol}
            onChange={(e) => updateFormData('tokenSymbol', e.target.value.toUpperCase())}
            placeholder="JET"
            maxLength="6"
            className="w-full px-4 py-3 bg-white/40 border border-gray-300/50 rounded-xl uppercase"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Total Supply *</label>
          <input
            type="number"
            value={formData.totalSupply}
            onChange={(e) => updateFormData('totalSupply', e.target.value)}
            placeholder="1000"
            className="w-full px-4 py-3 bg-white/40 border border-gray-300/50 rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Price per Token (USD) *</label>
          <input
            type="number"
            value={formData.pricePerToken}
            onChange={(e) => updateFormData('pricePerToken', e.target.value)}
            placeholder="5000"
            className="w-full px-4 py-3 bg-white/40 border border-gray-300/50 rounded-xl"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Minimum Investment (USD)</label>
          <input
            type="number"
            value={formData.minimumInvestment}
            onChange={(e) => updateFormData('minimumInvestment', e.target.value)}
            placeholder="5000"
            className="w-full px-4 py-3 bg-white/40 border border-gray-300/50 rounded-xl"
          />
        </div>
      </div>

      {tokenType === 'security' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Expected APY (%)</label>
              <input
                type="number"
                value={formData.expectedAPY}
                onChange={(e) => updateFormData('expectedAPY', e.target.value)}
                placeholder="8"
                className="w-full px-4 py-3 bg-white/40 border border-gray-300/50 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Revenue Distribution</label>
              <select
                value={formData.revenueDistribution}
                onChange={(e) => updateFormData('revenueDistribution', e.target.value)}
                className="w-full px-4 py-3 bg-white/40 border border-gray-300/50 rounded-xl"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          </div>

          {/* Revenue Distribution Currency - USDC/USDT with Logos */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Revenue Distribution Currency *</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => updateFormData('revenueCurrency', 'USDC')}
                className={`p-5 rounded-xl border-2 transition-all ${
                  formData.revenueCurrency === 'USDC'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-white/40 border-gray-300/50 hover:bg-white/60'
                }`}
              >
                <div className="flex flex-col items-center">
                  <img
                    src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/pngtree-usdc-blue-coin-3d-rendering-front-view-cryptocurrency-illustration-cartoon-style-png-image_6443097.png"
                    alt="USDC"
                    className="w-16 h-16 object-contain mb-3"
                  />
                  <div className="font-semibold text-gray-900 mb-1">USDC</div>
                  <div className="text-xs text-gray-700 text-center">Circle regulated stablecoin</div>
                  <div className="text-xs text-gray-600 mt-2">Recommended ✓</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => updateFormData('revenueCurrency', 'USDT')}
                className={`p-5 rounded-xl border-2 transition-all ${
                  formData.revenueCurrency === 'USDT'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-white/40 border-gray-300/50 hover:bg-white/60'
                }`}
              >
                <div className="flex flex-col items-center">
                  <img
                    src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/green-circle-with-large-t-it-that-is-labeled-t_767610-17.jpg"
                    alt="USDT"
                    className="w-16 h-16 object-contain mb-3"
                  />
                  <div className="font-semibold text-gray-900 mb-1">USDT</div>
                  <div className="text-xs text-gray-700 text-center">Tether stablecoin</div>
                  <div className="text-xs text-gray-600 mt-2">High liquidity</div>
                </div>
              </button>
            </div>
            <div className="mt-3 bg-blue-50/50 border border-blue-200/50 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                ✓ Automated distribution via Smart Contract • On-chain transparent • Direct to investor wallets
              </p>
            </div>
          </div>

          {/* Management Fee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Annual Management Fee *</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => updateFormData('managementFee', 2)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.managementFee === 2
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white/40 border-gray-300/50 text-gray-900 hover:bg-white/60'
                }`}
              >
                <div className="font-semibold mb-1">2% Annual Fee</div>
                <div className="text-xs opacity-80">Standard management fee</div>
              </button>
              <button
                type="button"
                onClick={() => updateFormData('managementFee', 3)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.managementFee === 3
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white/40 border-gray-300/50 text-gray-900 hover:bg-white/60'
                }`}
              >
                <div className="font-semibold mb-1">3% Annual Fee</div>
                <div className="text-xs opacity-80">Premium management</div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Modal Step 4: SPV & Operator
  const renderModalStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">SPV & Asset Management</h3>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">Do you have an SPV?</label>
        <div className="flex gap-3">
          <button
            onClick={() => updateFormData('hasSPV', true)}
            className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
              formData.hasSPV === true
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 bg-white/40 hover:bg-white/60'
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => updateFormData('hasSPV', false)}
            className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
              formData.hasSPV === false
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 bg-white/40 hover:bg-white/60'
            }`}
          >
            No
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Asset Operator</label>
        <select
          value={formData.operator}
          onChange={(e) => updateFormData('operator', e.target.value)}
          className="w-full px-4 py-3 bg-white/40 border border-gray-300/50 rounded-xl"
        >
          <option value="">Select operator...</option>
          <option value="owner">Asset Owner (Self-Managed)</option>
          <option value="third-party">Third-Party Operator</option>
          <option value="pcx-partners">PCX Partners</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Jurisdiction</label>
        <input
          type="text"
          value={formData.jurisdiction}
          onChange={(e) => updateFormData('jurisdiction', e.target.value)}
          placeholder="e.g., Switzerland"
          className="w-full px-4 py-3 bg-white/40 border border-gray-300/50 rounded-xl"
        />
      </div>
    </div>
  );

  // Modal Step 5: Summary
  const renderModalStep5 = () => {
    const platformFee = tokenType === 'security' ? 5000 : 2000;
    const auditFee = formData.needsAudit ? (tokenType === 'security' ? 15000 : 8500) : 0;
    const estimatedGas = 500;
    const total = platformFee + auditFee + estimatedGas;

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Review & Submit</h3>

        {/* Asset Summary */}
        <div className="bg-white/40 border border-gray-300/50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Asset Type:</span>
            <span className="font-semibold text-gray-900">{selectedAssetType?.label}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Token Type:</span>
            <span className="font-semibold text-gray-900 capitalize">{tokenType}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Total Supply:</span>
            <span className="font-semibold text-gray-900">{formData.totalSupply} {formData.tokenSymbol}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Asset Value:</span>
            <span className="font-semibold text-gray-900">${parseInt(formData.assetValue || 0).toLocaleString()}</span>
          </div>
          {tokenType === 'security' && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Price per Token:</span>
                <span className="font-semibold text-gray-900">${formData.pricePerToken || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Revenue Currency:</span>
                <span className="font-semibold text-gray-900">{formData.revenueCurrency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Management Fee:</span>
                <span className="font-semibold text-gray-900">{formData.managementFee}% Annual</span>
              </div>
            </>
          )}
        </div>

        {/* Cost Breakdown */}
        <div className="bg-gray-900 text-white rounded-xl p-5">
          <h4 className="font-semibold mb-4 text-sm">Cost Breakdown</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Platform Fee</span>
              <span className="font-medium">€{platformFee.toLocaleString()}</span>
            </div>
            {auditFee > 0 && (
              <div className="flex justify-between text-sm">
                <span>Smart Contract Audit</span>
                <span className="font-medium">€{auditFee.toLocaleString()}</span>
              </div>
            )}
            {tokenType === 'security' && formData.hasSPV === false && (
              <div className="flex justify-between text-sm">
                <span>SPV Setup (quoted separately)</span>
                <span className="italic opacity-70">TBD</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Estimated Gas Fees</span>
              <span className="font-medium">~€{estimatedGas}</span>
            </div>
            <div className="pt-3 border-t border-gray-700 flex justify-between text-base font-bold">
              <span>Total</span>
              <span>€{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-3">
          <p className="text-xs text-gray-700 leading-relaxed">
            Your application will be reviewed by our compliance team within 24-48 hours. KYC/AML verification will be initiated.
          </p>
        </div>
      </div>
    );
  };

  // Modal Step 6: Contact
  const renderModalStep6 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Contact Information</h3>

      <input
        type="email"
        placeholder="Your Email"
        value={formData.contactEmail}
        onChange={(e) => updateFormData('contactEmail', e.target.value)}
        className="w-full px-4 py-3 bg-white/40 border border-gray-300/50 rounded-xl"
      />

      <input
        type="tel"
        placeholder="Your Phone"
        value={formData.contactPhone}
        onChange={(e) => updateFormData('contactPhone', e.target.value)}
        className="w-full px-4 py-3 bg-white/40 border border-gray-300/50 rounded-xl"
      />

      <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
        <p className="text-xs text-gray-700 leading-relaxed">
          By submitting, you confirm all information is accurate. Our team will review and contact you within 24-48 hours to discuss next steps.
        </p>
      </div>
    </div>
  );

  const renderModalContent = () => {
    switch(modalStep) {
      case 1: return renderModalStep1();
      case 2: return renderModalStep2();
      case 3: return renderModalStep3();
      case 4: return renderModalStep4();
      case 5: return renderModalStep5();
      case 6: return renderModalStep6();
      default: return null;
    }
  };

  // Main Landing Page with Asset Type Cards
  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-4 tracking-tighter">
            Tokenize Your Asset
          </h1>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto font-light">
            Select your asset type to start the tokenization process. We support jets, helicopters, yachts, real estate, luxury cars, art collections, and business ventures.
          </p>
        </div>

        {/* Asset Type Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {assetTypes.map((asset) => (
            <button
              key={asset.id}
              onClick={() => handleAssetTypeSelect(asset)}
              className="relative rounded-2xl border-2 border-gray-200 bg-white/60 hover:bg-white/80 hover:border-gray-300 hover:shadow-xl transition-all duration-300 text-left group backdrop-blur-sm overflow-hidden"
            >
              {asset.popular && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="px-3 py-1 bg-gray-900 text-white rounded-full text-[10px] font-bold shadow-lg">
                    ⭐ POPULAR
                  </span>
                </div>
              )}

              <div className="w-full h-32 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                <img
                  src={asset.imageUrl}
                  alt={asset.label}
                  className={`w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 p-2 ${asset.imageScale || ''}`}
                />
              </div>

              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 tracking-tighter mb-2">{asset.label}</h3>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{asset.description}</p>

                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {asset.priceRange}
                </span>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-900">Get Started</span>
                    <ArrowRight size={16} className="text-gray-900 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-8">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            {/* Progress Bar */}
            <div className="px-6 py-3 border-b border-gray-300/50">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-900">
                  Step {modalStep} of {totalModalSteps}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X size={18} className="text-gray-900" />
                </button>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-gray-900 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(modalStep / totalModalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {renderModalContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="px-6 py-3 border-t border-gray-300/50 flex justify-between">
              <button
                onClick={prevModalStep}
                disabled={modalStep === 1}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={16} />
                Previous
              </button>

              {modalStep === totalModalSteps ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <Check size={16} />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={nextModalStep}
                  disabled={modalStep === 1 && !tokenType}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Application Submitted!</h3>
              <p className="text-sm text-gray-700 mb-6 leading-relaxed">
                Thank you for your tokenization application. Our team will review your submission and contact you within 24-48 hours.
              </p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  onBack();
                }}
                className="w-full px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenizeAssetFlow;
