import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Shield,
  Coins,
  Upload,
  FileText,
  AlertCircle,
  Sparkles,
  Lock,
  Users,
  Building2,
  Wallet,
  ChevronRight,
  MapPin,
  Search,
  X,
  Info,
  Loader2
} from 'lucide-react';
import TermsSignatureModal from './TermsSignatureModal';
import { submitDraft } from '../../services/tokenizationService';
import { useAccount } from 'wagmi';

const TokenizeAssetFlow = ({ onBack, draftToLoad = null }) => {
  const { address } = useAccount();
  const [currentStep, setCurrentStep] = useState(draftToLoad?.current_step || 0);
  const [tokenType, setTokenType] = useState(draftToLoad?.token_type || null); // 'utility' or 'security'
  const [assetCategory, setAssetCategory] = useState(draftToLoad?.asset_category || null);
  const [showJurisdictionPopup, setShowJurisdictionPopup] = useState(false);
  const [jurisdictionSearch, setJurisdictionSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(draftToLoad?.id || null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'stripe' or 'crypto'
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Step 2: Asset Information
    assetName: '',
    assetCategory: '',
    description: '',
    assetValue: '',
    location: '',
    images: [],
    logo: null,
    headerImage: null,

    // Step 3: Token Configuration
    tokenStandard: '',
    totalSupply: '',
    tokenSymbol: '',
    pricePerToken: '',
    minimumInvestment: '',
    expectedAPY: '',
    revenueDistribution: 'quarterly',
    revenueCurrency: 'USDC', // USDC or USDT
    lockupPeriod: '',
    hasSPV: null, // true/false/null
    spvDetails: '',
    operator: '', // 'owner', 'third-party', 'pcx-partners'
    accessRights: '',
    validityPeriod: '',
    isTransferable: true,
    isBurnable: false,
    managementFee: 2, // 2% or 3%
    issuerWalletAddress: '',

    // Compliance
    jurisdiction: '',

    // Legal Documents
    prospectus: null,
    legalOpinion: null,
    ownershipProof: null,
    insurance: null,

    // Smart Contract
    needsAudit: false,

    // Payment Package (UTO only)
    membershipPackage: null, // 'starter', 'professional', 'enterprise'
    packageAddons: {
      customDesign: false,
      auditedContract: false
    },
  });

  const totalSteps = tokenType === 'security' ? 7 : 7; // UTO: 7 steps (includes payment), STO: 7 steps

  // All countries for jurisdiction selection
  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
    'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
    'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon',
    'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
    'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador',
    'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
    'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
    'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel',
    'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'North Korea', 'South Korea',
    'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania',
    'Luxembourg', 'Macedonia', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
    'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'Norway', 'Oman',
    'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
    'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Saudi Arabia', 'Senegal',
    'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Sudan',
    'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Swaziland', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
    'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda',
    'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
    'Yemen', 'Zambia', 'Zimbabwe'
  ];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredCountries = countries.filter(country =>
    country.toLowerCase().includes(jurisdictionSearch.toLowerCase())
  );

  // Validation function for each step
  const validateStep = () => {
    switch (currentStep) {
      case 0: // Asset Category Selection
        return assetCategory !== null;

      case 1: // Token Type Selection
        return tokenType !== null;

      case 2: // Asset Information
        return (
          formData.assetName &&
          formData.assetCategory &&
          formData.description &&
          formData.assetValue &&
          formData.location
        );

      case 3: // Token Configuration
        if (tokenType === 'utility') {
          return (
            formData.tokenStandard &&
            formData.tokenSymbol &&
            formData.totalSupply &&
            formData.issuerWalletAddress &&
            formData.accessRights
          );
        } else {
          return (
            formData.tokenStandard &&
            formData.tokenSymbol &&
            formData.totalSupply &&
            formData.pricePerToken &&
            formData.issuerWalletAddress
          );
        }

      case 4: // Custody & Banking (Security) or Legal (Utility)
        if (tokenType === 'security') {
          return (
            formData.custodian &&
            formData.bankName &&
            formData.bankAccountNumber
          );
        } else {
          return (
            formData.companyName &&
            formData.registrationNumber &&
            formData.registeredAddress
          );
        }

      case 5: // Legal (Security) or Payment Package (Utility)
        if (tokenType === 'security') {
          return (
            formData.companyName &&
            formData.registrationNumber &&
            formData.registeredAddress
          );
        } else {
          // Payment package validation for UTO
          // Must select a package
          // If audited contract is selected, can proceed without payment method
          // Otherwise must select payment method
          return formData.membershipPackage && (
            formData.packageAddons.auditedContract || paymentMethod
          );
        }

      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTokenTypeSelect = (type) => {
    setTokenType(type);
    if (type === 'utility') {
      updateFormData('tokenStandard', 'ERC-721');
    } else {
      updateFormData('tokenStandard', 'ERC-1400');
      updateFormData('needsAudit', true); // Required for security tokens
    }
    nextStep();
  };

  // Step 0: Asset Category Selection
  const renderStep0 = () => {
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

    return (
      <div className="flex-1 overflow-y-auto py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 tracking-tighter">Tokenize Your Asset</h2>
            <p className="text-gray-500 max-w-2xl mx-auto font-light">
              Select your asset type to start the tokenization process. We support jets, helicopters, yachts, real estate, luxury cars, art collections, and business ventures.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {assetTypes.map((asset) => (
              <button
                key={asset.id}
                onClick={() => {
                  setAssetCategory(asset.id);
                  updateFormData('assetCategory', asset.id);
                  nextStep();
                }}
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
      </div>
    );
  };

  // Step 1: Token Type Selection
  const renderStep1 = () => (
    <div className="flex-1 flex flex-col items-center justify-center py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-semibold text-gray-900 mb-3">Choose Token Type</h2>
        <p className="text-gray-700 text-sm">Select the tokenization model that fits your asset</p>
      </div>

      <div className="grid grid-cols-2 gap-6 max-w-4xl w-full px-8">
        {/* Utility Token Card */}
        <button
          onClick={() => handleTokenTypeSelect('utility')}
          className="group bg-white/30 hover:bg-white/40 border border-gray-300/50 hover:border-gray-400/60 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl backdrop-blur-xl text-left"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center">
              <Coins size={28} className="text-white" />
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-gray-200 text-gray-900 rounded-md text-[10px] font-medium">ERC-20</span>
              <span className="px-2 py-1 bg-gray-200 text-gray-900 rounded-md text-[10px] font-medium">ERC-721</span>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-3">Utility Token</h3>
          <p className="text-sm text-gray-700 mb-6 leading-relaxed">
            Perfect for service access, memberships, VIP lounges, event tickets, and usage rights. NFT-based tokenization for exclusive benefits.
          </p>

          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Check size={14} className="text-gray-900" />
              <span>Memberships & Access Rights</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Check size={14} className="text-gray-900" />
              <span>Service Hours (Limousine, Jet, etc.)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Check size={14} className="text-gray-900" />
              <span>VIP Lounge & Event Access</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-300/50">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Shield size={14} />
              <span>Smart Contract Audit: <span className="font-medium text-gray-800">Optional</span></span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end text-gray-900 group-hover:text-black transition-colors">
            <span className="text-sm font-medium">Select</span>
            <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Security Token Card */}
        <button
          onClick={() => handleTokenTypeSelect('security')}
          className="group bg-white/30 hover:bg-white/40 border border-gray-300/50 hover:border-gray-400/60 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl backdrop-blur-xl text-left"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center">
              <Shield size={28} className="text-white" />
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-gray-200 text-gray-900 rounded-md text-[10px] font-medium">ERC-1400</span>
              <span className="px-2 py-1 bg-gray-200 text-gray-900 rounded-md text-[10px] font-medium">ERC-3643</span>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-3">Security Token</h3>
          <p className="text-sm text-gray-700 mb-6 leading-relaxed">
            Tokenize investment assets with expected returns, APY, and revenue distribution. Full regulatory compliance and investor protections.
          </p>

          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Check size={14} className="text-gray-900" />
              <span>Asset Ownership & Fractional Shares</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Check size={14} className="text-gray-900" />
              <span>Revenue Distribution & APY</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Check size={14} className="text-gray-900" />
              <span>KYC/AML & Investor Accreditation</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-300/50">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Lock size={14} className="text-gray-900" />
              <span>Smart Contract Audit: <span className="font-medium text-gray-900">Required</span></span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end text-gray-900 group-hover:text-black transition-colors">
            <span className="text-sm font-medium">Select</span>
            <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );

  // Step 2: Asset Information
  const renderStep2 = () => (
    <div className="flex-1 overflow-y-auto py-8 px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Asset Information</h2>
          <p className="text-sm text-gray-700">Provide details about the asset you want to tokenize</p>
        </div>

        <div className="space-y-6">
          {/* Asset Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Asset Name *</label>
            <input
              type="text"
              value={formData.assetName}
              onChange={(e) => updateFormData('assetName', e.target.value)}
              placeholder="e.g., Gulfstream G650"
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
            />
          </div>

          {/* Asset Category */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Asset Category *</label>
            <select
              value={formData.assetCategory}
              onChange={(e) => updateFormData('assetCategory', e.target.value)}
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
            >
              <option value="">Select category</option>
              <option value="jet">Private Jet</option>
              <option value="helicopter">Helicopter</option>
              <option value="yacht">Yacht</option>
              <option value="real-estate">Real Estate</option>
              <option value="luxury-car">Luxury Car</option>
              <option value="limousine-service">Limousine Service</option>
              <option value="vip-lounge">VIP Lounge</option>
              <option value="event-access">Event Access</option>
              <option value="art">Art & Collectibles</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Asset Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Provide detailed information about the asset, its condition, features, and any relevant details..."
              rows={5}
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl resize-none"
            />
          </div>

          {/* Asset Value */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Asset Value (USD) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 font-medium">$</span>
              <input
                type="number"
                value={formData.assetValue}
                onChange={(e) => updateFormData('assetValue', e.target.value)}
                placeholder="5000000"
                className="w-full pl-8 pr-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Current Location *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => updateFormData('location', e.target.value)}
              placeholder="e.g., Dubai, UAE"
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Asset Logo *</label>
            <div className="border-2 border-dashed border-gray-300/50 rounded-xl p-6 bg-white/20 backdrop-blur-xl hover:bg-white/25 transition-all cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <Upload size={28} className="text-gray-700 mb-2" />
                <p className="text-sm text-gray-900 font-medium mb-1">Upload Logo</p>
                <p className="text-xs text-gray-600">PNG, JPG, SVG (square recommended, max 2MB)</p>
              </div>
            </div>
          </div>

          {/* Header Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Header Image *</label>
            <div className="border-2 border-dashed border-gray-300/50 rounded-xl p-6 bg-white/20 backdrop-blur-xl hover:bg-white/25 transition-all cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <Upload size={28} className="text-gray-700 mb-2" />
                <p className="text-sm text-gray-900 font-medium mb-1">Upload Header Banner</p>
                <p className="text-xs text-gray-600">PNG, JPG (1920x400px recommended, max 5MB)</p>
              </div>
            </div>
          </div>

          {/* Upload Asset Images */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Asset Images & Documents *</label>
            <div className="border-2 border-dashed border-gray-300/50 rounded-xl p-8 bg-white/20 backdrop-blur-xl hover:bg-white/25 transition-all cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <Upload size={32} className="text-gray-700 mb-3" />
                <p className="text-sm text-gray-900 font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-600">PNG, JPG, PDF up to 10MB each</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 3a: Utility Token Configuration
  const renderStep3Utility = () => (
    <div className="flex-1 overflow-y-auto py-8 px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Utility Token Configuration</h2>
          <p className="text-sm text-gray-700">Define your NFT-based utility token parameters</p>
        </div>

        <div className="space-y-6">
          {/* Token Standard */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Token Standard *</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => updateFormData('tokenStandard', 'ERC-20')}
                className={`p-4 rounded-xl border-2 transition-all backdrop-blur-xl ${
                  formData.tokenStandard === 'ERC-20'
                    ? 'bg-black text-white border-black'
                    : 'bg-white/20 border-gray-300/50 text-gray-900 hover:bg-white/30'
                }`}
              >
                <div className="font-medium mb-1">ERC-20</div>
                <div className="text-xs opacity-80">Fungible tokens (e.g., 1000 identical)</div>
              </button>
              <button
                onClick={() => updateFormData('tokenStandard', 'ERC-721')}
                className={`p-4 rounded-xl border-2 transition-all backdrop-blur-xl ${
                  formData.tokenStandard === 'ERC-721'
                    ? 'bg-black text-white border-black'
                    : 'bg-white/20 border-gray-300/50 text-gray-900 hover:bg-white/30'
                }`}
              >
                <div className="font-medium mb-1">ERC-721</div>
                <div className="text-xs opacity-80">Unique NFTs (1-of-1)</div>
              </button>
            </div>
          </div>

          {/* Total Supply */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Total Supply *</label>
            <input
              type="number"
              value={formData.totalSupply}
              onChange={(e) => updateFormData('totalSupply', e.target.value)}
              placeholder="e.g., 100"
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
            />
            <p className="text-xs text-gray-600 mt-2">How many tokens/NFTs to mint</p>
          </div>

          {/* Token Symbol */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Token Symbol *</label>
            <input
              type="text"
              value={formData.tokenSymbol}
              onChange={(e) => updateFormData('tokenSymbol', e.target.value)}
              placeholder="e.g., VIP-LOUNGE"
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl uppercase"
            />
          </div>

          {/* Issuer Wallet Address */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Issuer Wallet Address *
              {address && (
                <button
                  type="button"
                  onClick={() => updateFormData('issuerWalletAddress', address)}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-700"
                >
                  (Use Connected Wallet)
                </button>
              )}
            </label>
            <input
              type="text"
              value={formData.issuerWalletAddress || ''}
              onChange={(e) => updateFormData('issuerWalletAddress', e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl font-mono text-sm"
            />
            <p className="text-xs text-gray-600 mt-2">Wallet address where NFTs will be minted and issued from</p>
          </div>

          {/* Access Rights */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Access Rights / Benefits *</label>
            <textarea
              value={formData.accessRights}
              onChange={(e) => updateFormData('accessRights', e.target.value)}
              placeholder="e.g., 10 hours of limousine service, VIP lounge access for 1 year, exclusive event entry..."
              rows={4}
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl resize-none"
            />
          </div>

          {/* Validity Period */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Validity Period (Optional)</label>
            <input
              type="text"
              value={formData.validityPeriod}
              onChange={(e) => updateFormData('validityPeriod', e.target.value)}
              placeholder="e.g., 12 months, No expiration"
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
            />
          </div>

          {/* Smart Contract Features */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Smart Contract Features</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 bg-white/20 rounded-xl border border-gray-300/50 cursor-pointer hover:bg-white/30 transition-all backdrop-blur-xl">
                <input
                  type="checkbox"
                  checked={formData.isTransferable}
                  onChange={(e) => updateFormData('isTransferable', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-black focus:ring-2 focus:ring-gray-400"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Transferable</div>
                  <div className="text-xs text-gray-700">Token holders can transfer/sell their NFTs</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-white/20 rounded-xl border border-gray-300/50 cursor-pointer hover:bg-white/30 transition-all backdrop-blur-xl">
                <input
                  type="checkbox"
                  checked={formData.isBurnable}
                  onChange={(e) => updateFormData('isBurnable', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-black focus:ring-2 focus:ring-gray-400"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Burnable</div>
                  <div className="text-xs text-gray-700">Tokens can be destroyed after use</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-white/20 rounded-xl border border-gray-300/50 cursor-pointer hover:bg-white/30 transition-all backdrop-blur-xl">
                <input
                  type="checkbox"
                  checked={formData.needsAudit}
                  onChange={(e) => updateFormData('needsAudit', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-black focus:ring-2 focus:ring-gray-400"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    Smart Contract Audit (Optional)
                    <div className="group relative">
                      <Info size={14} className="text-gray-600 cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                        Professional security audit by certified third-party firms. Highly recommended for tokens with complex functionality or handling valuable assets.
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-700">Professional security audit (+€8,500)</div>
                </div>
              </label>
            </div>
          </div>

          {/* Jurisdiction */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Legal Jurisdiction *</label>
            <button
              type="button"
              onClick={() => setShowJurisdictionPopup(true)}
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-left hover:bg-white/40 transition-all backdrop-blur-xl flex items-center justify-between"
            >
              <span className={formData.jurisdiction ? 'text-gray-900' : 'text-gray-500'}>
                {formData.jurisdiction || 'Select jurisdiction'}
              </span>
              <Search size={18} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 3b: Security Token Configuration
  const renderStep3Security = () => (
    <div className="flex-1 overflow-y-auto py-8 px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Security Token Configuration</h2>
          <p className="text-sm text-gray-700">Configure investment terms and compliance settings</p>
        </div>

        <div className="space-y-6">
          {/* Token Standard */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Token Standard *</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => updateFormData('tokenStandard', 'ERC-1400')}
                className={`p-4 rounded-xl border-2 transition-all backdrop-blur-xl ${
                  formData.tokenStandard === 'ERC-1400'
                    ? 'bg-blue-100 border-blue-500 text-blue-900'
                    : 'bg-white/20 border-gray-300/50 text-gray-900 hover:bg-white/30'
                }`}
              >
                <div className="font-medium mb-1">ERC-1400</div>
                <div className="text-xs opacity-80">Partially fungible security tokens</div>
              </button>
              <button
                onClick={() => updateFormData('tokenStandard', 'ERC-3643')}
                className={`p-4 rounded-xl border-2 transition-all backdrop-blur-xl ${
                  formData.tokenStandard === 'ERC-3643'
                    ? 'bg-blue-100 border-blue-500 text-blue-900'
                    : 'bg-white/20 border-gray-300/50 text-gray-900 hover:bg-white/30'
                }`}
              >
                <div className="font-medium mb-1">ERC-3643 (T-REX)</div>
                <div className="text-xs opacity-80">Full compliance & permissioned</div>
              </button>
            </div>
          </div>

          {/* Total Supply */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Total Token Supply *</label>
            <input
              type="number"
              value={formData.totalSupply}
              onChange={(e) => updateFormData('totalSupply', e.target.value)}
              placeholder="e.g., 1000000"
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
            />
          </div>

          {/* Token Symbol */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Token Symbol *</label>
            <input
              type="text"
              value={formData.tokenSymbol}
              onChange={(e) => updateFormData('tokenSymbol', e.target.value)}
              placeholder="e.g., G650-SEC"
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl uppercase"
            />
          </div>

          {/* Issuer Wallet Address */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Issuer Wallet Address *
              {address && (
                <button
                  type="button"
                  onClick={() => updateFormData('issuerWalletAddress', address)}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-700"
                >
                  (Use Connected Wallet)
                </button>
              )}
            </label>
            <input
              type="text"
              value={formData.issuerWalletAddress || ''}
              onChange={(e) => updateFormData('issuerWalletAddress', e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl font-mono text-sm"
            />
            <p className="text-xs text-gray-600 mt-2">Wallet address where security tokens will be issued from</p>
          </div>

          {/* Price per Token & Minimum Investment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Price per Token (USD) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 font-medium">$</span>
                <input
                  type="number"
                  value={formData.pricePerToken}
                  onChange={(e) => updateFormData('pricePerToken', e.target.value)}
                  placeholder="100"
                  className="w-full pl-8 pr-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Minimum Investment (USD) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 font-medium">$</span>
                <input
                  type="number"
                  value={formData.minimumInvestment}
                  onChange={(e) => updateFormData('minimumInvestment', e.target.value)}
                  placeholder="10000"
                  className="w-full pl-8 pr-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
                />
              </div>
            </div>
          </div>

          {/* Expected APY */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Expected APY % (Optional)</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={formData.expectedAPY}
                onChange={(e) => updateFormData('expectedAPY', e.target.value)}
                placeholder="8.5"
                className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 font-medium">%</span>
            </div>
          </div>

          {/* ROI Calculator - Live Preview */}
          {formData.assetValue && formData.expectedAPY && (
            <div className="bg-white/25 border border-gray-300/50 rounded-xl p-6 backdrop-blur-xl">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles size={16} />
                Projected Returns for Investors
              </h3>
              <div className="space-y-4">
                {[25, 50, 100].map((percent) => {
                  const tokenizedValue = (parseFloat(formData.assetValue) * percent) / 100;
                  const annualDistribution = (tokenizedValue * parseFloat(formData.expectedAPY || 0)) / 100;
                  const capitalRaised = tokenizedValue;

                  return (
                    <div key={percent} className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900">{percent}% Tokenized</span>
                        <span className="text-xs text-gray-700">${capitalRaised.toLocaleString()} raised</span>
                      </div>
                      <div className="text-xs text-gray-700">
                        → ${annualDistribution.toLocaleString()}/year distribution
                      </div>
                      <div className="text-xs text-gray-900 font-medium mt-1">
                        {formData.expectedAPY}% ROI for investors
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-600 mt-4">
                ⓘ Calculations based on your asset value and expected APY
              </p>
            </div>
          )}

          {/* Operator Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Who operates this asset? *</label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 bg-white/20 rounded-xl border border-gray-300/50 cursor-pointer hover:bg-white/30 transition-all backdrop-blur-xl">
                <input
                  type="radio"
                  name="operator"
                  checked={formData.operator === 'owner'}
                  onChange={() => updateFormData('operator', 'owner')}
                  className="w-5 h-5 mt-0.5 border-gray-300 text-black focus:ring-2 focus:ring-gray-400"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">I operate it myself</div>
                  <div className="text-xs text-gray-700">You manage the asset operations (as SPV managing director)</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 bg-white/20 rounded-xl border border-gray-300/50 cursor-pointer hover:bg-white/30 transition-all backdrop-blur-xl">
                <input
                  type="radio"
                  name="operator"
                  checked={formData.operator === 'third-party'}
                  onChange={() => updateFormData('operator', 'third-party')}
                  className="w-5 h-5 mt-0.5 border-gray-300 text-black focus:ring-2 focus:ring-gray-400"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Third-party operator</div>
                  <div className="text-xs text-gray-700">External company manages operations</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 bg-white/20 rounded-xl border border-gray-300/50 cursor-pointer hover:bg-white/30 transition-all backdrop-blur-xl">
                <input
                  type="radio"
                  name="operator"
                  checked={formData.operator === 'pcx-partners'}
                  onChange={() => updateFormData('operator', 'pcx-partners')}
                  className="w-5 h-5 mt-0.5 border-gray-300 text-black focus:ring-2 focus:ring-gray-400"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Managed by PrivateCharterX partners</div>
                  <div className="text-xs text-gray-700">Our verified partners handle operations</div>
                </div>
              </label>
            </div>
          </div>

          {/* Revenue Distribution Currency - USDC/USDT with Logos */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Revenue Distribution Currency *</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => updateFormData('revenueCurrency', 'USDC')}
                className={`p-5 rounded-xl border-2 transition-all backdrop-blur-xl ${
                  formData.revenueCurrency === 'USDC'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-white/20 border-gray-300/50 hover:bg-white/30'
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
                className={`p-5 rounded-xl border-2 transition-all backdrop-blur-xl ${
                  formData.revenueCurrency === 'USDT'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-white/20 border-gray-300/50 hover:bg-white/30'
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
            <div className="mt-3 bg-blue-50/50 border border-blue-200/50 rounded-lg p-3 backdrop-blur-sm">
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
                className={`p-4 rounded-xl border-2 transition-all backdrop-blur-xl ${
                  formData.managementFee === 2
                    ? 'bg-black text-white border-black'
                    : 'bg-white/20 border-gray-300/50 text-gray-900 hover:bg-white/30'
                }`}
              >
                <div className="text-2xl font-bold mb-1">2%</div>
                <div className="text-xs opacity-80">of tokenized value/year</div>
              </button>

              <button
                type="button"
                onClick={() => updateFormData('managementFee', 3)}
                className={`p-4 rounded-xl border-2 transition-all backdrop-blur-xl ${
                  formData.managementFee === 3
                    ? 'bg-black text-white border-black'
                    : 'bg-white/20 border-gray-300/50 text-gray-900 hover:bg-white/30'
                }`}
              >
                <div className="text-2xl font-bold mb-1">3%</div>
                <div className="text-xs opacity-80">of tokenized value/year</div>
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Covers compliance monitoring, investor reporting, custody coordination, and platform maintenance
            </p>
          </div>

          {/* Revenue Distribution & Lock-up Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Revenue Distribution *</label>
              <select
                value={formData.revenueDistribution}
                onChange={(e) => updateFormData('revenueDistribution', e.target.value)}
                className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Lock-up Period (Months) *</label>
              <input
                type="number"
                value={formData.lockupPeriod}
                onChange={(e) => updateFormData('lockupPeriod', e.target.value)}
                placeholder="12"
                className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
              />
            </div>
          </div>

          {/* SPV/Legal Entity */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Asset Holding Structure *</label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 bg-white/20 rounded-xl border border-gray-300/50 cursor-pointer hover:bg-white/30 transition-all backdrop-blur-xl">
                <input
                  type="radio"
                  name="spv"
                  checked={formData.hasSPV === true}
                  onChange={() => updateFormData('hasSPV', true)}
                  className="w-5 h-5 mt-0.5 border-gray-300 text-black focus:ring-2 focus:ring-gray-400"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">I have an existing SPV/Legal Entity</div>
                  {formData.hasSPV === true && (
                    <input
                      type="text"
                      value={formData.spvDetails}
                      onChange={(e) => updateFormData('spvDetails', e.target.value)}
                      placeholder="Enter SPV/Entity name and registration details"
                      className="w-full mt-2 px-3 py-2 bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                    />
                  )}
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 bg-white/20 rounded-xl border border-gray-300/50 cursor-pointer hover:bg-white/30 transition-all backdrop-blur-xl">
                <input
                  type="radio"
                  name="spv"
                  checked={formData.hasSPV === false}
                  onChange={() => updateFormData('hasSPV', false)}
                  className="w-5 h-5 mt-0.5 border-gray-300 text-black focus:ring-2 focus:ring-gray-400"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">I need SPV-as-a-Service</div>
                  <div className="text-xs text-gray-700">We'll help you set up an SPV through our verified partners (additional costs apply, discussed during consultation)</div>
                </div>
              </label>
            </div>
          </div>

          {/* Compliance Info Box */}
          <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-4 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-blue-900 mb-2">Regulatory Compliance (Included)</div>
                <div className="space-y-1 text-xs text-blue-800">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-blue-600" />
                    <span>KYC/AML verification for all investors and asset owners</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-blue-600" />
                    <span>Investor accreditation checks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-blue-600" />
                    <span>Transfer restrictions & whitelist management</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Jurisdiction */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Regulatory Jurisdiction *</label>
            <button
              type="button"
              onClick={() => setShowJurisdictionPopup(true)}
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-left hover:bg-white/40 transition-all backdrop-blur-xl flex items-center justify-between"
            >
              <span className={formData.jurisdiction ? 'text-gray-900' : 'text-gray-500'}>
                {formData.jurisdiction || 'Select jurisdiction'}
              </span>
              <Search size={18} className="text-gray-600" />
            </button>
          </div>

          {/* Legal Documents Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Legal Documents Required *</label>
            <div className="space-y-3">
              <div className="border border-gray-300/50 rounded-xl p-4 bg-white/20 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-gray-700" />
                    <span className="text-sm font-medium text-gray-900">Prospectus/Offering Memorandum</span>
                  </div>
                  <button className="px-3 py-1.5 bg-black text-white text-xs rounded-lg hover:bg-gray-800 transition-all">
                    Upload
                  </button>
                </div>
              </div>

              <div className="border border-gray-300/50 rounded-xl p-4 bg-white/20 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-gray-700" />
                    <span className="text-sm font-medium text-gray-900">Legal Opinion Letter</span>
                  </div>
                  <button className="px-3 py-1.5 bg-black text-white text-xs rounded-lg hover:bg-gray-800 transition-all">
                    Upload
                  </button>
                </div>
              </div>

              <div className="border border-gray-300/50 rounded-xl p-4 bg-white/20 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-gray-700" />
                    <span className="text-sm font-medium text-gray-900">Asset Ownership Proof</span>
                  </div>
                  <button className="px-3 py-1.5 bg-black text-white text-xs rounded-lg hover:bg-gray-800 transition-all">
                    Upload
                  </button>
                </div>
              </div>

              <div className="border border-gray-300/50 rounded-xl p-4 bg-white/20 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-gray-700" />
                    <span className="text-sm font-medium text-gray-900">Insurance Certificate</span>
                  </div>
                  <button className="px-3 py-1.5 bg-black text-white text-xs rounded-lg hover:bg-gray-800 transition-all">
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Contract Audit - Required */}
          <div className="bg-red-50/50 border border-red-200/50 rounded-xl p-4 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <Lock size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-red-900 mb-1">Smart Contract Audit (Required)</div>
                <div className="text-xs text-red-800 mb-3">Professional security audit is mandatory for security tokens to ensure investor protection and regulatory compliance.</div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="w-4 h-4 rounded border-gray-300 text-red-600"
                  />
                  <span className="text-xs font-medium text-red-900">Smart Contract Audit (€15,000+)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 4: Custody & Banking (Security Token only)
  const renderStep4 = () => (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Custody & Compliance</h2>
          <p className="text-sm text-gray-700">Digital token management & regulatory oversight</p>
        </div>

        <div className="bg-white/25 border border-gray-300/50 rounded-2xl p-8 backdrop-blur-xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Asset Remains Operational</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Your physical asset (e.g., jet, yacht) remains fully operational and continues generating revenue in its day-to-day business operations.
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 text-sm text-gray-900">
              <Check size={18} className="text-gray-900 flex-shrink-0" />
              <span><strong>Digital token safekeeping</strong> - Custodian manages token registry</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-900">
              <Check size={18} className="text-gray-900 flex-shrink-0" />
              <span><strong>KYC/AML compliance</strong> - Investor verification & accreditation</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-900">
              <Check size={18} className="text-gray-900 flex-shrink-0" />
              <span><strong>Revenue verification</strong> - Distribution oversight & escrow</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-900">
              <Check size={18} className="text-gray-900 flex-shrink-0" />
              <span><strong>Regulatory reporting</strong> - Legal safekeeping & compliance</span>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-4">
            <p className="text-xs text-blue-900">
              <span className="font-semibold">Note:</span> The physical asset stays with your SPV and continues operating. Our custodian banks manage only the digital tokens, compliance, and revenue verification. During consultation, you'll select your preferred custodian.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 5: Review & Submit (Final step for both)
  const renderStep5 = () => {
    const platformFee = tokenType === 'security' ? 5000 : 2000;
    const auditFee = formData.needsAudit ? (tokenType === 'security' ? 15000 : 8500) : 0;
    const estimatedGas = 500;
    const total = platformFee + auditFee + estimatedGas;

    return (
      <div className="flex-1 overflow-y-auto py-8 px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Review & Submit</h2>
            <p className="text-sm text-gray-700">Verify all information before submitting your tokenization request</p>
          </div>

          {/* Summary Cards */}
          <div className="space-y-4 mb-8">
            {/* Token Type */}
            <div className="bg-white/25 border border-gray-300/50 rounded-xl p-6 backdrop-blur-xl">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                {tokenType === 'utility' ? <Coins size={18} /> : <Shield size={18} />}
                Token Type
              </h3>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-black text-white rounded-lg text-sm font-medium">
                  {tokenType === 'utility' ? 'Utility Token' : 'Security Token'}
                </span>
                <span className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-lg text-sm">
                  {formData.tokenStandard}
                </span>
              </div>
            </div>

            {/* Asset Information */}
            <div className="bg-white/25 border border-gray-300/50 rounded-xl p-6 backdrop-blur-xl">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Asset Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-700 mb-1">Asset Name</div>
                  <div className="text-gray-900 font-medium">{formData.assetName || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-700 mb-1">Category</div>
                  <div className="text-gray-900 font-medium">{formData.assetCategory || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-700 mb-1">Value</div>
                  <div className="text-gray-900 font-medium">${formData.assetValue ? parseInt(formData.assetValue).toLocaleString() : '-'}</div>
                </div>
                <div>
                  <div className="text-gray-700 mb-1">Location</div>
                  <div className="text-gray-900 font-medium">{formData.location || '-'}</div>
                </div>
              </div>
            </div>

            {/* Token Configuration */}
            <div className="bg-white/25 border border-gray-300/50 rounded-xl p-6 backdrop-blur-xl">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Token Configuration</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-700 mb-1">Total Supply</div>
                  <div className="text-gray-900 font-medium">{formData.totalSupply ? parseInt(formData.totalSupply).toLocaleString() : '-'}</div>
                </div>
                <div>
                  <div className="text-gray-700 mb-1">Token Symbol</div>
                  <div className="text-gray-900 font-medium">{formData.tokenSymbol || '-'}</div>
                </div>
                {tokenType === 'security' && (
                  <>
                    <div>
                      <div className="text-gray-700 mb-1">Price per Token</div>
                      <div className="text-gray-900 font-medium">${formData.pricePerToken || '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-700 mb-1">Expected APY</div>
                      <div className="text-gray-900 font-medium">{formData.expectedAPY ? `${formData.expectedAPY}%` : '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-700 mb-1">Revenue Distribution</div>
                      <div className="text-gray-900 font-medium capitalize">{formData.revenueDistribution}</div>
                    </div>
                    <div>
                      <div className="text-gray-700 mb-1">Lock-up Period</div>
                      <div className="text-gray-900 font-medium">{formData.lockupPeriod ? `${formData.lockupPeriod} months` : '-'}</div>
                    </div>
                  </>
                )}
                <div>
                  <div className="text-gray-700 mb-1">Jurisdiction</div>
                  <div className="text-gray-900 font-medium capitalize">{formData.jurisdiction || '-'}</div>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white/25 border border-gray-300/50 rounded-xl p-6 backdrop-blur-xl">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Wallet size={18} />
                Cost Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Platform Fee</span>
                  <span className="text-gray-900 font-medium">€{platformFee.toLocaleString()}</span>
                </div>
                {auditFee > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Smart Contract Audit</span>
                    <span className="text-gray-900 font-medium">€{auditFee.toLocaleString()}</span>
                  </div>
                )}
                {tokenType === 'security' && formData.hasSPV === false && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">SPV Setup (quoted separately)</span>
                    <span className="text-gray-700 italic">TBD</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Estimated Gas Fees</span>
                  <span className="text-gray-900 font-medium">~€{estimatedGas}</span>
                </div>
                <div className="pt-3 border-t border-gray-300/50 flex items-center justify-between">
                  <span className="text-gray-900 font-semibold">Total</span>
                  <span className="text-gray-900 font-semibold text-lg">€{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Info */}
          <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-6 backdrop-blur-xl mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-2">What happens after submission?</h4>
                <ul className="space-y-2 text-xs text-blue-800">
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Your application will be reviewed by our compliance team</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>KYC/AML verification process initiated</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>You'll receive a consultation call within 24-48 hours</span>
                  </li>
                  {tokenType === 'security' && (
                    <li className="flex items-start gap-2">
                      <Check size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Custodian selection and SPV setup (if needed) during consultation</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Legal review and smart contract deployment coordination</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Payment Package Selection (Step 5 for utility tokens - NEW)
  const renderPaymentPackageSelection = () => {
    const packages = [
      {
        id: 'starter',
        name: 'STARTER',
        icon: '🥉',
        memberCards: '100 Member Cards',
        setupFee: 2999,
        monthlyFee: 299,
        revenueShare: {
          perNFT: 3.50,
          perBooking: 1.9
        },
        benefits: [
          'Smart Contract für bis zu 100 NFTs',
          'OpenSea Listing & Integration',
          'Wallet-Verifizierung automatisch',
          'Buchungssystem mit Auto-Rabatt Engine',
          'Basic Dashboard für Business',
          'Royalty Fee Implementation (vom Kunden gewählt)',
          'E-Mail Support (48h)'
        ]
      },
      {
        id: 'professional',
        name: 'PROFESSIONAL',
        icon: '🥈',
        memberCards: '500 Member Cards',
        setupFee: 4999,
        monthlyFee: 499,
        revenueShare: {
          perNFT: 2.20,
          perBooking: 1.5
        },
        benefits: [
          'Smart Contract für bis zu 500 NFTs',
          'Premium OpenSea Integration & Featured Support',
          'Multi-Tier System (Bronze/Silver/Gold/Platinum)',
          'Advanced Rabatt Engine (bis 35% Rabatte möglich)',
          'Custom Branding auf Platform',
          'Advanced Analytics & Reporting',
          'Royalty Strategy Consulting',
          'Customer Wallet Management',
          'Priority Support (24h Response)',
          'Quarterly Business Reviews',
          'Co-Marketing Support'
        ],
        popular: true
      },
      {
        id: 'enterprise',
        name: 'ENTERPRISE',
        icon: '🥇',
        memberCards: '1000+ Member Cards',
        setupFee: 7999,
        monthlyFee: 799,
        revenueShare: {
          perNFT: 1.50,
          perBooking: 1.2
        },
        benefits: [
          'Unbegrenzte NFTs (1000+)',
          'White-Label Integration möglich',
          'Multi-Location & Multi-Brand Support',
          'VIP-Tier System mit Gamification & Rewards',
          'Dynamic Pricing Engine (bis 50% Rabatte)',
          'Eigener NFT Marketplace zusätzlich zu OpenSea',
          'API Access für Custom Integrations',
          'Royalty Strategy Consulting',
          'Comprehensive Business Intelligence',
          'Real-time Analytics & Reporting',
          'Dedicated Account Manager',
          '24/7 Support',
          'Monthly Strategy Calls',
          'Priority Feature Development'
        ]
      }
    ];

    const calculateTotal = (pkg) => {
      let total = pkg.setupFee;
      if (formData.packageAddons.customDesign) total += 199;
      if (formData.packageAddons.auditedContract) total += 15000;
      return total;
    };

    return (
      <div className="flex-1 overflow-y-auto py-8 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Choose Your NFT Membership Package</h2>
            <p className="text-sm text-gray-700">Select the package that best fits your business needs</p>
          </div>

          {/* Package Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => updateFormData('membershipPackage', pkg.id)}
                className={`relative bg-white/30 border-2 rounded-2xl p-6 backdrop-blur-xl cursor-pointer transition-all hover:shadow-lg ${
                  formData.membershipPackage === pkg.id
                    ? 'border-black shadow-xl'
                    : 'border-gray-300/50 hover:border-gray-400'
                } ${pkg.popular ? 'ring-2 ring-blue-500' : ''}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">{pkg.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{pkg.name}</h3>
                  <p className="text-sm text-gray-700">{pkg.memberCards}</p>
                </div>

                {/* Pricing */}
                <div className="mb-6 pb-6 border-b border-gray-300/50">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-gray-900">CHF {pkg.setupFee.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">Setup-Fee (einmalig)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold text-gray-900">CHF {pkg.monthlyFee}/mo</div>
                    <div className="text-xs text-gray-600">Monatlich</div>
                  </div>
                </div>

                {/* Revenue Share */}
                <div className="mb-6 pb-6 border-b border-gray-300/50">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Revenue-Share:</div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>CHF {pkg.revenueShare.perNFT} pro verkauftem NFT</div>
                    <div>{pkg.revenueShare.perBooking}% pro Buchung durch NFT-Holder</div>
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-2">
                  {pkg.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                      <Check size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Selected Indicator */}
                {formData.membershipPackage === pkg.id && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <Check size={16} className="text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add-ons */}
          <div className="bg-white/30 border border-gray-300/50 rounded-2xl p-6 backdrop-blur-xl mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add-ons</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.packageAddons.customDesign}
                  onChange={(e) => updateFormData('packageAddons', {
                    ...formData.packageAddons,
                    customDesign: e.target.checked
                  })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Custom NFT Design</div>
                  <div className="text-xs text-gray-600">Professional custom design for your NFT collection</div>
                </div>
                <div className="font-semibold text-gray-900">+CHF 199</div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.packageAddons.auditedContract}
                  onChange={(e) => updateFormData('packageAddons', {
                    ...formData.packageAddons,
                    auditedContract: e.target.checked
                  })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Auditierter Smart Contract</div>
                  <div className="text-xs text-gray-600">Professional security audit for your smart contract</div>
                </div>
                <div className="font-semibold text-gray-900">+CHF 15'000</div>
              </label>
            </div>
          </div>

          {/* Payment Method Selection */}
          {formData.membershipPackage && !formData.packageAddons.auditedContract && (
            <div className="bg-white/30 border border-gray-300/50 rounded-2xl p-6 backdrop-blur-xl mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'stripe'
                      ? 'border-black bg-black/5'
                      : 'border-gray-300/50 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold text-gray-900 mb-1">Credit Card / Bank Transfer</div>
                  <div className="text-xs text-gray-600">Pay with Stripe (Fiat)</div>
                </button>

                <button
                  onClick={() => setPaymentMethod('crypto')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'crypto'
                      ? 'border-black bg-black/5'
                      : 'border-gray-300/50 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold text-gray-900 mb-1">Pay with Crypto</div>
                  <div className="text-xs text-gray-600">CoinGate Checkout</div>
                </button>
              </div>
            </div>
          )}

          {/* Audited Contract Notice */}
          {formData.packageAddons.auditedContract && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-blue-900 mb-1">Manual Review Required</div>
                  <div className="text-sm text-blue-800">
                    You've selected the Audited Smart Contract add-on. Our team will contact you to discuss the audit process and payment. You can submit your request without payment now.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Total */}
          {formData.membershipPackage && (
            <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-80 mb-1">Total Setup Fee</div>
                  <div className="text-3xl font-bold">
                    CHF {calculateTotal(packages.find(p => p.id === formData.membershipPackage)).toLocaleString()}
                  </div>
                  <div className="text-xs opacity-70 mt-2">
                    + CHF {packages.find(p => p.id === formData.membershipPackage).monthlyFee}/month starting next month
                  </div>
                </div>
                {paymentMethod && !formData.packageAddons.auditedContract && (
                  <button
                    onClick={() => nextStep()}
                    disabled={!validateStep()}
                    className="px-8 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    Continue to Preview
                    <ArrowRight size={18} />
                  </button>
                )}
                {formData.packageAddons.auditedContract && (
                  <button
                    onClick={() => nextStep()}
                    className="px-8 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-all flex items-center gap-2"
                  >
                    Continue to Preview
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Utility Token Preview (Step 6 for utility tokens)
  const renderUtilityPreview = () => {
    return (
      <div className="flex-1 overflow-y-auto py-8 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Token Preview</h2>
            <p className="text-sm text-gray-700">This is how your utility token will appear on PrivateCharterX</p>
          </div>

          {/* Preview Card */}
          <div className="bg-white/30 border border-gray-300/50 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
            {/* Header Image */}
            <div className="h-48 bg-gradient-to-r from-gray-800 to-gray-600 relative">
              <div className="absolute inset-0 flex items-center justify-center text-white/50">
                {formData.headerImage ? (
                  <span className="text-sm">Header Image Preview</span>
                ) : (
                  <span className="text-sm">No header image uploaded</span>
                )}
              </div>
            </div>

            {/* Logo & Title */}
            <div className="px-8 py-6">
              <div className="flex items-start gap-6 mb-6">
                {/* Logo */}
                <div className="w-24 h-24 bg-white border-4 border-white rounded-xl flex items-center justify-center flex-shrink-0 -mt-16 shadow-lg">
                  {formData.logo ? (
                    <span className="text-xs text-gray-600">Logo</span>
                  ) : (
                    <Building2 size={32} className="text-gray-400" />
                  )}
                </div>

                {/* Title & Basic Info */}
                <div className="flex-1 pt-2">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{formData.assetName || 'Asset Name'}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-700">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {formData.location || 'Location'}
                    </span>
                    <span className="px-2 py-1 bg-black text-white rounded-md text-xs font-medium">
                      {formData.tokenStandard}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-900 rounded-md text-xs font-medium">
                      UTILITY TOKEN
                    </span>
                  </div>
                </div>

                {/* Live Badge */}
                <div className="flex flex-col items-end pt-2">
                  <span className="px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-medium mb-2">
                    ● LIVE
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">About This Token</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {formData.description || 'No description provided'}
                </p>
              </div>

              {/* Token Details */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Token Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Token Standard:</span>
                      <span className="font-medium text-gray-900">{formData.tokenStandard}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total Supply:</span>
                      <span className="font-medium text-gray-900">{(parseFloat(formData.totalSupply || 0)).toLocaleString()} tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Symbol:</span>
                      <span className="font-medium text-gray-900">{formData.tokenSymbol || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Transferable:</span>
                      <span className="font-medium text-gray-900">{formData.isTransferable ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Burnable:</span>
                      <span className="font-medium text-gray-900">{formData.isBurnable ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Access Rights & Validity</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <div className="text-gray-700 mb-1">Access Rights:</div>
                      <div className="font-medium text-gray-900">{formData.accessRights || 'Not specified'}</div>
                    </div>
                    <div>
                      <div className="text-gray-700 mb-1">Validity Period:</div>
                      <div className="font-medium text-gray-900">{formData.validityPeriod || 'Not specified'}</div>
                    </div>
                    <div>
                      <div className="text-gray-700 mb-1">Jurisdiction:</div>
                      <div className="font-medium text-gray-900">{formData.jurisdiction ? formData.jurisdiction.toUpperCase() : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Features */}
              <div className="bg-white/40 rounded-xl p-4 backdrop-blur-sm mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Security & Compliance</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {formData.needsAudit && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check size={16} className="text-green-600" />
                      <span>Smart Contract Audited</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-700">
                    <Check size={16} className="text-green-600" />
                    <span>Blockchain Verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Check size={16} className="text-green-600" />
                    <span>{formData.tokenStandard} Standard</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Check size={16} className="text-green-600" />
                    <span>Transparent Supply</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-4 border-t border-gray-300/50">
                <button className="w-full py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all">
                  Mint/Purchase Token
                </button>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="mt-6 bg-blue-50/50 border border-blue-200/50 rounded-xl p-4 text-center">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> This is a preview of how your utility token will appear on PrivateCharterX. Review carefully before submitting.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Step 6: Token Offering Preview (Security Token only - before final submit)
  const renderStep6 = () => {
    const tokenizedValue = parseFloat(formData.assetValue || 0);
    const annualDistribution = formData.expectedAPY ? (tokenizedValue * parseFloat(formData.expectedAPY)) / 100 : 0;
    const managementFeeAmount = (tokenizedValue * formData.managementFee) / 100;

    return (
      <div className="flex-1 overflow-y-auto py-8 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Token Offering Preview</h2>
            <p className="text-sm text-gray-700">This is how your token offering will appear on PrivateCharterX</p>
          </div>

          {/* Preview Card - How it will look on website */}
          <div className="bg-white/30 border border-gray-300/50 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
            {/* Header Image */}
            <div className="h-48 bg-gradient-to-r from-gray-800 to-gray-600 relative">
              <div className="absolute inset-0 flex items-center justify-center text-white/50">
                {formData.headerImage ? (
                  <span className="text-sm">Header Image Preview</span>
                ) : (
                  <span className="text-sm">No header image uploaded</span>
                )}
              </div>
            </div>

            {/* Logo & Title */}
            <div className="px-8 py-6">
              <div className="flex items-start gap-6 mb-6">
                {/* Logo */}
                <div className="w-24 h-24 bg-white border-4 border-white rounded-xl flex items-center justify-center flex-shrink-0 -mt-16 shadow-lg">
                  {formData.logo ? (
                    <span className="text-xs text-gray-600">Logo</span>
                  ) : (
                    <Building2 size={32} className="text-gray-400" />
                  )}
                </div>

                {/* Title & Basic Info */}
                <div className="flex-1 pt-2">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{formData.assetName || 'Asset Name'}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-700">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {formData.location || 'Location'}
                    </span>
                    <span className="px-2 py-1 bg-black text-white rounded-md text-xs font-medium">
                      {formData.tokenStandard}
                    </span>
                    <span className="px-2 py-1 bg-gray-200 text-gray-900 rounded-md text-xs font-medium">
                      {formData.revenueCurrency}
                    </span>
                  </div>
                </div>

                {/* Live Badge */}
                <div className="flex flex-col items-end">
                  <span className="px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-medium mb-2">
                    ● LIVE
                  </span>
                  <span className="text-sm font-semibold text-gray-900">${(parseFloat(formData.pricePerToken || 0)).toLocaleString()}/token</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white/40 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-xs text-gray-600 mb-1">Asset Value</div>
                  <div className="text-lg font-bold text-gray-900">${(parseFloat(formData.assetValue || 0)).toLocaleString()}</div>
                </div>
                <div className="bg-white/40 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-xs text-gray-600 mb-1">Expected APY</div>
                  <div className="text-lg font-bold text-green-600">{formData.expectedAPY || 0}%</div>
                </div>
                <div className="bg-white/40 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-xs text-gray-600 mb-1">Min. Investment</div>
                  <div className="text-lg font-bold text-gray-900">${(parseFloat(formData.minimumInvestment || 0)).toLocaleString()}</div>
                </div>
                <div className="bg-white/40 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-xs text-gray-600 mb-1">Lock-up Period</div>
                  <div className="text-lg font-bold text-gray-900">{formData.lockupPeriod || 0}mo</div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">About This Asset</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {formData.description || 'No description provided'}
                </p>
              </div>

              {/* Investment Details */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Investment Terms</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total Supply:</span>
                      <span className="font-medium text-gray-900">{(parseFloat(formData.totalSupply || 0)).toLocaleString()} tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Revenue Distribution:</span>
                      <span className="font-medium text-gray-900 capitalize">{formData.revenueDistribution}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Annual Distribution:</span>
                      <span className="font-medium text-green-600">${annualDistribution.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Management Fee:</span>
                      <span className="font-medium text-gray-900">{formData.managementFee}% (${managementFeeAmount.toLocaleString()}/year)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Compliance & Security</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check size={16} className="text-green-600" />
                      <span>KYC/AML Required</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check size={16} className="text-green-600" />
                      <span>Smart Contract Audited</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check size={16} className="text-green-600" />
                      <span>Custodian Bank Verified</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check size={16} className="text-green-600" />
                      <span>Jurisdiction: {formData.jurisdiction ? formData.jurisdiction.toUpperCase() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-4 border-t border-gray-300/50">
                <button className="w-full py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all">
                  Invest Now
                </button>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="mt-6 bg-blue-50/50 border border-blue-200/50 rounded-xl p-4 text-center">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> This is a preview of how your token offering will appear to investors on PrivateCharterX. Review carefully before submitting.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Progress Indicator - Thin Progress Bar
  const renderProgressBar = () => {
    const progress = ((currentStep) / totalSteps) * 100;

    return (
      <div className="px-8 mb-6">
        <div className="max-w-3xl mx-auto">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/40 hover:bg-white/50 text-gray-900 transition-all border border-gray-300/50 backdrop-blur-xl"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      {/* Progress Bar */}
      {currentStep > 0 && renderProgressBar()}

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        {currentStep === 0 && renderStep0()}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && (tokenType === 'utility' ? renderStep3Utility() : renderStep3Security())}
        {currentStep === 4 && (tokenType === 'security' ? renderStep4() : renderStep5())}
        {currentStep === 5 && (tokenType === 'security' ? renderStep5() : renderPaymentPackageSelection())}
        {currentStep === 6 && (tokenType === 'security' ? renderStep6() : renderUtilityPreview())}
        {currentStep === 7 && renderStep6()}
      </div>

      {/* Footer Navigation */}
      {currentStep > 0 && (
        <div className="px-8 py-6 border-t border-gray-300/50 bg-white/20 backdrop-blur-xl mt-6">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button
              onClick={prevStep}
              className="px-6 py-2.5 bg-white/40 hover:bg-white/50 border border-gray-300/50 text-gray-900 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back
            </button>

            {currentStep < totalSteps ? (
              <div className="flex flex-col items-end gap-2">
                {!validateStep() && (
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle size={14} />
                    Please fill in all required fields (*)
                  </p>
                )}
                <button
                  onClick={nextStep}
                  disabled={!validateStep()}
                  className="px-6 py-2.5 bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  Continue
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowTermsModal(true)}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <Check size={18} />
                Continue to Signature
              </button>
            )}
          </div>
        </div>
      )}

      {/* Jurisdiction Popup Modal */}
      {showJurisdictionPopup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl border border-gray-300/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-300/50 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Select Jurisdiction</h2>
              <button
                onClick={() => {
                  setShowJurisdictionPopup(false);
                  setJurisdictionSearch('');
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200/50 transition-all"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-4 border-b border-gray-300/50">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={jurisdictionSearch}
                  onChange={(e) => setJurisdictionSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                  autoFocus
                />
              </div>
            </div>

            {/* Countries List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-2 gap-2">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <button
                      key={country}
                      onClick={() => {
                        updateFormData('jurisdiction', country);
                        setShowJurisdictionPopup(false);
                        setJurisdictionSearch('');
                      }}
                      className={`px-4 py-2.5 rounded-lg text-left text-sm transition-all ${
                        formData.jurisdiction === country
                          ? 'bg-black text-white'
                          : 'bg-white/50 hover:bg-white/80 text-gray-900'
                      }`}
                    >
                      {country}
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    No countries found matching "{jurisdictionSearch}"
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-300/50 flex justify-end">
              <button
                onClick={() => {
                  setShowJurisdictionPopup(false);
                  setJurisdictionSearch('');
                }}
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms & Signature Modal */}
      {showTermsModal && (
        <TermsSignatureModal
          onClose={() => setShowTermsModal(false)}
          onSubmit={async (signatureData) => {
            setIsSubmitting(true);
            setShowTermsModal(false);

            try {
              // Submit draft with signature data
              if (currentDraftId && address) {
                const result = await submitDraft(currentDraftId, address, signatureData);

                if (result.success) {
                  setIsSubmitting(false);
                  setShowSuccessModal(true);
                } else {
                  setIsSubmitting(false);
                  alert('Submission failed: ' + result.error);
                }
              } else {
                setIsSubmitting(false);
                alert('Draft ID or wallet address not found. Please try again.');
              }
            } catch (error) {
              setIsSubmitting(false);
              console.error('Submission error:', error);
              alert('An error occurred during submission.');
            }
          }}
          tokenType={tokenType}
          formData={formData}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl border border-gray-300/50 rounded-2xl shadow-2xl w-full max-w-lg p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-green-600" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Successfully Submitted!</h2>

            {/* Message */}
            <p className="text-gray-700 mb-6 leading-relaxed">
              Your tokenization request has been submitted successfully. Our team will reach out within 24-48 hours via email and/or phone to discuss next steps.
            </p>

            {/* Reference Info */}
            <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>What's Next:</strong> You'll receive a confirmation email shortly with your submission reference number.
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setShowSuccessModal(false);
                onBack();
              }}
              className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-xl font-semibold transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenizeAssetFlow;
