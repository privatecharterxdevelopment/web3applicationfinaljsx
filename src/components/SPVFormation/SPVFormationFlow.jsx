import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Upload,
  AlertCircle,
  Sparkles,
  Users,
  MapPin,
  X,
  Loader2,
  Briefcase,
  Globe,
  DollarSign,
  Clock,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { convertToUSD } from '../../services/currencyService';

const SPVFormationFlow = ({ onBack }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState(null);
  const [activeJurisdictionTab, setActiveJurisdictionTab] = useState('premium');
  const [expandedTier, setExpandedTier] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    jurisdiction: '',
    jurisdictionDetails: null,
    companyName: '',
    businessActivity: '',
    companyDescription: '',
    numberOfDirectors: '1',
    numberOfShareholders: '1',
    estimatedAnnualRevenue: '',
    planningToTokenizeAssets: false,
    tokenizeAssetTypes: [],
    preferredLanguage: 'english',
    needsStrategySession: false,
    needsDueDiligence: false,
    needsLegalConsulting: false,
    legalConsultingHours: 0,
    directors: [{
      fullName: '',
      nationality: '',
      residency: '',
      email: '',
      phone: '',
      passportNumber: '',
      passportCopy: null
    }],
    shareholders: [{
      fullName: '',
      nationality: '',
      ownership: '',
      email: '',
      phone: '',
      passportNumber: '',
      passportCopy: null
    }],
    needsNomineeDirector: false,
    needsNomineeShareholder: false,
    needsBankAccountGuarantee: false,
    needsAccounting: false,
    needsSubstancePackage: false,
    needsVATRegistration: false,
    needsExpressService: false,
    businessPlan: null,
    proofOfAddress: null,
    sourceOfFunds: null,
    bankReference: null,
    additionalDocs: [],
    contactEmail: '',
    contactPhone: '',
    preferredContactMethod: 'email',
  });

  const totalSteps = 7;

  const jurisdictions = {
    premium: [
      { name: 'Switzerland', formation: 8500, annual: 4500, tax: '11.9% - 21%', duration: '10-14 days', description: 'AG/GmbH Formation, Registered Office, Nominee Director, Bank Account Intro' },
      { name: 'Singapore', formation: 6500, annual: 3500, tax: '17%', duration: '3-5 days', description: 'Private Limited Company, Local Director, Registered Office' },
      { name: 'Luxembourg', formation: 7500, annual: 4000, tax: '24.94%', duration: '5-7 days', description: 'SARL/SA Formation, Registered Office, Domiciliation' },
      { name: 'Liechtenstein', formation: 8000, annual: 4000, tax: '12.5%', duration: '7-10 days', description: 'AG/Anstalt/Stiftung, Registered Office Vaduz' },
      { name: 'Isle of Man', formation: 6500, annual: 3000, tax: '0%', duration: '3-5 days', description: 'Limited Company, Aircraft/Yacht friendly' },
      { name: 'Jersey', formation: 6000, annual: 3000, tax: '0%', duration: '3-5 days', description: 'Limited Company, Trust Services available' },
      { name: 'Guernsey', formation: 6000, annual: 3000, tax: '0%', duration: '3-5 days', description: 'Limited Company, Protected Cell Company possible' }
    ],
    standard: [
      { name: 'Cayman Islands', formation: 5500, annual: 2800, tax: '0%', duration: '3-5 days', description: 'Exempted Company, Optional Nominees' },
      { name: 'Bermuda', formation: 6000, annual: 3200, tax: '0%', duration: '5-7 days', description: 'Exempted Company, Compliance Services' },
      { name: 'British Virgin Islands', formation: 4500, annual: 2200, tax: '0%', duration: '1-3 days', description: 'Business Company, Optional Nominees' },
      { name: 'Hong Kong', formation: 4000, annual: 2000, tax: '16.5%', duration: '4-7 days', description: 'Private Limited Company' },
      { name: 'Cyprus', formation: 4500, annual: 2500, tax: '12.5%', duration: '7-10 days', description: 'Limited Company, VAT Registration' },
      { name: 'Malta', formation: 5000, annual: 2800, tax: '35%', duration: '5-7 days', description: 'Limited Company, Tax refundable to 5%' },
      { name: 'Gibraltar', formation: 4800, annual: 2400, tax: '10%', duration: '5-7 days', description: 'Limited Company' },
      { name: 'Dubai (UAE)', formation: 5500, annual: 2800, tax: '0% - 9%', duration: '7-14 days', description: 'Free Zone Company, Residence Visa' },
      { name: 'Panama', formation: 4000, annual: 1800, tax: '0%', duration: '3-5 days', description: 'Sociedad Anonima' }
    ],
    budget: [
      { name: 'Seychelles', formation: 3500, annual: 1400, tax: '0%', duration: '1-2 days', description: 'IBC, Optional Nominees' },
      { name: 'Belize', formation: 3800, annual: 1500, tax: '0%', duration: '1-3 days', description: 'IBC, Registered Agent' },
      { name: 'Marshall Islands', formation: 3800, annual: 1600, tax: '0%', duration: '2-5 days', description: 'IBC/LLC' },
      { name: 'St. Vincent', formation: 3000, annual: 1200, tax: '0%', duration: '1-3 days', description: 'IBC' },
      { name: 'Mauritius', formation: 4200, annual: 2000, tax: '15%', duration: '5-7 days', description: 'GBC' },
      { name: 'Labuan', formation: 4000, annual: 2000, tax: '3%', duration: '7-10 days', description: 'Trading/Holding Company' },
      { name: 'St. Kitts & Nevis', formation: 3500, annual: 1500, tax: '0%', duration: '2-5 days', description: 'LLC/IBC' },
      { name: 'Anguilla', formation: 3200, annual: 1300, tax: '0%', duration: '2-4 days', description: 'IBC' },
      { name: 'Vanuatu', formation: 3000, annual: 1200, tax: '0%', duration: '1-2 days', description: 'IBC' }
    ],
    usa: [
      { name: 'Delaware', formation: 3500, annual: 1500, tax: '8.7% + Federal', duration: '1-3 days', description: 'LLC/Corporation, EIN Number' },
      { name: 'Wyoming', formation: 3200, annual: 1300, tax: '0% + Federal', duration: '1-3 days', description: 'LLC, Anonymity Protection' },
      { name: 'Nevada', formation: 3500, annual: 1600, tax: '0% + Federal', duration: '1-3 days', description: 'LLC/Corporation, No State Tax' }
    ]
  };

  const additionalServices = {
    nomineeDirector: { price: 1800, name: 'Nominee Director', period: '/year' },
    nomineeShareholder: { price: 1500, name: 'Nominee Shareholder', period: '/year' },
    bankAccountGuarantee: { price: 2500, name: 'Bank Account Guarantee', period: '' },
    accounting: { price: 2000, name: 'Accounting & Bookkeeping', period: '/year' },
    substancePackage: { price: 5000, name: 'Substance Package', period: '/year' },
    vatRegistration: { price: 1500, name: 'VAT/GST Registration', period: '' },
    expressService: { price: 0, name: 'Express Service (24-48h)', period: '+50%' }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => currentStep < totalSteps && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  const handleTierSelect = (tier) => {
    setSelectedTier(tier);
    setActiveJurisdictionTab(tier);
    nextStep();
  };

  const handleJurisdictionSelect = (jurisdiction) => {
    updateFormData('jurisdiction', jurisdiction.name);
    updateFormData('jurisdictionDetails', jurisdiction);
    nextStep();
  };

  const calculateTotalCost = () => {
    if (!formData.jurisdictionDetails) return { formation: 0, annual: 0, consulting: 0 };

    let formation = formData.jurisdictionDetails.formation;
    let annual = formData.jurisdictionDetails.annual;
    let consulting = 0;

    if (formData.needsNomineeDirector) annual += 1800;
    if (formData.needsNomineeShareholder) annual += 1500;
    if (formData.needsBankAccountGuarantee) formation += 2500;
    if (formData.needsAccounting) annual += 2000;
    if (formData.needsSubstancePackage) annual += 5000;
    if (formData.needsVATRegistration) formation += 1500;
    if (formData.needsExpressService) formation = formation * 1.5;

    if (formData.needsStrategySession) consulting += 1490;
    if (formData.needsDueDiligence) consulting += 490;
    if (formData.needsLegalConsulting && formData.legalConsultingHours > 0) {
      consulting += formData.legalConsultingHours * 380;
    }

    return { formation, annual, consulting };
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      const costs = calculateTotalCost();
      const requestData = {
        ...formData,
        selectedTier,
        totalFormationCost: costs.formation,
        totalAnnualCost: costs.annual,
        totalConsultingCost: costs.consulting,
        submittedAt: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_requests')
        .insert([{
          user_id: user.id,
          type: 'spv_formation',
          data: requestData,
          status: 'pending'
        }]);

      if (error) throw error;
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting SPV formation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tiers = [
    { id: 'premium', label: 'Premium', flag: '🇨🇭', countries: ['Switzerland', 'Singapore', 'Luxembourg'], price: '$6,500 - $9,200', duration: '2-4 weeks', tax: 'Low corporate tax (8-17%)' },
    { id: 'standard', label: 'Standard', flag: '🇰🇾', countries: ['Cayman', 'BVI', 'Dubai', 'Hong Kong'], price: '$4,300 - $6,500', duration: '1-3 weeks', tax: '0% corporate tax', popular: true },
    { id: 'budget', label: 'Budget', flag: '🇸🇨', countries: ['Seychelles', 'Belize', 'Nevis'], price: '$3,300 - $4,600', duration: '1-5 days', tax: '0% tax, max privacy' },
    { id: 'usa', label: 'USA', flag: '🇺🇸', countries: ['Delaware', 'Wyoming', 'Nevada'], price: '$3,500 - $3,800', duration: '1-2 weeks', tax: 'US market access' }
  ];

  // Step 1: Tier Selection
  const renderStep1 = () => (
    <div className="px-6 py-4">
      <div className="space-y-2">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`bg-white border rounded-xl overflow-hidden transition-all ${
              tier.popular ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            {/* Main Row */}
            <div className="px-4 py-3 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedTier(expandedTier === tier.id ? null : tier.id)}>
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                {tier.flag}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{tier.label}</p>
                  {tier.popular && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500 text-white rounded">POPULAR</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{tier.countries.join(', ')}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">{tier.price}</p>
                <p className="text-[10px] text-gray-400">{tier.duration}</p>
              </div>

              <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedTier === tier.id ? 'rotate-180' : ''}`} />
            </div>

            {/* Expanded Details */}
            {expandedTier === tier.id && (
              <div className="px-4 pb-4 pt-2 border-t border-gray-50">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Duration</p>
                    <p className="text-xs font-medium text-gray-900">{tier.duration}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tax</p>
                    <p className="text-xs font-medium text-gray-900">{tier.tax}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Options</p>
                    <p className="text-xs font-medium text-gray-900">{jurisdictions[tier.id]?.length} countries</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleTierSelect(tier.id); }}
                  className="w-full py-2.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Select {tier.label} Tier
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Step 2: Jurisdiction Selection
  const renderStep2 = () => {
    const tierJurisdictions = jurisdictions[activeJurisdictionTab] || [];
    const tierLabels = { premium: 'Premium', standard: 'Standard', budget: 'Budget', usa: 'USA' };

    return (
      <div className="px-6 py-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4">
          {Object.keys(tierLabels).map(key => (
            <button
              key={key}
              onClick={() => setActiveJurisdictionTab(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeJurisdictionTab === key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {tierLabels[key]}
            </button>
          ))}
        </div>

        {/* Jurisdictions List */}
        <div className="space-y-2">
          {tierJurisdictions.map((j) => (
            <div
              key={j.name}
              onClick={() => handleJurisdictionSelect(j)}
              className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:border-gray-200 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{j.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">${Math.round(convertToUSD(j.formation, 'EUR')).toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{j.description}</p>
              <div className="flex items-center gap-4 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><Clock size={10} /> {j.duration}</span>
                <span className="flex items-center gap-1"><DollarSign size={10} /> {j.tax} tax</span>
                <span>${Math.round(convertToUSD(j.annual, 'EUR')).toLocaleString()}/year</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Step 3: Company Information
  const renderStep3 = () => (
    <div className="px-6 py-4 space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Company Name *</label>
        <input
          type="text"
          value={formData.companyName}
          onChange={(e) => updateFormData('companyName', e.target.value)}
          placeholder="e.g., Global Investment Holdings Ltd."
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Business Activity *</label>
        <select
          value={formData.businessActivity}
          onChange={(e) => updateFormData('businessActivity', e.target.value)}
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          <option value="">Select activity</option>
          <option value="holding">Holding Company</option>
          <option value="investment">Investment Management</option>
          <option value="real-estate">Real Estate Holding</option>
          <option value="trading">International Trading</option>
          <option value="consulting">Consulting Services</option>
          <option value="crypto">Cryptocurrency/Blockchain</option>
          <option value="fintech">Fintech Services</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Business Description *</label>
        <textarea
          value={formData.companyDescription}
          onChange={(e) => updateFormData('companyDescription', e.target.value)}
          placeholder="Describe the purpose and activities..."
          rows={3}
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Directors</label>
          <select
            value={formData.numberOfDirectors}
            onChange={(e) => updateFormData('numberOfDirectors', e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4+</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Shareholders</label>
          <select
            value={formData.numberOfShareholders}
            onChange={(e) => updateFormData('numberOfShareholders', e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4+</option>
          </select>
        </div>
      </div>

      {/* Tokenization Plans */}
      <div className="bg-gray-50 rounded-xl p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.planningToTokenizeAssets}
            onChange={(e) => updateFormData('planningToTokenizeAssets', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">Planning to tokenize assets</p>
            <p className="text-xs text-gray-500">We'll prepare the necessary legal structure</p>
          </div>
        </label>
      </div>
    </div>
  );

  // Step 4: Director & Shareholder Information
  const renderStep4 = () => (
    <div className="px-6 py-4 space-y-4">
      {/* Director #1 */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-900">Director #1</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input type="text" placeholder="Full Name *" className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200" />
          <input type="text" placeholder="Nationality *" className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200" />
          <input type="text" placeholder="Country of Residence *" className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200" />
          <input type="text" placeholder="Passport Number *" className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200" />
          <input type="email" placeholder="Email *" className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200" />
          <input type="tel" placeholder="Phone *" className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200" />
        </div>
        <div className="mt-3 border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors">
          <Upload size={18} className="text-gray-400 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Upload Passport Copy (PDF, JPG)</p>
        </div>
      </div>

      {/* Shareholder #1 */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-900">Shareholder #1</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input type="text" placeholder="Full Name *" className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200" />
          <input type="number" placeholder="Ownership % *" className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200" />
          <input type="text" placeholder="Nationality *" className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200" />
          <input type="text" placeholder="Passport Number *" className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200" />
          <input type="email" placeholder="Email *" className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200" />
          <input type="tel" placeholder="Phone *" className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200" />
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-3">
        <p className="text-xs text-blue-700">All directors and shareholders (UBOs with 25%+ ownership) must provide certified passport copies and KYC documentation.</p>
      </div>
    </div>
  );

  // Step 5: Additional Services
  const renderStep5 = () => {
    const costs = calculateTotalCost();
    const services = [
      { key: 'needsNomineeDirector', label: 'Nominee Director', price: '$2,000/year', desc: 'Professional nominee for privacy' },
      { key: 'needsNomineeShareholder', label: 'Nominee Shareholder', price: '$1,650/year', desc: 'Confidential ownership' },
      { key: 'needsBankAccountGuarantee', label: 'Bank Account Guarantee', price: '$2,700', desc: 'Guaranteed opening within 30 days' },
      { key: 'needsAccounting', label: 'Accounting & Bookkeeping', price: '$2,200/year', desc: 'Full financial statements' },
      { key: 'needsSubstancePackage', label: 'Substance Package', price: '$5,400/year', desc: 'Physical office, local employees' },
      { key: 'needsVATRegistration', label: 'VAT/GST Registration', price: '$1,650', desc: 'For eligible jurisdictions' },
      { key: 'needsExpressService', label: 'Express Service (24-48h)', price: '+50%', desc: 'Priority processing' }
    ];

    return (
      <div className="px-6 py-4 space-y-3">
        {services.map(s => (
          <label key={s.key} className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-gray-200 transition-all">
            <input
              type="checkbox"
              checked={formData[s.key]}
              onChange={(e) => updateFormData(s.key, e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{s.label}</span>
                <span className="text-sm font-semibold text-gray-900">{s.price}</span>
              </div>
              <p className="text-xs text-gray-500">{s.desc}</p>
            </div>
          </label>
        ))}

        {/* Cost Summary */}
        <div className="bg-gray-900 text-white rounded-xl p-4 mt-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-3">Cost Summary</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Formation</span><span>${Math.round(convertToUSD(costs.formation, 'EUR')).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Annual (Year 1)</span><span>${Math.round(convertToUSD(costs.annual, 'EUR')).toLocaleString()}</span></div>
            <div className="flex justify-between pt-2 border-t border-gray-700 font-semibold">
              <span>Total</span>
              <span>${Math.round(convertToUSD(costs.formation + costs.annual, 'EUR')).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Step 6: Documents Upload
  const renderStep6 = () => {
    const docs = [
      { label: 'Business Plan or Project Description *', hint: 'PDF, DOCX (max 10MB)' },
      { label: 'Proof of Address *', hint: 'Utility bill, bank statement (not older than 3 months)' },
      { label: 'Source of Funds Declaration *', hint: 'Bank statements, investment docs' },
      { label: 'Bank Reference Letter (Optional)', hint: 'On bank letterhead' }
    ];

    return (
      <div className="px-6 py-4 space-y-3">
        {docs.map((doc, i) => (
          <div key={i} className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:bg-gray-50 transition-colors">
            <Upload size={20} className="text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">{doc.label}</p>
            <p className="text-xs text-gray-500">{doc.hint}</p>
          </div>
        ))}

        <div className="bg-amber-50 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">All documents must be in English or with certified translations. Passport copies must be notarized.</p>
        </div>
      </div>
    );
  };

  // Step 7: Review & Submit
  const renderStep7 = () => {
    const costs = calculateTotalCost();

    return (
      <div className="px-6 py-4 space-y-4">
        {/* Jurisdiction */}
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-900">Jurisdiction</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Country:</span> <span className="font-medium text-gray-900">{formData.jurisdiction}</span></div>
            <div><span className="text-gray-500">Tax:</span> <span className="font-medium text-gray-900">{formData.jurisdictionDetails?.tax}</span></div>
            <div><span className="text-gray-500">Duration:</span> <span className="font-medium text-gray-900">{formData.jurisdictionDetails?.duration}</span></div>
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-900">Company Details</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900">{formData.companyName || '-'}</span></div>
            <div><span className="text-gray-500">Activity:</span> <span className="font-medium text-gray-900 capitalize">{formData.businessActivity?.replace('-', ' ') || '-'}</span></div>
            <div><span className="text-gray-500">Directors:</span> <span className="font-medium text-gray-900">{formData.numberOfDirectors}</span></div>
            <div><span className="text-gray-500">Shareholders:</span> <span className="font-medium text-gray-900">{formData.numberOfShareholders}</span></div>
          </div>
        </div>

        {/* Selected Services */}
        {(formData.needsNomineeDirector || formData.needsNomineeShareholder || formData.needsBankAccountGuarantee ||
          formData.needsAccounting || formData.needsSubstancePackage || formData.needsVATRegistration || formData.needsExpressService) && (
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Additional Services</span>
            </div>
            <div className="space-y-1.5">
              {formData.needsNomineeDirector && <div className="flex items-center gap-2 text-sm text-gray-700"><CheckCircle2 size={14} className="text-emerald-500" /> Nominee Director</div>}
              {formData.needsNomineeShareholder && <div className="flex items-center gap-2 text-sm text-gray-700"><CheckCircle2 size={14} className="text-emerald-500" /> Nominee Shareholder</div>}
              {formData.needsBankAccountGuarantee && <div className="flex items-center gap-2 text-sm text-gray-700"><CheckCircle2 size={14} className="text-emerald-500" /> Bank Account Guarantee</div>}
              {formData.needsAccounting && <div className="flex items-center gap-2 text-sm text-gray-700"><CheckCircle2 size={14} className="text-emerald-500" /> Accounting & Bookkeeping</div>}
              {formData.needsSubstancePackage && <div className="flex items-center gap-2 text-sm text-gray-700"><CheckCircle2 size={14} className="text-emerald-500" /> Substance Package</div>}
              {formData.needsVATRegistration && <div className="flex items-center gap-2 text-sm text-gray-700"><CheckCircle2 size={14} className="text-emerald-500" /> VAT/GST Registration</div>}
              {formData.needsExpressService && <div className="flex items-center gap-2 text-sm text-gray-700"><CheckCircle2 size={14} className="text-emerald-500" /> Express Service</div>}
            </div>
          </div>
        )}

        {/* Total Cost */}
        <div className="bg-gray-900 text-white rounded-xl p-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-3">Total Investment</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Formation Fees</span><span>${Math.round(convertToUSD(costs.formation, 'EUR')).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Annual Fees (Year 1)</span><span>${Math.round(convertToUSD(costs.annual, 'EUR')).toLocaleString()}</span></div>
            <div className="flex justify-between pt-3 border-t border-gray-700 text-lg font-semibold">
              <span>Grand Total</span>
              <span>${Math.round(convertToUSD(costs.formation + costs.annual, 'EUR')).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-3">
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => updateFormData('contactEmail', e.target.value)}
            placeholder="Your Email *"
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <input
            type="tel"
            value={formData.contactPhone}
            onChange={(e) => updateFormData('contactPhone', e.target.value)}
            placeholder="Your Phone *"
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        <p className="text-xs text-gray-500 text-center">
          By submitting, you confirm all information is accurate. We'll contact you within 24 hours.
        </p>
      </div>
    );
  };

  // Success Modal
  const renderSuccessModal = () => {
    if (!showSuccessModal) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSuccessModal(false)}>
        <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Submitted!</h3>
          <p className="text-sm text-gray-500 mb-5">
            Our team will review your submission and contact you within 24 hours.
          </p>
          <button
            onClick={() => { setShowSuccessModal(false); onBack(); }}
            className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  };

  const stepTitles = ['Select Tier', 'Choose Jurisdiction', 'Company Info', 'Directors & Shareholders', 'Additional Services', 'Upload Documents', 'Review & Submit'];

  return (
    <div className="h-full overflow-y-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">SPV Formation</h1>
            <p className="text-xs text-gray-400 mt-0.5">Step {currentStep} of {totalSteps} - {stepTitles[currentStep - 1]}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-gray-900 h-1.5 rounded-full transition-all" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
          </div>
        </div>

        {/* Stats */}
        {formData.jurisdictionDetails && (
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div>
              <span className="text-gray-400">Jurisdiction</span>
              <span className="ml-2 font-medium text-gray-900">{formData.jurisdiction}</span>
            </div>
            <div>
              <span className="text-gray-400">Formation</span>
              <span className="ml-2 font-medium text-gray-900">${Math.round(convertToUSD(formData.jurisdictionDetails.formation, 'EUR')).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Step Content */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}
      {currentStep === 5 && renderStep5()}
      {currentStep === 6 && renderStep6()}
      {currentStep === 7 && renderStep7()}

      {/* Navigation */}
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={16} />
          Previous
        </button>

        {currentStep < totalSteps ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Next
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <><Loader2 size={16} className="animate-spin" /> Submitting...</>
            ) : (
              <><Check size={16} /> Submit Application</>
            )}
          </button>
        )}
      </div>

      {renderSuccessModal()}
    </div>
  );
};

export default SPVFormationFlow;
