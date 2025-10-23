import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Shield,
  Building2,
  Globe,
  DollarSign,
  X,
  MapPin,
  Clock,
  Loader2,
  Plane,
  Ship,
  Home
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../../thefinalwebapplicationpcx-main/src/context/AuthContext';

const SPVFormationFlow = ({ onBack }) => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [modalStep, setModalStep] = useState(1);
  const totalModalSteps = 6;

  const [formData, setFormData] = useState({
    jurisdiction: null,
    planningToTokenizeAssets: false,
    assetType: null, // 'jet', 'helicopter', 'evtol', 'yacht', 'real-estate', 'multiple'
    companyName: '',
    businessActivity: '',
    numberOfDirectors: '1',
    numberOfShareholders: '1',
    contactEmail: '',
    contactPhone: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Jurisdiction Data with realistic pricing
  const jurisdictions = {
    premium: [
      {
        name: 'Switzerland',
        flag: '🇨🇭',
        formation: 7500,
        annual: 3500,
        tax: '11.9-21.6%',
        duration: '3-4 weeks',
        popularFor: ['jet', 'yacht', 'multiple'],
        description: 'Excellence in banking, top-tier reputation'
      },
      {
        name: 'Singapore',
        flag: '🇸🇬',
        formation: 6500,
        annual: 3000,
        tax: '17%',
        duration: '2-3 weeks',
        popularFor: ['jet', 'helicopter', 'yacht', 'multiple'],
        description: 'Asian financial hub, strong legal framework'
      },
      {
        name: 'Luxembourg',
        flag: '🇱🇺',
        formation: 8500,
        annual: 4000,
        tax: '24.94%',
        duration: '3-4 weeks',
        popularFor: ['jet', 'multiple'],
        description: 'EU jurisdiction, excellent for funds'
      },
      {
        name: 'Liechtenstein',
        flag: '🇱🇮',
        formation: 8000,
        annual: 3800,
        tax: '12.5%',
        duration: '3-4 weeks',
        popularFor: ['yacht', 'multiple'],
        description: 'Privacy protection, Swiss banking access'
      }
    ],
    standard: [
      {
        name: 'Cayman Islands',
        flag: '🇰🇾',
        formation: 5500,
        annual: 2800,
        tax: '0%',
        duration: '2-3 weeks',
        popularFor: ['yacht', 'jet', 'multiple'],
        description: 'Zero tax, strong offshore reputation'
      },
      {
        name: 'British Virgin Islands',
        flag: '🇻🇬',
        formation: 4500,
        annual: 2500,
        tax: '0%',
        duration: '1-2 weeks',
        popularFor: ['yacht', 'helicopter'],
        description: 'Fast formation, privacy protection'
      },
      {
        name: 'Dubai (UAE)',
        flag: '🇦🇪',
        formation: 6000,
        annual: 3200,
        tax: '0%',
        duration: '2-3 weeks',
        popularFor: ['jet', 'yacht', 'helicopter', 'multiple'],
        description: 'Middle East hub, zero tax, banking access'
      },
      {
        name: 'Hong Kong',
        flag: '🇭🇰',
        formation: 5000,
        annual: 2400,
        tax: '16.5%',
        duration: '1-2 weeks',
        popularFor: ['jet', 'multiple'],
        description: 'Asia gateway, strong financial system'
      },
      {
        name: 'Malta',
        flag: '🇲🇹',
        formation: 5200,
        annual: 2600,
        tax: '5-35%',
        duration: '2-3 weeks',
        popularFor: ['yacht'],
        description: 'EU member, yacht registration specialist'
      }
    ],
    budget: [
      {
        name: 'Seychelles',
        flag: '🇸🇨',
        formation: 3500,
        annual: 1800,
        tax: '0%',
        duration: '2-3 days',
        popularFor: ['yacht', 'helicopter'],
        description: 'Fast, affordable, zero tax'
      },
      {
        name: 'Belize',
        flag: '🇧🇿',
        formation: 3200,
        annual: 1600,
        tax: '0%',
        duration: '1-2 days',
        popularFor: ['yacht'],
        description: 'Quick formation, minimal compliance'
      },
      {
        name: 'Nevis',
        flag: '🇰🇳',
        formation: 3800,
        annual: 1900,
        tax: '0%',
        duration: '1-2 days',
        popularFor: ['helicopter'],
        description: 'Asset protection specialist'
      },
      {
        name: 'Vanuatu',
        flag: '🇻🇺',
        formation: 3000,
        annual: 1500,
        tax: '0%',
        duration: '1 day',
        popularFor: [],
        description: 'Fastest formation, maximum privacy'
      },
      {
        name: 'Marshall Islands',
        flag: '🇲🇭',
        formation: 4200,
        annual: 2000,
        tax: '0%',
        duration: '2-3 days',
        popularFor: ['yacht'],
        description: 'Popular for yacht registration'
      }
    ],
    usa: [
      {
        name: 'Delaware',
        flag: '🇺🇸',
        formation: 3200,
        annual: 1800,
        tax: 'State varies',
        duration: '1-2 weeks',
        popularFor: ['jet', 'multiple'],
        description: 'Business-friendly, strong legal framework'
      },
      {
        name: 'Wyoming',
        flag: '🇺🇸',
        formation: 3000,
        annual: 1600,
        tax: '0% state tax',
        duration: '1 week',
        popularFor: ['helicopter'],
        description: 'No state tax, privacy protection'
      },
      {
        name: 'Nevada',
        flag: '🇺🇸',
        formation: 3500,
        annual: 1900,
        tax: '0% state tax',
        duration: '1-2 weeks',
        popularFor: ['jet', 'helicopter'],
        description: 'Privacy laws, no state income tax'
      }
    ]
  };

  const tiers = [
    {
      id: 'premium',
      label: 'Premium',
      icon: Shield,
      description: 'Top-tier jurisdictions with excellent reputation',
      priceRange: '€6,500 - €8,500',
      features: ['Excellent Banking', 'Top Reputation', 'Full Substance Support']
    },
    {
      id: 'standard',
      label: 'Standard',
      icon: Building2,
      description: 'Well-established offshore centers with zero/low tax',
      priceRange: '€4,500 - €6,000',
      features: ['0% Tax Options', 'Good Banking', 'Strong Privacy'],
      popular: true
    },
    {
      id: 'budget',
      label: 'Budget',
      icon: DollarSign,
      description: 'Cost-effective jurisdictions with fast formation',
      priceRange: '€3,000 - €4,200',
      features: ['0% Tax', 'Fast Formation', 'Minimal Reporting']
    },
    {
      id: 'usa',
      label: 'USA',
      icon: Globe,
      description: 'US-based formation for domestic operations',
      priceRange: '€3,000 - €3,500',
      features: ['US Market Access', 'Strong Legal System', 'Credibility']
    }
  ];

  const assetTypes = [
    { id: 'jet', label: 'Private Jet', icon: Plane, emoji: '✈️' },
    { id: 'helicopter', label: 'Helicopter', icon: Plane, emoji: '🚁' },
    { id: 'evtol', label: 'eVTOL', icon: Plane, emoji: '🛸' },
    { id: 'yacht', label: 'Yacht', icon: Ship, emoji: '🛥️' },
    { id: 'real-estate', label: 'Real Estate', icon: Home, emoji: '🏠' },
    { id: 'multiple', label: 'Multiple Assets', icon: Building2, emoji: '🏢' }
  ];

  const handleTierSelect = (tier) => {
    setSelectedTier(tier);
    setShowModal(true);
    setModalStep(1);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalStep(1);
    setSelectedTier(null);
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

  const handleJurisdictionSelect = (jurisdiction) => {
    updateFormData('jurisdiction', jurisdiction);
    nextModalStep();
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      alert('Please login to submit SPV formation request');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate total costs
      const formationFee = formData.jurisdiction?.formation || 0;
      const annualFee = formData.jurisdiction?.annual || 0;
      const totalFirstYearCost = formationFee + annualFee;

      // Prepare request data
      const requestData = {
        tier: selectedTier,
        jurisdiction: formData.jurisdiction?.name,
        jurisdiction_flag: formData.jurisdiction?.flag,
        jurisdiction_formation_fee: formationFee,
        jurisdiction_annual_fee: annualFee,
        jurisdiction_tax_rate: formData.jurisdiction?.tax,
        jurisdiction_duration: formData.jurisdiction?.duration,
        company_name: formData.companyName,
        business_activity: formData.businessActivity,
        number_of_directors: formData.numberOfDirectors,
        number_of_shareholders: formData.numberOfShareholders,
        planning_to_tokenize: formData.planningToTokenizeAssets,
        asset_type: formData.assetType,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        total_first_year_cost: totalFirstYearCost,
        submitted_at: new Date().toISOString()
      };

      // Insert into user_requests table
      const { data, error } = await supabase
        .from('user_requests')
        .insert([{
          user_id: user.id,
          type: 'spv_formation',
          status: 'pending',
          service_type: `${formData.jurisdiction?.name} SPV Formation`,
          details: `${formData.companyName} - ${formData.businessActivity}`,
          estimated_cost: totalFirstYearCost,
          data: requestData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('SPV Formation request saved:', data);

      setIsSubmitting(false);
      setShowModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting SPV formation:', error);
      alert('Failed to submit request. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Modal Step 1: Jurisdiction Selection
  const renderModalStep1 = () => {
    const tierJurisdictions = jurisdictions[selectedTier] || [];
    const selectedAssetType = formData.assetType;

    return (
      <div className="space-y-3">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Select Jurisdiction</h3>
          <p className="text-xs text-gray-600">Choose the country for your SPV formation</p>
        </div>

        <div className="grid gap-3">
          {tierJurisdictions.map((jurisdiction) => {
            const isPopularForAsset = selectedAssetType && jurisdiction.popularFor.includes(selectedAssetType);

            return (
              <button
                key={jurisdiction.name}
                onClick={() => handleJurisdictionSelect(jurisdiction)}
                className={`p-3 rounded-lg border-2 bg-white/40 hover:bg-white/60 transition-all text-left ${
                  isPopularForAsset ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-300/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{jurisdiction.flag}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{jurisdiction.name}</span>
                        {isPopularForAsset && (
                          <span className="px-1.5 py-0.5 bg-green-500 text-white rounded text-[9px] font-bold">
                            POPULAR FOR {formData.assetType?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5">{jurisdiction.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-sm">€{jurisdiction.formation.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-600">Formation</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-300/50">
                  <div className="flex items-center gap-1 text-[11px] text-gray-700">
                    <Clock size={10} />
                    <span>{jurisdiction.duration}</span>
                  </div>
                  <div className="text-[11px] text-gray-700">Tax: {jurisdiction.tax}</div>
                  <div className="text-[11px] text-gray-700">Annual: €{jurisdiction.annual.toLocaleString()}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Modal Step 2: Asset Type Selection (if tokenization is desired)
  const renderModalStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Asset Tokenization</h3>
        <p className="text-sm text-gray-700">Are you planning to tokenize assets under this SPV?</p>
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-3 p-4 bg-white/40 rounded-xl cursor-pointer hover:bg-white/60 transition-all">
          <input
            type="checkbox"
            checked={formData.planningToTokenizeAssets}
            onChange={(e) => updateFormData('planningToTokenizeAssets', e.target.checked)}
            className="w-5 h-5"
          />
          <span className="text-sm font-medium text-gray-900">Yes, I'm planning to tokenize assets</span>
        </label>

        {formData.planningToTokenizeAssets && (
          <div className="space-y-3 pl-4">
            <p className="text-sm font-medium text-gray-900">Select Asset Type:</p>
            <div className="grid grid-cols-2 gap-3">
              {assetTypes.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => updateFormData('assetType', asset.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.assetType === asset.id
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 bg-white/40 hover:bg-white/60 text-gray-900'
                  }`}
                >
                  <div className="text-3xl mb-2">{asset.emoji}</div>
                  <div className="text-sm font-medium">{asset.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Modal Step 3-6: Other form steps (simplified)
  const renderModalStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Company Information</h3>
      <input
        type="text"
        placeholder="Company Name"
        value={formData.companyName}
        onChange={(e) => updateFormData('companyName', e.target.value)}
        className="w-full px-4 py-3 bg-white/40 border border-gray-300/50 rounded-xl"
      />
      <textarea
        placeholder="Business Activity"
        value={formData.businessActivity}
        onChange={(e) => updateFormData('businessActivity', e.target.value)}
        className="w-full px-4 py-3 bg-white/40 border border-gray-300/50 rounded-xl"
        rows="4"
      />
    </div>
  );

  const renderModalStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Directors & Shareholders</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Number of Directors</label>
          <input
            type="number"
            value={formData.numberOfDirectors}
            onChange={(e) => updateFormData('numberOfDirectors', e.target.value)}
            className="w-full px-4 py-3 bg-white/40 border border-gray-300/50 rounded-xl"
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Number of Shareholders</label>
          <input
            type="number"
            value={formData.numberOfShareholders}
            onChange={(e) => updateFormData('numberOfShareholders', e.target.value)}
            className="w-full px-4 py-3 bg-white/40 border border-gray-300/50 rounded-xl"
            min="1"
          />
        </div>
      </div>
    </div>
  );

  const renderModalStep5 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Summary & Costs</h3>
      {formData.jurisdiction && (
        <div className="p-6 bg-gray-900 text-white rounded-xl">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Jurisdiction:</span>
              <span className="font-semibold">{formData.jurisdiction.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Formation Fee:</span>
              <span className="font-semibold">€{formData.jurisdiction.formation.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Annual Fee:</span>
              <span className="font-semibold">€{formData.jurisdiction.annual.toLocaleString()}</span>
            </div>
            {formData.planningToTokenizeAssets && (
              <div className="pt-3 border-t border-gray-700">
                <div className="flex items-center gap-2 text-green-400">
                  <Check size={16} />
                  <span>Asset Tokenization: {formData.assetType}</span>
                </div>
              </div>
            )}
            <div className="pt-3 border-t border-gray-700 flex justify-between text-lg font-bold">
              <span>Total (Year 1):</span>
              <span>€{(formData.jurisdiction.formation + formData.jurisdiction.annual).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

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

  // Main Landing Page with 4 Cards
  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-4 tracking-tighter">
            SPV Formation Services
          </h1>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto font-light">
            Choose your jurisdiction tier and start your SPV formation process. We offer premium, standard, budget, and USA-specific options tailored to your needs.
          </p>
        </div>

        {/* 4 Tier Cards */}
        <div className="grid grid-cols-2 gap-6">
          {tiers.map((tier) => {
            const IconComponent = tier.icon;
            return (
              <button
                key={tier.id}
                onClick={() => handleTierSelect(tier.id)}
                className="relative p-8 rounded-2xl border-2 border-gray-200 bg-white/60 hover:bg-white/80 hover:border-gray-300 hover:shadow-xl transition-all duration-300 text-left group backdrop-blur-sm"
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="px-4 py-1.5 bg-gray-900 text-white rounded-full text-xs font-bold shadow-lg">
                      ⭐ MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <IconComponent size={32} className="text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{tier.priceRange}</div>
                    <div className="text-xs text-gray-600">Formation</div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.label}</h3>
                <p className="text-sm text-gray-600 mb-6">{tier.description}</p>

                <div className="flex flex-wrap gap-2">
                  {tier.features.map((feature) => (
                    <span key={feature} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Learn more</span>
                    <ArrowRight size={20} className="text-gray-900 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
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
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-semibold transition-all"
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
                Thank you for your SPV formation application. Our team will review your submission and contact you within 24 hours.
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

export default SPVFormationFlow;
