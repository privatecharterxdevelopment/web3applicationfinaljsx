import React, { useState, useRef } from 'react';
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
  ChevronLeft,
  MapPin,
  Search,
  X,
  Info,
  Loader2,
  Image,
  Trash2,
  Eye,
  CheckCircle,
  Circle
} from 'lucide-react';
import TermsSignatureModal from './TermsSignatureModal';
import { submitDraft, saveDraft } from '../../services/tokenizationService';
import { useAccount } from 'wagmi';
import { supabase } from '../../lib/supabase';

const TokenizeAssetFlow = ({ onBack, draftToLoad = null, user = null }) => {
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

  const totalSteps = 2; // Step 0: Category, Step 1: Simplified Form

  // File upload refs
  const logoInputRef = useRef(null);
  const headerInputRef = useRef(null);
  const imagesInputRef = useRef(null);
  const documentsInputRef = useRef(null);

  // Upload states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);

  // File upload handler
  const handleFileUpload = async (file, type) => {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `tokenization/${type}/${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      return {
        name: file.name,
        url: urlData.publicUrl,
        path: filePath,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  // Handle logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const uploaded = await handleFileUpload(file, 'logos');
    if (uploaded) {
      updateFormData('logo', uploaded);
    }
    setUploadingLogo(false);
  };

  // Handle header image upload
  const handleHeaderUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHeader(true);
    const uploaded = await handleFileUpload(file, 'headers');
    if (uploaded) {
      updateFormData('headerImage', uploaded);
    }
    setUploadingHeader(false);
  };

  // Handle multiple images upload
  const handleImagesUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImages(true);
    const uploadPromises = files.map(file => handleFileUpload(file, 'images'));
    const uploaded = await Promise.all(uploadPromises);
    const validUploads = uploaded.filter(Boolean);

    updateFormData('images', [...(formData.images || []), ...validUploads]);
    setUploadingImages(false);
  };

  // Handle document upload
  const handleDocumentUpload = async (e, docType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(docType);
    const uploaded = await handleFileUpload(file, 'documents');
    if (uploaded) {
      updateFormData(docType, uploaded);
    }
    setUploadingDoc(null);
  };

  // Remove uploaded file and delete from storage
  const removeFile = async (field, index = null) => {
    try {
      if (index !== null) {
        // Remove from array (images)
        const fileToRemove = formData[field]?.[index];
        if (fileToRemove?.path) {
          // Delete from Supabase storage
          await supabase.storage.from('uploads').remove([fileToRemove.path]);
        }
        const updated = [...formData[field]];
        updated.splice(index, 1);
        updateFormData(field, updated);
      } else {
        // Remove single file
        const fileToRemove = formData[field];
        if (fileToRemove?.path) {
          // Delete from Supabase storage
          await supabase.storage.from('uploads').remove([fileToRemove.path]);
        }
        updateFormData(field, null);
      }
    } catch (error) {
      console.error('Error removing file:', error);
      // Still remove from state even if storage delete fails
      if (index !== null) {
        const updated = [...formData[field]];
        updated.splice(index, 1);
        updateFormData(field, updated);
      } else {
        updateFormData(field, null);
      }
    }
  };

  // Handle final submission - simplified: save request and show success
  const handleSubmitApplication = async () => {
    if (!user?.id) {
      alert('Please sign in to submit your tokenization request.');
      return;
    }

    setIsSaving(true);
    try {
      // Save tokenization request
      const { data, error } = await supabase
        .from('tokenization_drafts')
        .upsert({
          id: currentDraftId || undefined,
          user_id: user?.id,
          wallet_address: address || null,
          token_type: tokenType,
          asset_category: assetCategory,
          current_step: 1,
          status: 'submitted',
          asset_name: formData.assetName || null,
          asset_description: formData.description || null,
          asset_value: formData.assetValue ? parseFloat(formData.assetValue) : null,
          asset_location: formData.location || null,
          token_standard: formData.tokenStandard || null,
          token_symbol: formData.tokenSymbol || null,
          form_data: {
            assetName: formData.assetName,
            description: formData.description,
            assetValue: formData.assetValue,
            location: formData.location,
            tokenSymbol: formData.tokenSymbol,
            tokenType: tokenType,
            assetCategory: assetCategory
          },
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Save error:', error);
        alert('Failed to submit request. Please try again.');
        setIsSaving(false);
        return;
      }

      // Update draft ID if new
      if (data?.id) {
        setCurrentDraftId(data.id);
      }

      // Also save to user_requests for email notifications
      try {
        await supabase.from('user_requests').insert([{
          user_id: user.id,
          type: 'tokenization',
          status: 'pending',
          data: {
            tokenization_draft_id: data?.id,
            asset_name: formData.assetName,
            asset_category: assetCategory,
            asset_description: formData.description,
            asset_value: formData.assetValue,
            asset_location: formData.location,
            token_type: tokenType,
            token_symbol: formData.tokenSymbol,
            booking_source: 'tokenization_flow_simplified',
            timestamp: new Date().toISOString()
          }
        }]);
      } catch (notifError) {
        console.warn('User request save failed:', notifError);
      }

      setIsSaving(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Save exception:', error);
      alert('An error occurred while saving. Please try again.');
      setIsSaving(false);
    }
  };

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
      <div className="flex-1 overflow-y-auto py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tighter mb-3 font-['DM_Sans']">Tokenize Your Asset</h2>
            <p className="text-base text-gray-600 max-w-xl font-['DM_Sans']">
              Select your asset type to start the tokenization process
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {assetTypes.map((asset) => (
              <button
                key={asset.id}
                onClick={() => {
                  setAssetCategory(asset.id);
                  updateFormData('assetCategory', asset.id);
                  nextStep();
                }}
                className="relative rounded-xl border border-gray-200/80 bg-white/60 hover:bg-white/90 hover:border-gray-300 hover:shadow-lg transition-all duration-200 text-left group backdrop-blur-sm overflow-hidden"
              >
                {asset.popular && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="px-2 py-1 bg-black text-white rounded text-[10px] font-bold">
                      HOT
                    </span>
                  </div>
                )}

                <div className="w-full h-28 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={asset.imageUrl}
                    alt={asset.label}
                    className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-200 p-2 ${asset.imageScale || ''}`}
                  />
                </div>

                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 truncate font-['DM_Sans']">{asset.label}</h3>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Simplified Request Form (Step 1) - Single page form after category selection
  const renderSimplifiedForm = () => (
    <div className="flex-1 overflow-y-auto py-8 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              setAssetCategory(null);
              setCurrentStep(0);
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm font-['DM_Sans']"
          >
            <ChevronLeft size={18} />
            Back to Categories
          </button>
          <h2 className="text-2xl md:text-3xl font-light text-gray-900 tracking-tighter mb-2 font-['DM_Sans']">
            Tokenize Your {assetCategory?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Asset'}
          </h2>
          <p className="text-base text-gray-600 font-['DM_Sans']">
            Fill in the details below and we'll get in touch within 24-48 hours
          </p>
        </div>

        <div className="space-y-6">
          {/* Token Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3 font-['DM_Sans']">Token Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setTokenType('utility');
                  updateFormData('tokenStandard', 'ERC-721');
                }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  tokenType === 'utility'
                    ? 'bg-black text-white border-black'
                    : 'bg-white/50 border-gray-200 hover:border-gray-300 text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Coins size={20} className={tokenType === 'utility' ? 'text-white' : 'text-gray-700'} />
                  <span className="font-medium font-['DM_Sans']">Utility Token</span>
                </div>
                <p className={`text-xs font-['DM_Sans'] ${tokenType === 'utility' ? 'text-white/80' : 'text-gray-500'}`}>
                  Memberships, access rights, service hours
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTokenType('security');
                  updateFormData('tokenStandard', 'ERC-1400');
                }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  tokenType === 'security'
                    ? 'bg-black text-white border-black'
                    : 'bg-white/50 border-gray-200 hover:border-gray-300 text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Shield size={20} className={tokenType === 'security' ? 'text-white' : 'text-gray-700'} />
                  <span className="font-medium font-['DM_Sans']">Security Token</span>
                </div>
                <p className={`text-xs font-['DM_Sans'] ${tokenType === 'security' ? 'text-white/80' : 'text-gray-500'}`}>
                  Fractional ownership, revenue sharing
                </p>
              </button>
            </div>
          </div>

          {/* Asset Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Asset Name *</label>
            <input
              type="text"
              value={formData.assetName}
              onChange={(e) => updateFormData('assetName', e.target.value)}
              placeholder="e.g., Gulfstream G650"
              className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 font-['DM_Sans']"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Tell us about your asset - its features, condition, and what you'd like to achieve with tokenization..."
              rows={4}
              className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none font-['DM_Sans']"
            />
          </div>

          {/* Value & Location Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Estimated Value (USD) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                <input
                  type="number"
                  value={formData.assetValue}
                  onChange={(e) => updateFormData('assetValue', e.target.value)}
                  placeholder="5,000,000"
                  className="w-full pl-8 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 font-['DM_Sans']"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => updateFormData('location', e.target.value)}
                placeholder="e.g., Dubai, UAE"
                className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 font-['DM_Sans']"
              />
            </div>
          </div>

          {/* Token Symbol (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">
              Token Symbol <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.tokenSymbol}
              onChange={(e) => updateFormData('tokenSymbol', e.target.value.toUpperCase())}
              placeholder="e.g., GJET or PCX-JET"
              maxLength={12}
              className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 uppercase font-['DM_Sans']"
            />
            <p className="mt-1 text-xs text-gray-500 font-['DM_Sans']">We can help you choose a symbol if you're unsure</p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              onClick={handleSubmitApplication}
              disabled={!tokenType || !formData.assetName || !formData.description || !formData.assetValue || !formData.location || isSaving || isSubmitting}
              className="w-full py-4 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-['DM_Sans']"
            >
              {isSaving || isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {isSaving ? 'Saving...' : 'Submitting...'}
                </>
              ) : (
                <>
                  Submit Request
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-gray-500 font-['DM_Sans']">
              Our team will contact you within 24-48 hours to discuss your tokenization
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 1: Token Type Selection - Larger Design
  const renderStep1 = () => (
    <div className="flex-1 overflow-y-auto py-8 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tighter mb-3 font-['DM_Sans']">Choose Token Type</h2>
          <p className="text-base text-gray-600 font-['DM_Sans']">Select the tokenization model for your {assetCategory?.replace('-', ' ') || 'asset'}</p>
        </div>

        {/* Token Type Cards - Horizontal Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Utility Token Card */}
          <button
            onClick={() => handleTokenTypeSelect('utility')}
            className="group bg-white/50 hover:bg-white/70 border border-gray-200 hover:border-black rounded-2xl p-6 transition-all duration-200 hover:shadow-lg text-left relative overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center">
                <Coins size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 font-['DM_Sans']">Utility Token</h3>
                <div className="flex gap-2 mt-1">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">ERC-20</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">ERC-721</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 font-['DM_Sans']">
              Service access, memberships, VIP lounges, event tickets. NFT-based benefits.
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-700 font-['DM_Sans']">
                <Check size={14} className="text-green-600" />
                <span>Memberships & Access Rights</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 font-['DM_Sans']">
                <Check size={14} className="text-green-600" />
                <span>Service Hours & VIP Access</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-500 font-['DM_Sans']">Audit: Optional</span>
              <span className="text-base font-medium text-gray-900 group-hover:text-black flex items-center gap-2 font-['DM_Sans']">
                Select <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </button>

          {/* Security Token Card */}
          <button
            onClick={() => handleTokenTypeSelect('security')}
            className="group bg-white/50 hover:bg-white/70 border border-gray-200 hover:border-black rounded-2xl p-6 transition-all duration-200 hover:shadow-lg text-left relative overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center">
                <Shield size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 font-['DM_Sans']">Security Token</h3>
                <div className="flex gap-2 mt-1">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">Reg-D</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">Reg-S</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">Reg-CF</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 font-['DM_Sans']">
              Investment assets with returns, APY, revenue distribution. Full compliance.
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-700 font-['DM_Sans']">
                <Check size={14} className="text-green-600" />
                <span>Fractional Ownership & Revenue</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 font-['DM_Sans']">
                <Check size={14} className="text-green-600" />
                <span>KYC/AML & Accreditation</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-500 font-['DM_Sans']">Audit: Required</span>
              <span className="text-base font-medium text-gray-900 group-hover:text-black flex items-center gap-2 font-['DM_Sans']">
                Select <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 bg-blue-50/60 border border-blue-100 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 font-['DM_Sans']">
              <span className="font-medium">SEC-Compliant:</span> Security token offerings handled by our SEC-licensed partner.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: Asset Information
  const renderStep2 = () => (
    <div className="flex-1 overflow-y-auto py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tighter mb-3 font-['DM_Sans']">Asset Information</h2>
          <p className="text-base text-gray-700 font-['DM_Sans']">Provide details about the asset you want to tokenize</p>
        </div>

        <div className="space-y-5">
          {/* Asset Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Asset Name *</label>
            <input
              type="text"
              value={formData.assetName}
              onChange={(e) => updateFormData('assetName', e.target.value)}
              placeholder="e.g., Gulfstream G650"
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-base text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl font-['DM_Sans']"
            />
          </div>

          {/* Asset Category */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Asset Category *</label>
            <select
              value={formData.assetCategory}
              onChange={(e) => updateFormData('assetCategory', e.target.value)}
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl font-['DM_Sans']"
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
            <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Asset Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Provide detailed information about the asset, its condition, features, and any relevant details..."
              rows={4}
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-base text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl resize-none font-['DM_Sans']"
            />
          </div>

          {/* Asset Value & Location - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Asset Value (USD) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 font-medium text-base">$</span>
                <input
                  type="number"
                  value={formData.assetValue}
                  onChange={(e) => updateFormData('assetValue', e.target.value)}
                  placeholder="5000000"
                  className="w-full pl-8 pr-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-base text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl font-['DM_Sans']"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Current Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => updateFormData('location', e.target.value)}
                placeholder="e.g., Dubai, UAE"
                className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-base text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl font-['DM_Sans']"
              />
            </div>
          </div>

          {/* Logo & Header Image - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Asset Logo *</label>
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              {formData.logo ? (
                <div className="border-2 border-green-300 rounded-xl p-4 bg-green-50/50 backdrop-blur-xl relative">
                  <div className="flex items-center gap-3">
                    <img src={formData.logo.url} alt="Logo" className="w-14 h-14 object-cover rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium truncate font-['DM_Sans']">{formData.logo.name}</p>
                      <p className="text-xs text-green-600 font-['DM_Sans']">Uploaded</p>
                    </div>
                    <button
                      onClick={() => removeFile('logo')}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300/50 rounded-xl p-5 bg-white/20 backdrop-blur-xl hover:bg-white/25 transition-all cursor-pointer"
                >
                  <div className="flex flex-col items-center text-center">
                    {uploadingLogo ? (
                      <Loader2 size={28} className="text-gray-700 mb-2 animate-spin" />
                    ) : (
                      <Upload size={28} className="text-gray-700 mb-2" />
                    )}
                    <p className="text-sm text-gray-900 font-medium font-['DM_Sans']">Upload Logo</p>
                    <p className="text-xs text-gray-600 font-['DM_Sans']">PNG, JPG, SVG (max 2MB)</p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Header Image *</label>
              <input
                type="file"
                ref={headerInputRef}
                onChange={handleHeaderUpload}
                accept="image/*"
                className="hidden"
              />
              {formData.headerImage ? (
                <div className="border-2 border-green-300 rounded-xl p-4 bg-green-50/50 backdrop-blur-xl relative">
                  <div className="flex items-center gap-3">
                    <img src={formData.headerImage.url} alt="Header" className="w-14 h-14 object-cover rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium truncate font-['DM_Sans']">{formData.headerImage.name}</p>
                      <p className="text-xs text-green-600 font-['DM_Sans']">Uploaded</p>
                    </div>
                    <button
                      onClick={() => removeFile('headerImage')}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => headerInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300/50 rounded-xl p-5 bg-white/20 backdrop-blur-xl hover:bg-white/25 transition-all cursor-pointer"
                >
                  <div className="flex flex-col items-center text-center">
                    {uploadingHeader ? (
                      <Loader2 size={28} className="text-gray-700 mb-2 animate-spin" />
                    ) : (
                      <Upload size={28} className="text-gray-700 mb-2" />
                    )}
                    <p className="text-sm text-gray-900 font-medium font-['DM_Sans']">Upload Header</p>
                    <p className="text-xs text-gray-600 font-['DM_Sans']">1920x400px (max 5MB)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upload Asset Images */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Asset Images *</label>
            <input
              type="file"
              ref={imagesInputRef}
              onChange={handleImagesUpload}
              accept="image/*"
              multiple
              className="hidden"
            />

            {/* Uploaded Images Grid */}
            {formData.images && formData.images.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img src={img.url} alt={img.name} className="w-full h-24 object-cover rounded-xl" />
                    <button
                      onClick={() => removeFile('images', index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              onClick={() => imagesInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300/50 rounded-xl p-6 bg-white/20 backdrop-blur-xl hover:bg-white/25 transition-all cursor-pointer"
            >
              <div className="flex flex-col items-center text-center">
                {uploadingImages ? (
                  <Loader2 size={32} className="text-gray-700 mb-2 animate-spin" />
                ) : (
                  <Upload size={32} className="text-gray-700 mb-2" />
                )}
                <p className="text-sm text-gray-900 font-medium font-['DM_Sans']">
                  {formData.images?.length > 0 ? 'Add more images' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-600 font-['DM_Sans']">PNG, JPG up to 10MB each</p>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200/50">
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-5 py-3 text-base text-gray-700 hover:text-gray-900 transition-colors font-['DM_Sans']"
            >
              <ChevronLeft size={20} />
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={!formData.assetName || !formData.description || !formData.assetValue}
              className="flex items-center gap-2 px-8 py-3 bg-black text-white text-base font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-['DM_Sans']"
            >
              Continue
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 3a: Utility Token Configuration
  const renderStep3Utility = () => (
    <div className="flex-1 overflow-y-auto py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tighter mb-3 font-['DM_Sans']">Utility Token Configuration</h2>
          <p className="text-base text-gray-700 font-['DM_Sans']">Define your NFT-based utility token parameters</p>
        </div>

        <div className="space-y-5">
          {/* Token Standard */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Token Standard *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => updateFormData('tokenStandard', 'ERC-20')}
                className={`p-4 rounded-xl border-2 transition-all backdrop-blur-xl ${
                  formData.tokenStandard === 'ERC-20'
                    ? 'bg-black text-white border-black'
                    : 'bg-white/20 border-gray-300/50 text-gray-900 hover:bg-white/30'
                }`}
              >
                <div className="text-base font-medium font-['DM_Sans']">ERC-20</div>
                <div className="text-sm opacity-80 font-['DM_Sans']">Fungible tokens</div>
              </button>
              <button
                onClick={() => updateFormData('tokenStandard', 'ERC-721')}
                className={`p-4 rounded-xl border-2 transition-all backdrop-blur-xl ${
                  formData.tokenStandard === 'ERC-721'
                    ? 'bg-black text-white border-black'
                    : 'bg-white/20 border-gray-300/50 text-gray-900 hover:bg-white/30'
                }`}
              >
                <div className="text-base font-medium font-['DM_Sans']">ERC-721</div>
                <div className="text-sm opacity-80 font-['DM_Sans']">Unique NFTs</div>
              </button>
            </div>
          </div>

          {/* Total Supply & Token Symbol - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Total Supply *</label>
              <input
                type="number"
                value={formData.totalSupply}
                onChange={(e) => updateFormData('totalSupply', e.target.value)}
                placeholder="e.g., 100"
                className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-base text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl font-['DM_Sans']"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Token Symbol *</label>
              <input
                type="text"
                value={formData.tokenSymbol}
                onChange={(e) => updateFormData('tokenSymbol', e.target.value)}
                placeholder="e.g., VIP-LOUNGE"
                className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-base text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl uppercase font-['DM_Sans']"
              />
            </div>
          </div>

          {/* Issuer Wallet Address */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">
              Issuer Wallet Address *
              {address && (
                <button
                  type="button"
                  onClick={() => updateFormData('issuerWalletAddress', address)}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-700 font-['DM_Sans']"
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
          </div>

          {/* Access Rights */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Access Rights / Benefits *</label>
            <textarea
              value={formData.accessRights}
              onChange={(e) => updateFormData('accessRights', e.target.value)}
              placeholder="e.g., 10 hours of limousine service, VIP lounge access for 1 year..."
              rows={3}
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-base text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl resize-none font-['DM_Sans']"
            />
          </div>

          {/* Validity Period */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Validity Period (Optional)</label>
            <input
              type="text"
              value={formData.validityPeriod}
              onChange={(e) => updateFormData('validityPeriod', e.target.value)}
              placeholder="e.g., 12 months, No expiration"
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-base text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl font-['DM_Sans']"
            />
          </div>

          {/* Smart Contract Features */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3 font-['DM_Sans']">Smart Contract Features</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 bg-white/20 rounded-xl border border-gray-300/50 cursor-pointer hover:bg-white/30 transition-all backdrop-blur-xl">
                <input
                  type="checkbox"
                  checked={formData.isTransferable}
                  onChange={(e) => updateFormData('isTransferable', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-black focus:ring-2 focus:ring-gray-400"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 font-['DM_Sans']">Transferable</div>
                  <div className="text-xs text-gray-700 font-['DM_Sans']">Token holders can transfer/sell their NFTs</div>
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
                  <div className="text-sm font-medium text-gray-900 font-['DM_Sans']">Burnable</div>
                  <div className="text-xs text-gray-700 font-['DM_Sans']">Tokens can be destroyed after use</div>
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
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2 font-['DM_Sans']">
                    Smart Contract Audit (Optional)
                    <div className="group relative">
                      <Info size={14} className="text-gray-600 cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-52 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-lg z-10 font-['DM_Sans']">
                        Professional security audit by certified firms.
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-700 font-['DM_Sans']">Professional security audit by certified firms</div>
                </div>
              </label>
            </div>
          </div>

          {/* Jurisdiction */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Legal Jurisdiction *</label>
            <button
              type="button"
              onClick={() => setShowJurisdictionPopup(true)}
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-left hover:bg-white/40 transition-all backdrop-blur-xl flex items-center justify-between"
            >
              <span className={`text-base font-['DM_Sans'] ${formData.jurisdiction ? 'text-gray-900' : 'text-gray-500'}`}>
                {formData.jurisdiction || 'Select jurisdiction'}
              </span>
              <Search size={18} className="text-gray-600" />
            </button>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200/50">
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-5 py-3 text-base text-gray-700 hover:text-gray-900 transition-colors font-['DM_Sans']"
            >
              <ChevronLeft size={20} />
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={!formData.totalSupply || !formData.tokenSymbol || !formData.jurisdiction}
              className="flex items-center gap-2 px-8 py-3 bg-black text-white text-base font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-['DM_Sans']"
            >
              Continue
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 3b: Security Token Configuration
  const renderStep3Security = () => (
    <div className="flex-1 overflow-y-auto py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tighter mb-3 font-['DM_Sans']">Security Token Configuration</h2>
          <p className="text-base text-gray-700 font-['DM_Sans']">Configure investment terms and compliance settings</p>
        </div>

        <div className="space-y-5">
          {/* SEC Regulation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">SEC Regulation Type *</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => updateFormData('tokenStandard', 'Reg-D')}
                className={`p-4 rounded-xl border-2 transition-all backdrop-blur-xl ${
                  formData.tokenStandard === 'Reg-D'
                    ? 'bg-blue-100 border-blue-500 text-blue-900'
                    : 'bg-white/20 border-gray-300/50 text-gray-900 hover:bg-white/30'
                }`}
              >
                <div className="text-base font-medium font-['DM_Sans']">Reg-D</div>
                <div className="text-sm opacity-80 font-['DM_Sans']">Accredited only</div>
              </button>
              <button
                onClick={() => updateFormData('tokenStandard', 'Reg-S')}
                className={`p-4 rounded-xl border-2 transition-all backdrop-blur-xl ${
                  formData.tokenStandard === 'Reg-S'
                    ? 'bg-blue-100 border-blue-500 text-blue-900'
                    : 'bg-white/20 border-gray-300/50 text-gray-900 hover:bg-white/30'
                }`}
              >
                <div className="text-base font-medium font-['DM_Sans']">Reg-S</div>
                <div className="text-sm opacity-80 font-['DM_Sans']">Non-US investors</div>
              </button>
              <button
                onClick={() => updateFormData('tokenStandard', 'Reg-CF')}
                className={`p-4 rounded-xl border-2 transition-all backdrop-blur-xl ${
                  formData.tokenStandard === 'Reg-CF'
                    ? 'bg-blue-100 border-blue-500 text-blue-900'
                    : 'bg-white/20 border-gray-300/50 text-gray-900 hover:bg-white/30'
                }`}
              >
                <div className="text-base font-medium font-['DM_Sans']">Reg-CF</div>
                <div className="text-sm opacity-80 font-['DM_Sans']">Crowdfunding</div>
              </button>
            </div>
          </div>

          {/* Total Supply & Token Symbol - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Total Token Supply *</label>
              <input
                type="number"
                value={formData.totalSupply}
                onChange={(e) => updateFormData('totalSupply', e.target.value)}
                placeholder="e.g., 1000000"
                className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-base text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl font-['DM_Sans']"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Token Symbol *</label>
              <input
                type="text"
                value={formData.tokenSymbol}
                onChange={(e) => updateFormData('tokenSymbol', e.target.value)}
                placeholder="e.g., G650-SEC"
                className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-base text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl uppercase font-['DM_Sans']"
              />
            </div>
          </div>

          {/* Issuer Wallet Address */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">
              Issuer Wallet Address *
              {address && (
                <button
                  type="button"
                  onClick={() => updateFormData('issuerWalletAddress', address)}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-700 font-['DM_Sans']"
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
          </div>

          {/* Min Investment & APY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Min. Investment *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 font-medium text-base">$</span>
                <input
                  type="number"
                  value={formData.minimumInvestment}
                  onChange={(e) => updateFormData('minimumInvestment', e.target.value)}
                  placeholder="10000"
                  className="w-full pl-8 pr-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-base text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl font-['DM_Sans']"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 font-['DM_Sans']">Expected APY %</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.expectedAPY}
                  onChange={(e) => updateFormData('expectedAPY', e.target.value)}
                  placeholder="8.5"
                  className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-base text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl font-['DM_Sans']"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 font-medium text-sm">%</span>
              </div>
            </div>
          </div>

          {/* ROI Calculator - Live Preview (Compact) */}
          {formData.assetValue && formData.expectedAPY && (
            <div className="bg-white/25 border border-gray-300/50 rounded-lg p-3 backdrop-blur-xl">
              <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1">
                <Sparkles size={12} />
                Projected Returns
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[25, 50, 100].map((percent) => {
                  const tokenizedValue = (parseFloat(formData.assetValue) * percent) / 100;
                  const annualDistribution = (tokenizedValue * parseFloat(formData.expectedAPY || 0)) / 100;

                  return (
                    <div key={percent} className="bg-white/20 rounded-lg p-2 backdrop-blur-sm text-center">
                      <div className="text-xs font-semibold text-gray-900">{percent}%</div>
                      <div className="text-[10px] text-gray-700">${(tokenizedValue/1000).toFixed(0)}k raised</div>
                      <div className="text-[10px] text-gray-900 font-medium">{formData.expectedAPY}% ROI</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Operator Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-2">Who operates this asset? *</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-2.5 bg-white/20 rounded-lg border border-gray-300/50 cursor-pointer hover:bg-white/30 transition-all backdrop-blur-xl">
                <input
                  type="radio"
                  name="operator"
                  checked={formData.operator === 'owner'}
                  onChange={() => updateFormData('operator', 'owner')}
                  className="w-4 h-4 border-gray-300 text-black focus:ring-2 focus:ring-gray-400"
                />
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-900">I operate it myself</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-white/20 rounded-lg border border-gray-300/50 cursor-pointer hover:bg-white/30 transition-all backdrop-blur-xl">
                <input
                  type="radio"
                  name="operator"
                  checked={formData.operator === 'third-party'}
                  onChange={() => updateFormData('operator', 'third-party')}
                  className="w-4 h-4 border-gray-300 text-black focus:ring-2 focus:ring-gray-400"
                />
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-900">Third-party operator</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-white/20 rounded-lg border border-gray-300/50 cursor-pointer hover:bg-white/30 transition-all backdrop-blur-xl">
                <input
                  type="radio"
                  name="operator"
                  checked={formData.operator === 'pcx-partners'}
                  onChange={() => updateFormData('operator', 'pcx-partners')}
                  className="w-4 h-4 border-gray-300 text-black focus:ring-2 focus:ring-gray-400"
                />
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-900">Managed by PrivateCharterX partners</div>
                </div>
              </label>
            </div>
          </div>

          {/* Revenue Distribution Currency - USDC/USDT with Logos */}
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-2">Revenue Distribution Currency *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateFormData('revenueCurrency', 'USDC')}
                className={`p-3 rounded-lg border-2 transition-all backdrop-blur-xl ${
                  formData.revenueCurrency === 'USDC'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-white/20 border-gray-300/50 hover:bg-white/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <img
                    src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/pngtree-usdc-blue-coin-3d-rendering-front-view-cryptocurrency-illustration-cartoon-style-png-image_6443097.png"
                    alt="USDC"
                    className="w-8 h-8 object-contain"
                  />
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">USDC</div>
                    <div className="text-[10px] text-gray-600">Recommended ✓</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => updateFormData('revenueCurrency', 'USDT')}
                className={`p-3 rounded-lg border-2 transition-all backdrop-blur-xl ${
                  formData.revenueCurrency === 'USDT'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-white/20 border-gray-300/50 hover:bg-white/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <img
                    src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/green-circle-with-large-t-it-that-is-labeled-t_767610-17.jpg"
                    alt="USDT"
                    className="w-8 h-8 object-contain"
                  />
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">USDT</div>
                    <div className="text-[10px] text-gray-600">High liquidity</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Management Fee & Revenue Distribution & Lock-up - 3 columns */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-900 mb-1">Management Fee *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateFormData('managementFee', 2)}
                  className={`p-2 rounded-lg border-2 transition-all backdrop-blur-xl ${
                    formData.managementFee === 2
                      ? 'bg-black text-white border-black'
                      : 'bg-white/20 border-gray-300/50 text-gray-900 hover:bg-white/30'
                  }`}
                >
                  <div className="text-sm font-bold">2%</div>
                </button>
                <button
                  type="button"
                  onClick={() => updateFormData('managementFee', 3)}
                  className={`p-2 rounded-lg border-2 transition-all backdrop-blur-xl ${
                    formData.managementFee === 3
                      ? 'bg-black text-white border-black'
                      : 'bg-white/20 border-gray-300/50 text-gray-900 hover:bg-white/30'
                  }`}
                >
                  <div className="text-sm font-bold">3%</div>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-900 mb-1">Revenue Distribution *</label>
              <select
                value={formData.revenueDistribution}
                onChange={(e) => updateFormData('revenueDistribution', e.target.value)}
                className="w-full px-3 py-2 bg-white/30 border border-gray-300/50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-900 mb-1">Lock-up (Months) *</label>
              <input
                type="number"
                value={formData.lockupPeriod}
                onChange={(e) => updateFormData('lockupPeriod', e.target.value)}
                placeholder="12"
                className="w-full px-3 py-2 bg-white/30 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
              />
            </div>
          </div>

          {/* SPV/Legal Entity */}
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-2">Asset Holding Structure *</label>
            <div className="space-y-2">
              <label className="flex items-start gap-2 p-2.5 bg-white/20 rounded-lg border border-gray-300/50 cursor-pointer hover:bg-white/30 transition-all backdrop-blur-xl">
                <input
                  type="radio"
                  name="spv"
                  checked={formData.hasSPV === true}
                  onChange={() => updateFormData('hasSPV', true)}
                  className="w-4 h-4 mt-0.5 border-gray-300 text-black focus:ring-2 focus:ring-gray-400"
                />
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-900">I have an existing SPV/Legal Entity</div>
                  {formData.hasSPV === true && (
                    <input
                      type="text"
                      value={formData.spvDetails}
                      onChange={(e) => updateFormData('spvDetails', e.target.value)}
                      placeholder="SPV/Entity name and details"
                      className="w-full mt-1.5 px-2 py-1.5 bg-white/40 border border-gray-300/50 rounded text-xs text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                    />
                  )}
                </div>
              </label>

              <label className="flex items-start gap-2 p-2.5 bg-white/20 rounded-lg border border-gray-300/50 cursor-pointer hover:bg-white/30 transition-all backdrop-blur-xl">
                <input
                  type="radio"
                  name="spv"
                  checked={formData.hasSPV === false}
                  onChange={() => updateFormData('hasSPV', false)}
                  className="w-4 h-4 mt-0.5 border-gray-300 text-black focus:ring-2 focus:ring-gray-400"
                />
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-900">I need SPV-as-a-Service</div>
                  <div className="text-[10px] text-gray-700">We'll help set up an SPV through partners</div>
                </div>
              </label>
            </div>
          </div>

          {/* Compliance Info Box - Compact */}
          <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-2.5 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-blue-600 flex-shrink-0" />
              <div className="text-[10px] text-blue-900">
                <span className="font-medium">Included:</span> KYC/AML • Investor accreditation • Transfer restrictions
              </div>
            </div>
          </div>

          {/* Jurisdiction */}
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">Regulatory Jurisdiction *</label>
            <button
              type="button"
              onClick={() => setShowJurisdictionPopup(true)}
              className="w-full px-3 py-2 bg-white/30 border border-gray-300/50 rounded-lg text-left hover:bg-white/40 transition-all backdrop-blur-xl flex items-center justify-between"
            >
              <span className={`text-sm ${formData.jurisdiction ? 'text-gray-900' : 'text-gray-500'}`}>
                {formData.jurisdiction || 'Select jurisdiction'}
              </span>
              <Search size={14} className="text-gray-600" />
            </button>
          </div>

          {/* Legal Documents Upload - Compact Grid */}
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-2">Legal Documents Required *</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Prospectus', field: 'prospectus' },
                { name: 'Legal Opinion', field: 'legalOpinion' },
                { name: 'Ownership Proof', field: 'ownershipProof' },
                { name: 'Insurance', field: 'insurance' }
              ].map((doc) => (
                <div key={doc.name} className={`border rounded-lg p-2 backdrop-blur-xl ${formData[doc.field] ? 'border-green-300 bg-green-50/50' : 'border-gray-300/50 bg-white/20'}`}>
                  <input
                    type="file"
                    id={`doc-${doc.field}`}
                    onChange={(e) => handleDocumentUpload(e, doc.field)}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <FileText size={12} className={formData[doc.field] ? 'text-green-600' : 'text-gray-700'} />
                      <span className="text-[10px] font-medium text-gray-900 truncate">
                        {formData[doc.field] ? formData[doc.field].name : doc.name}
                      </span>
                    </div>
                    {formData[doc.field] ? (
                      <button
                        onClick={() => removeFile(doc.field)}
                        className="p-1 hover:bg-red-100 rounded transition-colors ml-1"
                      >
                        <Trash2 size={12} className="text-red-500" />
                      </button>
                    ) : (
                      <label
                        htmlFor={`doc-${doc.field}`}
                        className="px-2 py-1 bg-black text-white text-[10px] rounded hover:bg-gray-800 transition-all cursor-pointer flex items-center gap-1"
                      >
                        {uploadingDoc === doc.field ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          'Upload'
                        )}
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Contract Audit - Required */}
          <div className="bg-red-50/50 border border-red-200/50 rounded-lg p-2.5 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-red-600 flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1">
                <input type="checkbox" checked={true} disabled className="w-3 h-3 rounded border-gray-300 text-red-600" />
                <span className="text-xs font-medium text-red-900">Smart Contract Audit Required</span>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200/50">
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={!formData.tokenStandard || !formData.jurisdiction}
              className="flex items-center gap-2 px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 4: Custody & Banking (Security Token only)
  const renderStep4 = () => (
    <div className="flex-1 flex flex-col items-center justify-center py-6 px-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-3">
            <Building2 size={24} className="text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Custody & Compliance</h2>
          <p className="text-xs text-gray-700">Digital token management & regulatory oversight</p>
        </div>

        <div className="bg-white/25 border border-gray-300/50 rounded-xl p-5 backdrop-blur-xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Asset Remains Operational</h3>
              <p className="text-xs text-gray-700">
                Your physical asset continues generating revenue in day-to-day operations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex items-center gap-2 text-xs text-gray-900">
              <Check size={14} className="text-gray-900 flex-shrink-0" />
              <span>Token safekeeping</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-900">
              <Check size={14} className="text-gray-900 flex-shrink-0" />
              <span>KYC/AML compliance</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-900">
              <Check size={14} className="text-gray-900 flex-shrink-0" />
              <span>Revenue verification</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-900">
              <Check size={14} className="text-gray-900 flex-shrink-0" />
              <span>Regulatory reporting</span>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-2.5">
            <p className="text-[10px] text-blue-900">
              <span className="font-semibold">Note:</span> Physical asset stays with your SPV. Custodians manage digital tokens, compliance & revenue verification.
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200/50">
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Continue
              <ChevronRight size={16} />
            </button>
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
      <div className="flex-1 overflow-y-auto py-6 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Review & Submit</h2>
            <p className="text-xs text-gray-700">Verify all information before submitting</p>
          </div>

          {/* Summary Cards */}
          <div className="space-y-3 mb-5">
            {/* Token Type & Asset Info - Compact */}
            <div className="bg-white/25 border border-gray-300/50 rounded-lg p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                  {tokenType === 'utility' ? <Coins size={14} /> : <Shield size={14} />}
                  Token Type
                </h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-black text-white rounded text-[10px] font-medium">
                    {tokenType === 'utility' ? 'Utility' : 'Security'}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-[10px]">
                    {formData.tokenStandard}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-gray-500 text-[10px]">Asset</div>
                  <div className="text-gray-900 font-medium truncate">{formData.assetName || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[10px]">Category</div>
                  <div className="text-gray-900 font-medium">{formData.assetCategory || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[10px]">Value</div>
                  <div className="text-gray-900 font-medium">${formData.assetValue ? parseInt(formData.assetValue).toLocaleString() : '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[10px]">Location</div>
                  <div className="text-gray-900 font-medium truncate">{formData.location || '-'}</div>
                </div>
              </div>
            </div>

            {/* Token Configuration - Compact */}
            <div className="bg-white/25 border border-gray-300/50 rounded-lg p-4 backdrop-blur-xl">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Token Configuration</h3>
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-gray-500 text-[10px]">Supply</div>
                  <div className="text-gray-900 font-medium">{formData.totalSupply ? parseInt(formData.totalSupply).toLocaleString() : '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[10px]">Symbol</div>
                  <div className="text-gray-900 font-medium">{formData.tokenSymbol || '-'}</div>
                </div>
                {tokenType === 'security' && formData.expectedAPY && (
                  <div>
                    <div className="text-gray-500 text-[10px]">APY</div>
                    <div className="text-gray-900 font-medium">{formData.expectedAPY}%</div>
                  </div>
                )}
                <div>
                  <div className="text-gray-500 text-[10px]">Jurisdiction</div>
                  <div className="text-gray-900 font-medium">{formData.jurisdiction || '-'}</div>
                </div>
              </div>
            </div>

            </div>

          {/* Submission Info - Compact */}
          <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-3 backdrop-blur-xl">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-blue-900 mb-1">What happens next?</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-blue-800">
                  <span className="flex items-center gap-1"><Check size={10} className="text-blue-600" /> Compliance review</span>
                  <span className="flex items-center gap-1"><Check size={10} className="text-blue-600" /> KYC/AML verification</span>
                  <span className="flex items-center gap-1"><Check size={10} className="text-blue-600" /> Consultation within 24-48h</span>
                  <span className="flex items-center gap-1"><Check size={10} className="text-blue-600" /> Smart contract deployment</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200/50">
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <button
              onClick={() => {
                console.log('Submitting form:', formData);
                setShowSuccessModal(true);
              }}
              className="flex items-center gap-2 px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Submit Application
              <Check size={16} />
            </button>
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
      <div className="flex-1 overflow-y-auto py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-5 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Choose Your NFT Membership Package</h2>
            <p className="text-xs text-gray-700">Select the package that best fits your business needs</p>
          </div>

          {/* Package Cards - Compact */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => updateFormData('membershipPackage', pkg.id)}
                className={`relative bg-white/30 border-2 rounded-xl p-4 backdrop-blur-xl cursor-pointer transition-all hover:shadow-lg ${
                  formData.membershipPackage === pkg.id
                    ? 'border-black shadow-xl'
                    : 'border-gray-300/50 hover:border-gray-400'
                } ${pkg.popular ? 'ring-2 ring-blue-500' : ''}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                    POPULAR
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-3">
                  <div className="text-2xl mb-1">{pkg.icon}</div>
                  <h3 className="text-sm font-bold text-gray-900">{pkg.name}</h3>
                  <p className="text-[10px] text-gray-700">{pkg.memberCards}</p>
                </div>

                {/* Pricing */}
                <div className="mb-3 pb-3 border-b border-gray-300/50">
                  <div className="text-center mb-2">
                    <div className="text-xl font-bold text-gray-900">CHF {pkg.setupFee.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-600">Setup (einmalig)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900">CHF {pkg.monthlyFee}/mo</div>
                  </div>
                </div>

                {/* Revenue Share */}
                <div className="mb-3 pb-3 border-b border-gray-300/50">
                  <div className="text-[10px] font-semibold text-gray-700 mb-1">Revenue-Share:</div>
                  <div className="text-[10px] text-gray-600">
                    CHF {pkg.revenueShare.perNFT}/NFT • {pkg.revenueShare.perBooking}%/Buchung
                  </div>
                </div>

                {/* Benefits - Show first 5 only */}
                <div className="space-y-1">
                  {pkg.benefits.slice(0, 5).map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-1 text-[10px] text-gray-700">
                      <Check size={10} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-1">{benefit}</span>
                    </div>
                  ))}
                  {pkg.benefits.length > 5 && (
                    <div className="text-[10px] text-gray-500 pl-3">+{pkg.benefits.length - 5} more benefits</div>
                  )}
                </div>

                {/* Selected Indicator */}
                {formData.membershipPackage === pkg.id && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-black rounded-full flex items-center justify-center">
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

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200/50">
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            {formData.membershipPackage && (
              <button
                onClick={() => nextStep()}
                disabled={!formData.packageAddons.auditedContract && !paymentMethod}
                className="flex items-center gap-2 px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Preview
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          {/* Total */}
          {formData.membershipPackage && (
            <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl p-6 text-white mt-4">
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
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Final Summary Card - Modern design with uploaded images
  const renderFinalSummary = () => {
    // Get category image for fallback
    const getCategoryImage = () => {
      const categoryImages = {
        'jet': 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/g6_2_transparent.png',
        'helicopter': 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/airbus_h145_helicopter_by_gamerzzon_dhhd2oc-pre-removebg-preview.png',
        'yacht': 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/pngtree-white-modern-yachts-png-image_11385792.png',
        'real-estate': 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/01_01%20(1).jpg',
        'luxury-car': 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/HOR_XB1_Ferrari_250_62_GTO.webp',
        'art': 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/danseur_ii_by_yann_guillon_master-removebg-preview.png',
        'evtol': 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/lilium-jet-transparent-bg.png',
        'business': 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/istockphoto-506918827-612x612-removebg-preview%20(1).png'
      };
      return categoryImages[assetCategory] || categoryImages['jet'];
    };

    // Get display image - prioritize uploaded header/images, fallback to category
    const displayImage = formData.headerImage?.url ||
                         (formData.images && formData.images.length > 0 ? formData.images[0].url : null) ||
                         getCategoryImage();

    return (
      <div className="flex-1 overflow-y-auto py-6 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl md:text-3xl font-light text-gray-900 tracking-tight mb-2">Review Your Submission</h2>
            <p className="text-sm text-gray-600">Please review all information before submitting your tokenization request</p>
          </div>

          {/* Main Summary Card */}
          <div className="bg-white/70 backdrop-blur-xl border border-gray-200/60 rounded-2xl overflow-hidden shadow-lg">
            {/* Hero Image Section */}
            <div className="relative h-48 md:h-56 bg-gradient-to-br from-gray-900 to-gray-700 overflow-hidden">
              <img
                src={displayImage}
                alt={formData.assetName || 'Asset'}
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Overlay Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${tokenType === 'security' ? 'bg-blue-500/90 text-white' : 'bg-purple-500/90 text-white'}`}>
                        {tokenType === 'security' ? 'SECURITY TOKEN' : 'UTILITY TOKEN'}
                      </span>
                      <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded-md text-xs font-medium capitalize">
                        {assetCategory?.replace('-', ' ')}
                      </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">{formData.assetName || 'Untitled Asset'}</h1>
                    {formData.location && (
                      <p className="text-white/80 text-sm flex items-center gap-1 mt-1">
                        <MapPin size={14} />
                        {formData.location}
                      </p>
                    )}
                  </div>
                  {formData.logo?.url && (
                    <div className="w-16 h-16 bg-white rounded-xl shadow-lg overflow-hidden flex-shrink-0">
                      <img src={formData.logo.url} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50/80 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Asset Value</div>
                  <div className="text-lg font-semibold text-gray-900">
                    ${formData.assetValue ? parseInt(formData.assetValue).toLocaleString() : '0'}
                  </div>
                </div>
                <div className="bg-gray-50/80 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Token Supply</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formData.totalSupply ? parseInt(formData.totalSupply).toLocaleString() : '0'}
                  </div>
                </div>
                <div className="bg-gray-50/80 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Symbol</div>
                  <div className="text-lg font-semibold text-gray-900 font-mono">
                    ${formData.tokenSymbol || 'TKN'}
                  </div>
                </div>
              </div>

              {/* Description */}
              {formData.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{formData.description}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Token Configuration */}
                <div className="bg-gray-50/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Coins size={16} className="text-gray-600" />
                    Token Configuration
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Standard:</span>
                      <span className="font-medium text-gray-900">{formData.tokenStandard || 'TBD'}</span>
                    </div>
                    {tokenType === 'security' && formData.expectedAPY && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected APY:</span>
                        <span className="font-medium text-green-600">{formData.expectedAPY}%</span>
                      </div>
                    )}
                    {formData.minimumInvestment && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Min. Investment:</span>
                        <span className="font-medium text-gray-900">${parseInt(formData.minimumInvestment).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transferable:</span>
                      <span className="font-medium text-gray-900">{formData.isTransferable ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                {/* Compliance & Legal */}
                <div className="bg-gray-50/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield size={16} className="text-gray-600" />
                    Compliance & Legal
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jurisdiction:</span>
                      <span className="font-medium text-gray-900">{formData.jurisdiction || 'Not specified'}</span>
                    </div>
                    {tokenType === 'security' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">SPV Structure:</span>
                          <span className="font-medium text-gray-900">{formData.hasSPV ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Revenue Distribution:</span>
                          <span className="font-medium text-gray-900 capitalize">{formData.revenueDistribution}</span>
                        </div>
                      </>
                    )}
                    {tokenType === 'utility' && formData.validityPeriod && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Validity:</span>
                        <span className="font-medium text-gray-900">{formData.validityPeriod}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Uploaded Files Summary */}
              <div className="bg-green-50/50 border border-green-200/50 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  Uploaded Files
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={`flex items-center gap-2 text-sm ${formData.logo ? 'text-green-700' : 'text-gray-400'}`}>
                    {formData.logo ? <Check size={14} className="text-green-600" /> : <Circle size={14} />}
                    <span>Logo</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${formData.headerImage ? 'text-green-700' : 'text-gray-400'}`}>
                    {formData.headerImage ? <Check size={14} className="text-green-600" /> : <Circle size={14} />}
                    <span>Header Image</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${formData.images?.length > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                    {formData.images?.length > 0 ? <Check size={14} className="text-green-600" /> : <Circle size={14} />}
                    <span>Images ({formData.images?.length || 0})</span>
                  </div>
                  {tokenType === 'security' && (
                    <>
                      <div className={`flex items-center gap-2 text-sm ${formData.prospectus ? 'text-green-700' : 'text-gray-400'}`}>
                        {formData.prospectus ? <Check size={14} className="text-green-600" /> : <Circle size={14} />}
                        <span>Prospectus</span>
                      </div>
                      <div className={`flex items-center gap-2 text-sm ${formData.legalOpinion ? 'text-green-700' : 'text-gray-400'}`}>
                        {formData.legalOpinion ? <Check size={14} className="text-green-600" /> : <Circle size={14} />}
                        <span>Legal Opinion</span>
                      </div>
                      <div className={`flex items-center gap-2 text-sm ${formData.ownershipProof ? 'text-green-700' : 'text-gray-400'}`}>
                        {formData.ownershipProof ? <Check size={14} className="text-green-600" /> : <Circle size={14} />}
                        <span>Ownership Proof</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* What Happens Next */}
              <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">What happens next?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">1.</span>
                    <span>Our team will review your submission within <strong>24-48 hours</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">2.</span>
                    <span>You'll receive an email with feedback or approval status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">3.</span>
                    <span>Once approved, your token will be deployed to the marketplace</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 mt-4">
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 transition-colors border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <ChevronLeft size={16} />
              Back to Edit
            </button>
            <button
              onClick={handleSubmitApplication}
              disabled={isSaving || isSubmitting}
              className="flex items-center gap-2 px-8 py-3 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving || isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isSaving ? 'Saving...' : 'Submitting...'}
                </>
              ) : (
                <>
                  Submit Request
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Utility Token Preview (Step 6 for utility tokens) - Now uses renderFinalSummary
  const renderUtilityPreview = () => renderFinalSummary();

  // Step 6: Token Offering Preview (Security Token only) - Now uses renderFinalSummary
  const renderStep6 = () => renderFinalSummary();

  // Summary Tracker Component
  const renderSummaryTracker = () => {
    const steps = [
      { id: 0, label: 'Asset Type', completed: !!assetCategory },
      { id: 1, label: 'Token Type', completed: !!tokenType },
      { id: 2, label: 'Asset Info', completed: !!(formData.assetName && formData.description && formData.assetValue) },
      { id: 3, label: 'Token Config', completed: !!(formData.tokenStandard && formData.totalSupply && formData.tokenSymbol) },
      { id: 4, label: tokenType === 'security' ? 'Custody' : 'Review', completed: currentStep > 4 },
      { id: 5, label: tokenType === 'security' ? 'Review' : 'Package', completed: currentStep > 5 },
      { id: 6, label: 'Preview', completed: currentStep > 6 },
    ];

    const formatValue = (value) => {
      if (!value) return null;
      if (typeof value === 'number') return value.toLocaleString();
      if (typeof value === 'object' && value.name) return value.name;
      return value;
    };

    return (
      <div className="bg-white/40 backdrop-blur-xl border border-gray-200/50 rounded-xl p-4 sticky top-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Eye size={16} />
          Summary
        </h3>

        {/* Step Progress */}
        <div className="space-y-2 mb-4 pb-4 border-b border-gray-200/50">
          {steps.slice(0, tokenType ? 7 : 2).map((step) => (
            <div key={step.id} className="flex items-center gap-2">
              {step.completed ? (
                <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
              ) : currentStep === step.id ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-black bg-black/20 flex-shrink-0" />
              ) : (
                <Circle size={14} className="text-gray-300 flex-shrink-0" />
              )}
              <span className={`text-xs ${currentStep === step.id ? 'font-medium text-gray-900' : step.completed ? 'text-gray-700' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Entered Information */}
        <div className="space-y-3 text-xs">
          {assetCategory && (
            <div>
              <div className="text-gray-500 mb-0.5">Asset Category</div>
              <div className="text-gray-900 font-medium capitalize">{assetCategory.replace('-', ' ')}</div>
            </div>
          )}

          {tokenType && (
            <div>
              <div className="text-gray-500 mb-0.5">Token Type</div>
              <div className="text-gray-900 font-medium capitalize">{tokenType}</div>
            </div>
          )}

          {formData.assetName && (
            <div>
              <div className="text-gray-500 mb-0.5">Asset Name</div>
              <div className="text-gray-900 font-medium truncate">{formData.assetName}</div>
            </div>
          )}

          {formData.assetValue && (
            <div>
              <div className="text-gray-500 mb-0.5">Asset Value</div>
              <div className="text-gray-900 font-medium">${parseInt(formData.assetValue).toLocaleString()}</div>
            </div>
          )}

          {formData.location && (
            <div>
              <div className="text-gray-500 mb-0.5">Location</div>
              <div className="text-gray-900 font-medium truncate">{formData.location}</div>
            </div>
          )}

          {formData.totalSupply && (
            <div>
              <div className="text-gray-500 mb-0.5">Total Supply</div>
              <div className="text-gray-900 font-medium">{parseInt(formData.totalSupply).toLocaleString()} tokens</div>
            </div>
          )}

          {formData.tokenSymbol && (
            <div>
              <div className="text-gray-500 mb-0.5">Symbol</div>
              <div className="text-gray-900 font-medium">{formData.tokenSymbol}</div>
            </div>
          )}

          {formData.expectedAPY && (
            <div>
              <div className="text-gray-500 mb-0.5">Expected APY</div>
              <div className="text-gray-900 font-medium">{formData.expectedAPY}%</div>
            </div>
          )}

          {formData.jurisdiction && (
            <div>
              <div className="text-gray-500 mb-0.5">Jurisdiction</div>
              <div className="text-gray-900 font-medium">{formData.jurisdiction}</div>
            </div>
          )}

          {/* Uploaded Files Summary */}
          {(formData.logo || formData.headerImage || (formData.images && formData.images.length > 0)) && (
            <div className="pt-2 border-t border-gray-200/50">
              <div className="text-gray-500 mb-1">Uploaded Files</div>
              <div className="space-y-1">
                {formData.logo && (
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Image size={10} />
                    <span>Logo</span>
                    <CheckCircle size={10} className="text-green-600 ml-auto" />
                  </div>
                )}
                {formData.headerImage && (
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Image size={10} />
                    <span>Header</span>
                    <CheckCircle size={10} className="text-green-600 ml-auto" />
                  </div>
                )}
                {formData.images && formData.images.length > 0 && (
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Image size={10} />
                    <span>{formData.images.length} image(s)</span>
                    <CheckCircle size={10} className="text-green-600 ml-auto" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents Summary */}
          {(formData.prospectus || formData.legalOpinion || formData.ownershipProof || formData.insurance) && (
            <div className="pt-2 border-t border-gray-200/50">
              <div className="text-gray-500 mb-1">Documents</div>
              <div className="space-y-1">
                {formData.prospectus && (
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <FileText size={10} />
                    <span className="truncate">Prospectus</span>
                    <CheckCircle size={10} className="text-green-600 ml-auto flex-shrink-0" />
                  </div>
                )}
                {formData.legalOpinion && (
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <FileText size={10} />
                    <span className="truncate">Legal Opinion</span>
                    <CheckCircle size={10} className="text-green-600 ml-auto flex-shrink-0" />
                  </div>
                )}
                {formData.ownershipProof && (
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <FileText size={10} />
                    <span className="truncate">Ownership Proof</span>
                    <CheckCircle size={10} className="text-green-600 ml-auto flex-shrink-0" />
                  </div>
                )}
                {formData.insurance && (
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <FileText size={10} />
                    <span className="truncate">Insurance</span>
                    <CheckCircle size={10} className="text-green-600 ml-auto flex-shrink-0" />
                  </div>
                )}
              </div>
            </div>
          )}
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
      {/* Main Content - Simplified: Category Cards or Form */}
      <div className="flex-1">
        {currentStep === 0 && renderStep0()}
        {currentStep === 1 && renderSimplifiedForm()}
      </div>

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
                onBack('my-tokenized-assets'); // Navigate to My Tokenized Assets
              }}
              className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-xl font-semibold transition-all"
            >
              View My Tokenized Assets
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenizeAssetFlow;
