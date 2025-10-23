import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Shield,
  Building2,
  Upload,
  FileText,
  AlertCircle,
  Sparkles,
  Lock,
  Users,
  MapPin,
  Search,
  X,
  Info,
  Loader2,
  Briefcase,
  Globe,
  DollarSign,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const SPVFormationFlow = ({ onBack }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1); // Steps inside modal
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState(null); // 'premium', 'standard', 'budget', 'usa'
  const [activeJurisdictionTab, setActiveJurisdictionTab] = useState('premium');
  const [showJurisdictionPopup, setShowJurisdictionPopup] = useState(false);
  const [expandedTier, setExpandedTier] = useState(null);
  const [jurisdictionSearch, setJurisdictionSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Step 2: Jurisdiction Selection
    jurisdiction: '',
    jurisdictionDetails: null,

    // Step 3: Company Information
    companyName: '',
    businessActivity: '',
    companyDescription: '',
    numberOfDirectors: '1',
    numberOfShareholders: '1',
    estimatedAnnualRevenue: '',

    // Tokenization Plans
    planningToTokenizeAssets: false,
    tokenizeAssetTypes: [], // ['jet', 'helicopter', 'evtol', 'yacht', 'multiple']
    preferredLanguage: 'english', // 'english', 'german', 'french', 'spanish', 'italian'

    // Consulting Services
    needsStrategySession: false,
    needsDueDiligence: false,
    needsLegalConsulting: false,
    legalConsultingHours: 0,

    // Step 4: Director/Shareholder Information
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

    // Step 5: Additional Services
    needsNomineeDirector: false,
    needsNomineeShareholder: false,
    needsBankAccountGuarantee: false,
    needsAccounting: false,
    needsSubstancePackage: false,
    needsVATRegistration: false,
    needsExpressService: false,

    // Step 6: Documents Upload
    businessPlan: null,
    proofOfAddress: null,
    sourceOfFunds: null,
    bankReference: null,
    additionalDocs: [],

    // Contact Information
    contactEmail: '',
    contactPhone: '',
    preferredContactMethod: 'email',
  });

  const totalSteps = 7; // Tier → Jurisdiction → Company Info → People → Services → Documents → Review

  const jurisdictions = {
    premium: [
      {
        name: 'Switzerland',
        formation: 8500,
        annual: 4500,
        tax: '11.9% - 21%',
        duration: '10-14 days',
        description: 'AG/GmbH Formation, Registered Office Zürich/Zug, Nominee Director, Bank Account Intro, Substance Package'
      },
      {
        name: 'Singapore',
        formation: 6500,
        annual: 3500,
        tax: '17%',
        duration: '3-5 days',
        description: 'Private Limited Company, Local Director, Registered Office, Corporate Secretary, Bank Intro'
      },
      {
        name: 'Luxembourg',
        formation: 7500,
        annual: 4000,
        tax: '24.94%',
        duration: '5-7 days',
        description: 'SARL/SA Formation, Registered Office, Domiciliation, VAT Registration optional'
      },
      {
        name: 'Liechtenstein',
        formation: 8000,
        annual: 4000,
        tax: '12.5%',
        duration: '7-10 days',
        description: 'AG/Anstalt/Stiftung, Registered Office Vaduz, Treuhänder Service'
      },
      {
        name: 'Isle of Man',
        formation: 6500,
        annual: 3000,
        tax: '0% (non-resident)',
        duration: '3-5 days',
        description: 'Limited Company, Registered Office, Optional Nominees, Aircraft/Yacht friendly'
      },
      {
        name: 'Jersey',
        formation: 6000,
        annual: 3000,
        tax: '0% (non-resident)',
        duration: '3-5 days',
        description: 'Limited Company, Registered Office, Company Secretary, Trust Services available'
      },
      {
        name: 'Guernsey',
        formation: 6000,
        annual: 3000,
        tax: '0% (non-resident)',
        duration: '3-5 days',
        description: 'Limited Company, Protected Cell Company possible, Registered Office'
      }
    ],
    standard: [
      {
        name: 'Cayman Islands',
        formation: 5500,
        annual: 2800,
        tax: '0%',
        duration: '3-5 days',
        description: 'Exempted Company, Registered Office, Optional Nominees, BOSS Register Filing'
      },
      {
        name: 'Bermuda',
        formation: 6000,
        annual: 3200,
        tax: '0%',
        duration: '5-7 days',
        description: 'Exempted Company, Registered Office, Compliance Services'
      },
      {
        name: 'British Virgin Islands',
        formation: 4500,
        annual: 2200,
        tax: '0%',
        duration: '1-3 days',
        description: 'Business Company, Registered Office & Agent, Optional Nominees'
      },
      {
        name: 'Hong Kong',
        formation: 4000,
        annual: 2000,
        tax: '16.5% (local income)',
        duration: '4-7 days',
        description: 'Private Limited Company, Company Secretary, Registered Office, Business Registration'
      },
      {
        name: 'Cyprus',
        formation: 4500,
        annual: 2500,
        tax: '12.5%',
        duration: '7-10 days',
        description: 'Limited Company, Registered Office, Company Secretary, VAT Registration possible'
      },
      {
        name: 'Malta',
        formation: 5000,
        annual: 2800,
        tax: '35% (refundable to 5%)',
        duration: '5-7 days',
        description: 'Limited Company, Registered Office, VAT Registration, Company Secretary'
      },
      {
        name: 'Gibraltar',
        formation: 4800,
        annual: 2400,
        tax: '10%',
        duration: '5-7 days',
        description: 'Limited Company, Registered Office, Company Secretary'
      },
      {
        name: 'Dubai (UAE)',
        formation: 5500,
        annual: 2800,
        tax: '0% - 9%',
        duration: '7-14 days',
        description: 'Free Zone Company, Flexi Desk, Residence Visa possible, VAT Registration'
      },
      {
        name: 'Panama',
        formation: 4000,
        annual: 1800,
        tax: '0% (territorial)',
        duration: '3-5 days',
        description: 'Sociedad Anonima, Registered Agent, Bearer Shares possible, Directors & Shareholders'
      }
    ],
    budget: [
      {
        name: 'Seychelles',
        formation: 3500,
        annual: 1400,
        tax: '0%',
        duration: '1-2 days',
        description: 'IBC, Registered Office & Agent, Optional Nominees'
      },
      {
        name: 'Belize',
        formation: 3800,
        annual: 1500,
        tax: '0%',
        duration: '1-3 days',
        description: 'IBC, Registered Agent & Office, Optional Nominees'
      },
      {
        name: 'Marshall Islands',
        formation: 3800,
        annual: 1600,
        tax: '0%',
        duration: '2-5 days',
        description: 'IBC/LLC, Registered Agent, Non-Resident Domestic Corp possible'
      },
      {
        name: 'St. Vincent & Grenadines',
        formation: 3000,
        annual: 1200,
        tax: '0%',
        duration: '1-3 days',
        description: 'IBC, Registered Agent & Office'
      },
      {
        name: 'Mauritius',
        formation: 4200,
        annual: 2000,
        tax: '15%',
        duration: '5-7 days',
        description: 'GBC, Registered Office, Company Secretary, Compliance Officer'
      },
      {
        name: 'Labuan (Malaysia)',
        formation: 4000,
        annual: 2000,
        tax: '3% or flat',
        duration: '7-10 days',
        description: 'Trading/Holding Company, Registered Office, Annual Compliance'
      },
      {
        name: 'St. Kitts & Nevis',
        formation: 3500,
        annual: 1500,
        tax: '0%',
        duration: '2-5 days',
        description: 'LLC/IBC, Registered Agent, Nevis particularly strong for asset protection'
      },
      {
        name: 'Anguilla',
        formation: 3200,
        annual: 1300,
        tax: '0%',
        duration: '2-4 days',
        description: 'IBC, Registered Agent & Office'
      },
      {
        name: 'Dominica',
        formation: 3000,
        annual: 1200,
        tax: '0%',
        duration: '2-4 days',
        description: 'IBC, Registered Agent & Office'
      },
      {
        name: 'Vanuatu',
        formation: 3000,
        annual: 1200,
        tax: '0%',
        duration: '1-2 days',
        description: 'IBC, Registered Agent, Citizenship by Investment available'
      }
    ],
    usa: [
      {
        name: 'Delaware',
        formation: 3500,
        annual: 1500,
        tax: '8.7% State + Federal',
        duration: '1-3 days',
        description: 'LLC/Corporation, Registered Agent, EIN Number'
      },
      {
        name: 'Wyoming',
        formation: 3200,
        annual: 1300,
        tax: '0% State + Federal',
        duration: '1-3 days',
        description: 'LLC, Registered Agent, Anonymity Protection'
      },
      {
        name: 'Nevada',
        formation: 3500,
        annual: 1600,
        tax: '0% State + Federal',
        duration: '1-3 days',
        description: 'LLC/Corporation, Registered Agent, No State Tax'
      }
    ]
  };

  const additionalServices = {
    nomineeDirector: { price: 1800, name: 'Nominee Director', period: '/year' },
    nomineeShareholder: { price: 1500, name: 'Nominee Shareholder', period: '/year' },
    bankAccountGuarantee: { price: 2500, name: 'Bank Account Guarantee', period: 'one-time' },
    accounting: { price: 2000, name: 'Accounting & Bookkeeping', period: '/year' },
    substancePackage: { price: 5000, name: 'Substance Package', period: '/year' },
    vatRegistration: { price: 1500, name: 'VAT/GST Registration', period: 'one-time' },
    expressService: { price: 0, name: 'Express Service (24-48h)', period: '+50% of formation fee' }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTierSelect = (tier) => {
    setSelectedTier(tier);
    setActiveJurisdictionTab(tier);
    nextStep();
  };

  const handleJurisdictionSelect = (jurisdiction) => {
    updateFormData('jurisdiction', jurisdiction.name);
    updateFormData('jurisdictionDetails', jurisdiction);
    setShowJurisdictionPopup(false);
    nextStep();
  };

  const calculateTotalCost = () => {
    if (!formData.jurisdictionDetails) return { formation: 0, annual: 0, consulting: 0 };

    let formation = formData.jurisdictionDetails.formation;
    let annual = formData.jurisdictionDetails.annual;
    let consulting = 0;

    if (formData.needsNomineeDirector) annual += additionalServices.nomineeDirector.price;
    if (formData.needsNomineeShareholder) annual += additionalServices.nomineeShareholder.price;
    if (formData.needsBankAccountGuarantee) formation += additionalServices.bankAccountGuarantee.price;
    if (formData.needsAccounting) annual += additionalServices.accounting.price;
    if (formData.needsSubstancePackage) annual += additionalServices.substancePackage.price;
    if (formData.needsVATRegistration) formation += additionalServices.vatRegistration.price;
    if (formData.needsExpressService) formation = formation * 1.5;

    // Consulting Services
    if (formData.needsStrategySession) consulting += 1490;
    if (formData.needsDueDiligence) consulting += 490;
    if (formData.needsLegalConsulting && formData.legalConsultingHours > 0) {
      consulting += formData.legalConsultingHours * 380;
    }

    return { formation, annual, consulting };
  };

  // Step 1: Tier Selection
  const renderStep1 = () => {
    const tiers = [
      {
        id: 'premium',
        label: 'Premium',
        flag: '🇨🇭',
        countries: ['Switzerland', 'Singapore', 'Luxembourg', 'Liechtenstein'],
        price: '€6,000 - €8,500',
        duration: '2-4 weeks',
        taxBenefits: 'Low corporate tax (8-17%), excellent reputation, full banking access',
        description: 'Top-tier jurisdictions ideal for institutional investors and regulated businesses'
      },
      {
        id: 'standard',
        label: 'Standard',
        flag: '🇰🇾',
        countries: ['Cayman Islands', 'British Virgin Islands', 'Dubai (UAE)', 'Hong Kong', 'Malta'],
        price: '€4,000 - €6,000',
        duration: '1-3 weeks',
        taxBenefits: '0% corporate tax (Cayman, BVI, Dubai), strong privacy, good banking access',
        description: 'Well-established offshore centers with zero or low tax',
        popular: true
      },
      {
        id: 'budget',
        label: 'Budget',
        flag: '🇸🇨',
        countries: ['Seychelles', 'Belize', 'Nevis', 'Vanuatu', 'Marshall Islands'],
        price: '€3,000 - €4,200',
        duration: '1-5 days',
        taxBenefits: '0% corporate tax, minimal reporting, maximum privacy protection',
        description: 'Cost-effective offshore jurisdictions with fast formation'
      },
      {
        id: 'usa',
        label: 'USA',
        flag: '🇺🇸',
        countries: ['Delaware', 'Wyoming', 'Nevada'],
        price: '€3,200 - €3,500',
        duration: '1-2 weeks',
        taxBenefits: 'US market access, strong legal framework, credibility with investors',
        description: 'US-based formation for businesses operating in United States'
      }
    ];

    return (
      <div className="py-8 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Choose SPV Formation Tier</h2>
            <p className="text-sm text-gray-700">Select the jurisdiction tier that fits your business needs</p>
          </div>

          <style>{`
            @keyframes borderBlink {
              0%, 100% { border-color: rgb(34, 197, 94); box-shadow: 0 0 15px rgba(34, 197, 94, 0.4); }
              50% { border-color: rgb(134, 239, 172); box-shadow: 0 0 25px rgba(34, 197, 94, 0.6); }
            }
            .popular-tier-row {
              animation: borderBlink 2s ease-in-out infinite;
            }
          `}</style>

          <div className="space-y-4 mb-8">
            {tiers.map((tier, index) => (
              <div
                key={tier.id}
                className={`bg-white/30 rounded-xl border backdrop-blur-xl overflow-hidden ${
                  tier.popular ? 'popular-tier-row border-2' : 'border-gray-300/50'
                }`}
              >
                {/* Main Row */}
                <div className="flex items-center justify-between p-6 hover:bg-white/40 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-5xl">{tier.flag}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-lg">{tier.label}</span>
                        {tier.popular && (
                          <span className="px-2 py-0.5 bg-green-500 text-white rounded text-[10px] font-bold">
                            POPULAR
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{tier.countries.join(', ')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-bold text-gray-900 text-lg">{tier.price}</div>
                      <div className="text-xs text-gray-600">Formation</div>
                    </div>

                    <button
                      onClick={() => setExpandedTier(expandedTier === tier.id ? null : tier.id)}
                      className="p-2 hover:bg-white/60 rounded-lg transition-all"
                    >
                      {expandedTier === tier.id ? (
                        <ChevronUp size={20} className="text-gray-900" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-900" />
                      )}
                    </button>

                    <button
                      onClick={() => handleTierSelect(tier.id)}
                      className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium transition-all"
                    >
                      Select
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedTier === tier.id && (
                  <div className="border-t border-gray-300/50 bg-white/20 p-6">
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin size={16} className="text-gray-900" />
                          <span className="text-xs font-semibold text-gray-900 uppercase">Jurisdictions</span>
                        </div>
                        <ul className="space-y-1">
                          {tier.countries.map((country) => (
                            <li key={country} className="text-sm text-gray-700 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div>
                              {country}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock size={16} className="text-gray-900" />
                          <span className="text-xs font-semibold text-gray-900 uppercase">Formation Duration</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-4">{tier.duration}</p>

                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign size={16} className="text-gray-900" />
                          <span className="text-xs font-semibold text-gray-900 uppercase">Tax Benefits</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{tier.taxBenefits}</p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Info size={16} className="text-gray-900" />
                          <span className="text-xs font-semibold text-gray-900 uppercase">Description</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{tier.description}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-300/50">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 bg-white/40 hover:bg-white/50 rounded-xl text-sm font-medium text-gray-900 transition-all"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
            <div></div>
          </div>
        </div>
      </div>
    );
  };

  // Step 2: Jurisdiction Selection
  const renderStep2 = () => {
    const tierJurisdictions = jurisdictions[activeJurisdictionTab] || [];

    const tierInfo = {
      premium: { label: 'Premium', color: 'amber', badge: 'bg-amber-100 text-amber-900' },
      standard: { label: 'Standard', color: 'blue', badge: 'bg-blue-100 text-blue-900' },
      budget: { label: 'Budget', color: 'green', badge: 'bg-green-100 text-green-900' },
      usa: { label: 'USA', color: 'red', badge: 'bg-red-100 text-red-900' }
    };

    return (
      <div className="flex-1 overflow-y-auto py-8 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Select Jurisdiction</h2>
            <p className="text-sm text-gray-700">Choose the specific country for your SPV formation</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-300/50">
            {Object.entries(tierInfo).map(([key, info]) => (
              <button
                key={key}
                onClick={() => setActiveJurisdictionTab(key)}
                className={`px-4 py-3 text-sm font-medium transition-all relative ${
                  activeJurisdictionTab === key
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{info.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${info.badge}`}>
                    {jurisdictions[key].length}
                  </span>
                </div>
                {activeJurisdictionTab === key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
                )}
              </button>
            ))}
          </div>

          {/* Table View */}
          <div className="bg-white/30 rounded-xl border border-gray-300/50 overflow-hidden backdrop-blur-xl">
            <table className="w-full">
              <thead className="bg-gray-900 text-white">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase">Country</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase">Formation</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase">Annual</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase">Tax Rate</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase">Duration</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {tierJurisdictions.map((jurisdiction, index) => (
                  <tr
                    key={jurisdiction.name}
                    className={`border-t border-gray-300/30 hover:bg-white/40 transition-colors ${
                      index % 2 === 0 ? 'bg-white/10' : 'bg-white/5'
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-gray-600" />
                          <span className="font-semibold text-gray-900">{jurisdiction.name}</span>
                        </div>
                        <p className="text-xs text-gray-700 mt-1 leading-relaxed">{jurisdiction.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-gray-900">€{jurisdiction.formation.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-gray-900">€{jurisdiction.annual.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-900">
                        {jurisdiction.tax}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm text-gray-700">{jurisdiction.duration}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleJurisdictionSelect(jurisdiction)}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-all"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-300/50 mt-8">
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-6 py-3 bg-white/40 hover:bg-white/50 rounded-xl text-sm font-medium text-gray-900 transition-all"
            >
              <ArrowLeft size={18} />
              Previous
            </button>
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-semibold transition-all"
            >
              Next
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Step 3: Company Information
  const renderStep3 = () => (
    <div className="flex-1 overflow-y-auto py-8 px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Company Information</h2>
          <p className="text-sm text-gray-700">Provide details about the SPV you want to form</p>
        </div>

        <div className="space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Proposed Company Name *</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => updateFormData('companyName', e.target.value)}
              placeholder="e.g., Global Investment Holdings Ltd."
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
            />
            <p className="mt-1 text-xs text-gray-600">We'll check name availability</p>
          </div>

          {/* Business Activity */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Primary Business Activity *</label>
            <select
              value={formData.businessActivity}
              onChange={(e) => updateFormData('businessActivity', e.target.value)}
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
            >
              <option value="">Select activity</option>
              <option value="holding">Holding Company</option>
              <option value="investment">Investment Management</option>
              <option value="real-estate">Real Estate Holding</option>
              <option value="trading">International Trading</option>
              <option value="consulting">Consulting Services</option>
              <option value="intellectual-property">Intellectual Property</option>
              <option value="crypto">Cryptocurrency/Blockchain</option>
              <option value="fintech">Fintech Services</option>
              <option value="e-commerce">E-Commerce</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Business Description *</label>
            <textarea
              value={formData.companyDescription}
              onChange={(e) => updateFormData('companyDescription', e.target.value)}
              placeholder="Describe the purpose and activities of the SPV..."
              rows={5}
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl resize-none"
            />
          </div>

          {/* Number of Directors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Number of Directors *</label>
              <select
                value={formData.numberOfDirectors}
                onChange={(e) => updateFormData('numberOfDirectors', e.target.value)}
                className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
              >
                <option value="1">1 Director</option>
                <option value="2">2 Directors</option>
                <option value="3">3 Directors</option>
                <option value="4">4+ Directors</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Number of Shareholders *</label>
              <select
                value={formData.numberOfShareholders}
                onChange={(e) => updateFormData('numberOfShareholders', e.target.value)}
                className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
              >
                <option value="1">1 Shareholder</option>
                <option value="2">2 Shareholders</option>
                <option value="3">3 Shareholders</option>
                <option value="4">4+ Shareholders</option>
              </select>
            </div>
          </div>

          {/* Estimated Annual Revenue */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Estimated Annual Revenue (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 font-medium">$</span>
              <input
                type="number"
                value={formData.estimatedAnnualRevenue}
                onChange={(e) => updateFormData('estimatedAnnualRevenue', e.target.value)}
                placeholder="1000000"
                className="w-full pl-8 pr-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
              />
            </div>
          </div>

          {/* Tokenization Plans */}
          <div className="p-6 bg-blue-50/50 rounded-xl border border-blue-200/50">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Tokenization Plans</h3>

            <label className="flex items-start gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={formData.planningToTokenizeAssets}
                onChange={(e) => updateFormData('planningToTokenizeAssets', e.target.checked)}
                className="mt-1 w-5 h-5"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">I'm planning to tokenize assets under this SPV</p>
                <p className="text-xs text-gray-600 mt-1">This helps us prepare the necessary legal structure for asset tokenization</p>
              </div>
            </label>

            {formData.planningToTokenizeAssets && (
              <div className="space-y-4 mt-4 pt-4 border-t border-blue-200/50">
                {/* Asset Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Asset Types to Tokenize</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'jet', label: 'Private Jets' },
                      { id: 'helicopter', label: 'Helicopters' },
                      { id: 'evtol', label: 'eVTOL' },
                      { id: 'yacht', label: 'Yachts' },
                      { id: 'real-estate', label: 'Real Estate' },
                      { id: 'multiple', label: 'Multiple Asset Types' }
                    ].map((asset) => (
                      <label key={asset.id} className="flex items-center gap-2 cursor-pointer p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-all">
                        <input
                          type="checkbox"
                          checked={formData.tokenizeAssetTypes.includes(asset.id)}
                          onChange={(e) => {
                            const types = formData.tokenizeAssetTypes;
                            if (e.target.checked) {
                              updateFormData('tokenizeAssetTypes', [...types, asset.id]);
                            } else {
                              updateFormData('tokenizeAssetTypes', types.filter(t => t !== asset.id));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-900">{asset.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Preferred Correspondence Language *</label>
            <select
              value={formData.preferredLanguage}
              onChange={(e) => updateFormData('preferredLanguage', e.target.value)}
              className="w-full px-4 py-3 bg-white/30 border border-gray-300/50 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400/50 backdrop-blur-xl"
            >
              <option value="english">English</option>
              <option value="german">German (Deutsch)</option>
              <option value="french">French (Français)</option>
              <option value="spanish">Spanish (Español)</option>
              <option value="italian">Italian (Italiano)</option>
            </select>
          </div>

          {/* Consulting Services */}
          <div className="p-6 bg-amber-50/50 rounded-xl border border-amber-200/50">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Optional Consulting Services</h3>

            <div className="space-y-4">
              {/* Strategy Session */}
              <label className="flex items-start gap-3 p-4 bg-white/60 rounded-lg hover:bg-white/80 cursor-pointer transition-all border border-amber-200/30">
                <input
                  type="checkbox"
                  checked={formData.needsStrategySession}
                  onChange={(e) => updateFormData('needsStrategySession', e.target.checked)}
                  className="mt-1 w-5 h-5"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900">Strategy Session (90 minutes)</p>
                    <span className="text-sm font-bold text-gray-900">$1,490</span>
                  </div>
                  <p className="text-xs text-gray-600">Includes tokenization strategy and SPV structure planning</p>
                </div>
              </label>

              {/* Due Diligence */}
              <label className="flex items-start gap-3 p-4 bg-white/60 rounded-lg hover:bg-white/80 cursor-pointer transition-all border border-amber-200/30">
                <input
                  type="checkbox"
                  checked={formData.needsDueDiligence}
                  onChange={(e) => updateFormData('needsDueDiligence', e.target.checked)}
                  className="mt-1 w-5 h-5"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900">Detailed Due Diligence Consulting</p>
                    <span className="text-sm font-bold text-gray-900">$490</span>
                  </div>
                  <p className="text-xs text-gray-600">Comprehensive analysis of your SPV structure and compliance requirements</p>
                </div>
              </label>

              {/* Legal Consulting */}
              <label className="flex items-start gap-3 p-4 bg-white/60 rounded-lg hover:bg-white/80 cursor-pointer transition-all border border-amber-200/30">
                <input
                  type="checkbox"
                  checked={formData.needsLegalConsulting}
                  onChange={(e) => updateFormData('needsLegalConsulting', e.target.checked)}
                  className="mt-1 w-5 h-5"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900">Legal Framework Consultation (Licensed Partners)</p>
                    <span className="text-sm font-bold text-gray-900">$380/hour</span>
                  </div>
                  <p className="text-xs text-gray-600">Rechtliche Rahmenabklärungen durch lizenzierte Partner</p>
                </div>
              </label>

              {/* Legal Hours Input */}
              {formData.needsLegalConsulting && (
                <div className="ml-8 p-4 bg-white/80 rounded-lg border border-amber-300/50">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Estimated Legal Consulting Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.legalConsultingHours}
                    onChange={(e) => updateFormData('legalConsultingHours', parseInt(e.target.value) || 0)}
                    placeholder="2"
                    className="w-full px-4 py-2.5 bg-white border border-amber-300/50 rounded-lg text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  />
                  {formData.legalConsultingHours > 0 && (
                    <p className="mt-2 text-sm text-gray-700">
                      Legal consulting cost: <span className="font-bold text-gray-900">${(formData.legalConsultingHours * 380).toLocaleString()}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Total Consulting Cost */}
              {(formData.needsStrategySession || formData.needsDueDiligence || (formData.needsLegalConsulting && formData.legalConsultingHours > 0)) && (
                <div className="p-4 bg-amber-100/60 rounded-lg border-2 border-amber-300/50 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">Total Consulting Services</span>
                    <span className="text-lg font-bold text-gray-900">
                      ${(
                        (formData.needsStrategySession ? 1490 : 0) +
                        (formData.needsDueDiligence ? 490 : 0) +
                        (formData.needsLegalConsulting && formData.legalConsultingHours > 0 ? formData.legalConsultingHours * 380 : 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-300/50 mt-8">
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-6 py-3 bg-white/40 hover:bg-white/50 rounded-xl text-sm font-medium text-gray-900 transition-all"
            >
              <ArrowLeft size={18} />
              Previous
            </button>
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-semibold transition-all"
            >
              Next
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 4: Director & Shareholder Information
  const renderStep4 = () => (
    <div className="flex-1 overflow-y-auto py-8 px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Director & Shareholder Information</h2>
          <p className="text-sm text-gray-700">Provide KYC information for directors and shareholders</p>
        </div>

        <div className="space-y-8">
          {/* Director Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} />
              Director #1
            </h3>
            <div className="space-y-4 p-6 bg-white/20 rounded-xl border border-gray-300/50 backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-2">Full Legal Name *</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-3 py-2.5 bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-2">Nationality *</label>
                  <input
                    type="text"
                    placeholder="United States"
                    className="w-full px-3 py-2.5 bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-2">Country of Residence *</label>
                  <input
                    type="text"
                    placeholder="United States"
                    className="w-full px-3 py-2.5 bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-2">Passport Number *</label>
                  <input
                    type="text"
                    placeholder="123456789"
                    className="w-full px-3 py-2.5 bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-2">Email Address *</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full px-3 py-2.5 bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    className="w-full px-3 py-2.5 bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-2">Passport Copy (Certified) *</label>
                <div className="border-2 border-dashed border-gray-300/50 rounded-lg p-4 bg-white/10 hover:bg-white/20 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Upload size={20} className="text-gray-700" />
                    <div>
                      <p className="text-xs text-gray-900 font-medium">Upload Passport Copy</p>
                      <p className="text-[10px] text-gray-600">PDF, JPG, PNG (max 5MB)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shareholder Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase size={20} />
              Shareholder #1
            </h3>
            <div className="space-y-4 p-6 bg-white/20 rounded-xl border border-gray-300/50 backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-2">Full Legal Name *</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-3 py-2.5 bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-2">Ownership % *</label>
                  <input
                    type="number"
                    placeholder="100"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2.5 bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-2">Nationality *</label>
                  <input
                    type="text"
                    placeholder="United States"
                    className="w-full px-3 py-2.5 bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-2">Passport Number *</label>
                  <input
                    type="text"
                    placeholder="123456789"
                    className="w-full px-3 py-2.5 bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-2">Email Address *</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full px-3 py-2.5 bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    className="w-full px-3 py-2.5 bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
            <p className="text-xs text-gray-700 leading-relaxed">
              <strong>Note:</strong> All directors and shareholders (UBOs with 25%+ ownership) must provide certified passport copies, proof of address, and complete KYC documentation.
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-300/50 mt-8">
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-6 py-3 bg-white/40 hover:bg-white/50 rounded-xl text-sm font-medium text-gray-900 transition-all"
            >
              <ArrowLeft size={18} />
              Previous
            </button>
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-semibold transition-all"
            >
              Next
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 5: Additional Services
  const renderStep5 = () => {
    const costs = calculateTotalCost();

    return (
      <div className="flex-1 overflow-y-auto py-8 px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Additional Services</h2>
            <p className="text-sm text-gray-700">Select optional services to enhance your SPV setup</p>
          </div>

          <div className="space-y-4 mb-8">
            {/* Nominee Director */}
            <label className="flex items-start gap-4 p-5 bg-white/30 border border-gray-300/50 rounded-xl hover:bg-white/40 transition-all cursor-pointer backdrop-blur-xl">
              <input
                type="checkbox"
                checked={formData.needsNomineeDirector}
                onChange={(e) => updateFormData('needsNomineeDirector', e.target.checked)}
                className="mt-1 w-4 h-4"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-900">{additionalServices.nomineeDirector.name}</h4>
                  <span className="text-sm font-bold text-gray-900">€{additionalServices.nomineeDirector.price}{additionalServices.nomineeDirector.period}</span>
                </div>
                <p className="text-xs text-gray-700">Professional nominee director for privacy and compliance</p>
              </div>
            </label>

            {/* Nominee Shareholder */}
            <label className="flex items-start gap-4 p-5 bg-white/30 border border-gray-300/50 rounded-xl hover:bg-white/40 transition-all cursor-pointer backdrop-blur-xl">
              <input
                type="checkbox"
                checked={formData.needsNomineeShareholder}
                onChange={(e) => updateFormData('needsNomineeShareholder', e.target.checked)}
                className="mt-1 w-4 h-4"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-900">{additionalServices.nomineeShareholder.name}</h4>
                  <span className="text-sm font-bold text-gray-900">€{additionalServices.nomineeShareholder.price}{additionalServices.nomineeShareholder.period}</span>
                </div>
                <p className="text-xs text-gray-700">Nominee shareholder service for confidential ownership</p>
              </div>
            </label>

            {/* Bank Account Guarantee */}
            <label className="flex items-start gap-4 p-5 bg-white/30 border border-gray-300/50 rounded-xl hover:bg-white/40 transition-all cursor-pointer backdrop-blur-xl">
              <input
                type="checkbox"
                checked={formData.needsBankAccountGuarantee}
                onChange={(e) => updateFormData('needsBankAccountGuarantee', e.target.checked)}
                className="mt-1 w-4 h-4"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-900">{additionalServices.bankAccountGuarantee.name}</h4>
                  <span className="text-sm font-bold text-gray-900">€{additionalServices.bankAccountGuarantee.price} {additionalServices.bankAccountGuarantee.period}</span>
                </div>
                <p className="text-xs text-gray-700">Guaranteed bank account opening within 30 days</p>
              </div>
            </label>

            {/* Accounting */}
            <label className="flex items-start gap-4 p-5 bg-white/30 border border-gray-300/50 rounded-xl hover:bg-white/40 transition-all cursor-pointer backdrop-blur-xl">
              <input
                type="checkbox"
                checked={formData.needsAccounting}
                onChange={(e) => updateFormData('needsAccounting', e.target.checked)}
                className="mt-1 w-4 h-4"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-900">{additionalServices.accounting.name}</h4>
                  <span className="text-sm font-bold text-gray-900">€{additionalServices.accounting.price}{additionalServices.accounting.period}</span>
                </div>
                <p className="text-xs text-gray-700">Full bookkeeping, accounting, and financial statements</p>
              </div>
            </label>

            {/* Substance Package */}
            <label className="flex items-start gap-4 p-5 bg-white/30 border border-gray-300/50 rounded-xl hover:bg-white/40 transition-all cursor-pointer backdrop-blur-xl">
              <input
                type="checkbox"
                checked={formData.needsSubstancePackage}
                onChange={(e) => updateFormData('needsSubstancePackage', e.target.checked)}
                className="mt-1 w-4 h-4"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-900">{additionalServices.substancePackage.name}</h4>
                  <span className="text-sm font-bold text-gray-900">€{additionalServices.substancePackage.price}{additionalServices.substancePackage.period}</span>
                </div>
                <p className="text-xs text-gray-700">Physical office, local employees, economic substance requirements</p>
              </div>
            </label>

            {/* VAT Registration */}
            <label className="flex items-start gap-4 p-5 bg-white/30 border border-gray-300/50 rounded-xl hover:bg-white/40 transition-all cursor-pointer backdrop-blur-xl">
              <input
                type="checkbox"
                checked={formData.needsVATRegistration}
                onChange={(e) => updateFormData('needsVATRegistration', e.target.checked)}
                className="mt-1 w-4 h-4"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-900">{additionalServices.vatRegistration.name}</h4>
                  <span className="text-sm font-bold text-gray-900">€{additionalServices.vatRegistration.price} {additionalServices.vatRegistration.period}</span>
                </div>
                <p className="text-xs text-gray-700">VAT/GST registration for eligible jurisdictions</p>
              </div>
            </label>

            {/* Express Service */}
            <label className="flex items-start gap-4 p-5 bg-white/30 border border-gray-300/50 rounded-xl hover:bg-white/40 transition-all cursor-pointer backdrop-blur-xl">
              <input
                type="checkbox"
                checked={formData.needsExpressService}
                onChange={(e) => updateFormData('needsExpressService', e.target.checked)}
                className="mt-1 w-4 h-4"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-900">{additionalServices.expressService.name}</h4>
                  <span className="text-sm font-bold text-gray-900">{additionalServices.expressService.period}</span>
                </div>
                <p className="text-xs text-gray-700">Priority processing for 24-48 hour formation</p>
              </div>
            </label>
          </div>

          {/* Cost Summary */}
          <div className="p-6 bg-gray-900 text-white rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Cost Summary</h3>
            <div className="space-y-2 mb-4 pb-4 border-b border-gray-700">
              <div className="flex justify-between text-sm">
                <span>Formation Fees</span>
                <span className="font-semibold">€{costs.formation.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Annual Fees (Year 1)</span>
                <span className="font-semibold">€{costs.annual.toLocaleString()}</span>
              </div>
              {costs.consulting > 0 && (
                <>
                  <div className="pt-2 border-t border-gray-700 mt-2"></div>
                  <div className="text-xs text-gray-400 mb-1">Consulting Services:</div>
                  {formData.needsStrategySession && (
                    <div className="flex justify-between text-sm pl-4">
                      <span>Strategy Session (90 min)</span>
                      <span className="font-semibold">$1,490</span>
                    </div>
                  )}
                  {formData.needsDueDiligence && (
                    <div className="flex justify-between text-sm pl-4">
                      <span>Due Diligence</span>
                      <span className="font-semibold">$490</span>
                    </div>
                  )}
                  {formData.needsLegalConsulting && formData.legalConsultingHours > 0 && (
                    <div className="flex justify-between text-sm pl-4">
                      <span>Legal Consulting ({formData.legalConsultingHours}h @ $380/h)</span>
                      <span className="font-semibold">${(formData.legalConsultingHours * 380).toLocaleString()}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-base font-semibold">
                <span>SPV Formation Total</span>
                <span>€{(costs.formation + costs.annual).toLocaleString()}</span>
              </div>
              {costs.consulting > 0 && (
                <>
                  <div className="flex justify-between text-base font-semibold">
                    <span>Consulting Services Total</span>
                    <span>${costs.consulting.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-600 flex justify-between text-lg font-bold">
                    <span>Grand Total</span>
                    <span>€{(costs.formation + costs.annual).toLocaleString()} + ${costs.consulting.toLocaleString()}</span>
                  </div>
                </>
              )}
              {costs.consulting === 0 && (
                <div className="pt-2 mt-2 border-t border-gray-600 flex justify-between text-lg font-bold">
                  <span>Grand Total</span>
                  <span>€{(costs.formation + costs.annual).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-300/50 mt-8">
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-6 py-3 bg-white/40 hover:bg-white/50 rounded-xl text-sm font-medium text-gray-900 transition-all"
            >
              <ArrowLeft size={18} />
              Previous
            </button>
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-semibold transition-all"
            >
              Next
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Step 6: Documents Upload
  const renderStep6 = () => (
    <div className="flex-1 overflow-y-auto py-8 px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Upload Documents</h2>
          <p className="text-sm text-gray-700">Provide required KYC and due diligence documents</p>
        </div>

        <div className="space-y-5">
          {/* Business Plan */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Business Plan or Project Description *
            </label>
            <div className="border-2 border-dashed border-gray-300/50 rounded-xl p-6 bg-white/20 backdrop-blur-xl hover:bg-white/25 transition-all cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <Upload size={28} className="text-gray-700 mb-2" />
                <p className="text-sm text-gray-900 font-medium mb-1">Upload Business Plan</p>
                <p className="text-xs text-gray-600">PDF, DOCX (max 10MB)</p>
              </div>
            </div>
          </div>

          {/* Proof of Address */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Proof of Address (Utility Bill, Bank Statement) *
            </label>
            <div className="border-2 border-dashed border-gray-300/50 rounded-xl p-6 bg-white/20 backdrop-blur-xl hover:bg-white/25 transition-all cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <Upload size={28} className="text-gray-700 mb-2" />
                <p className="text-sm text-gray-900 font-medium mb-1">Upload Proof of Address</p>
                <p className="text-xs text-gray-600">PDF, JPG (max 5MB, not older than 3 months)</p>
              </div>
            </div>
          </div>

          {/* Source of Funds */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Source of Funds Declaration *
            </label>
            <div className="border-2 border-dashed border-gray-300/50 rounded-xl p-6 bg-white/20 backdrop-blur-xl hover:bg-white/25 transition-all cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <Upload size={28} className="text-gray-700 mb-2" />
                <p className="text-sm text-gray-900 font-medium mb-1">Upload Source of Funds</p>
                <p className="text-xs text-gray-600">PDF (bank statements, investment docs, employment letter)</p>
              </div>
            </div>
          </div>

          {/* Bank Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Bank Reference Letter (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300/50 rounded-xl p-6 bg-white/20 backdrop-blur-xl hover:bg-white/25 transition-all cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <Upload size={28} className="text-gray-700 mb-2" />
                <p className="text-sm text-gray-900 font-medium mb-1">Upload Bank Reference</p>
                <p className="text-xs text-gray-600">PDF (on bank letterhead)</p>
              </div>
            </div>
          </div>

          {/* Additional Documents */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Additional Supporting Documents (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300/50 rounded-xl p-8 bg-white/20 backdrop-blur-xl hover:bg-white/25 transition-all cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <Upload size={32} className="text-gray-700 mb-3" />
                <p className="text-sm text-gray-900 font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-600">PDF, JPG, PNG up to 10MB each</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-200/50">
            <div className="flex gap-2">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-700 leading-relaxed">
                All documents must be in English or accompanied by certified translations. Passport copies must be certified by a notary public, lawyer, or accountant.
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-300/50 mt-8">
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-6 py-3 bg-white/40 hover:bg-white/50 rounded-xl text-sm font-medium text-gray-900 transition-all"
            >
              <ArrowLeft size={18} />
              Previous
            </button>
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-semibold transition-all"
            >
              Next
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 7: Review & Submit
  const renderStep7 = () => {
    const costs = calculateTotalCost();

    return (
      <div className="flex-1 overflow-y-auto py-8 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Review Your SPV Formation</h2>
            <p className="text-sm text-gray-700">Please review all information before submitting</p>
          </div>

          <div className="space-y-6">
            {/* Jurisdiction Summary */}
            <div className="p-6 bg-white/30 border border-gray-300/50 rounded-xl backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Jurisdiction Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Country</p>
                  <p className="text-sm font-semibold text-gray-900">{formData.jurisdiction}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Formation Fee</p>
                  <p className="text-sm font-semibold text-gray-900">€{formData.jurisdictionDetails?.formation.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Annual Fee</p>
                  <p className="text-sm font-semibold text-gray-900">€{formData.jurisdictionDetails?.annual.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Tax Rate</p>
                  <p className="text-sm font-semibold text-gray-900">{formData.jurisdictionDetails?.tax}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Estimated Duration</p>
                  <p className="text-sm font-semibold text-gray-900">{formData.jurisdictionDetails?.duration}</p>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="p-6 bg-white/30 border border-gray-300/50 rounded-xl backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 size={20} />
                Company Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Company Name</p>
                  <p className="text-sm font-semibold text-gray-900">{formData.companyName || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Business Activity</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{formData.businessActivity?.replace('-', ' ') || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Directors</p>
                  <p className="text-sm font-semibold text-gray-900">{formData.numberOfDirectors}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Shareholders</p>
                  <p className="text-sm font-semibold text-gray-900">{formData.numberOfShareholders}</p>
                </div>
              </div>
            </div>

            {/* Additional Services */}
            {(formData.needsNomineeDirector || formData.needsNomineeShareholder || formData.needsBankAccountGuarantee ||
              formData.needsAccounting || formData.needsSubstancePackage || formData.needsVATRegistration || formData.needsExpressService) && (
              <div className="p-6 bg-white/30 border border-gray-300/50 rounded-xl backdrop-blur-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles size={20} />
                  Additional Services
                </h3>
                <div className="space-y-2">
                  {formData.needsNomineeDirector && (
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span>Nominee Director (€1,800/year)</span>
                    </div>
                  )}
                  {formData.needsNomineeShareholder && (
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span>Nominee Shareholder (€1,500/year)</span>
                    </div>
                  )}
                  {formData.needsBankAccountGuarantee && (
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span>Bank Account Guarantee (€2,500)</span>
                    </div>
                  )}
                  {formData.needsAccounting && (
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span>Accounting & Bookkeeping (€2,000/year)</span>
                    </div>
                  )}
                  {formData.needsSubstancePackage && (
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span>Substance Package (€5,000/year)</span>
                    </div>
                  )}
                  {formData.needsVATRegistration && (
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span>VAT/GST Registration (€1,500)</span>
                    </div>
                  )}
                  {formData.needsExpressService && (
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span>Express Service (24-48h) (+50%)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Final Cost */}
            <div className="p-6 bg-gray-900 text-white rounded-xl">
              <h3 className="text-xl font-semibold mb-6">Total Investment</h3>
              <div className="space-y-3 mb-5 pb-5 border-b border-gray-700">
                <div className="flex justify-between">
                  <span className="text-sm">Formation Fees</span>
                  <span className="text-sm font-semibold">€{costs.formation.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Annual Fees (Year 1)</span>
                  <span className="text-sm font-semibold">€{costs.annual.toLocaleString()}</span>
                </div>
                {costs.consulting > 0 && (
                  <>
                    <div className="pt-2 border-t border-gray-700 mt-2"></div>
                    <div className="text-xs text-gray-400 mb-1">Consulting Services:</div>
                    {formData.needsStrategySession && (
                      <div className="flex justify-between text-sm pl-4">
                        <span>Strategy Session (90 min)</span>
                        <span className="font-semibold">$1,490</span>
                      </div>
                    )}
                    {formData.needsDueDiligence && (
                      <div className="flex justify-between text-sm pl-4">
                        <span>Due Diligence</span>
                        <span className="font-semibold">$490</span>
                      </div>
                    )}
                    {formData.needsLegalConsulting && formData.legalConsultingHours > 0 && (
                      <div className="flex justify-between text-sm pl-4">
                        <span>Legal Consulting ({formData.legalConsultingHours}h @ $380/h)</span>
                        <span className="font-semibold">${(formData.legalConsultingHours * 380).toLocaleString()}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>SPV Formation Total</span>
                  <span>€{(costs.formation + costs.annual).toLocaleString()}</span>
                </div>
                {costs.consulting > 0 && (
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Consulting Services Total</span>
                    <span>${costs.consulting.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-3 mt-3 border-t border-gray-600 flex justify-between text-2xl font-bold">
                  <span>Grand Total</span>
                  <span>
                    {costs.consulting > 0
                      ? `€${(costs.formation + costs.annual).toLocaleString()} + $${costs.consulting.toLocaleString()}`
                      : `€${(costs.formation + costs.annual).toLocaleString()}`
                    }
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-6 pt-6 border-t border-gray-700">
                All fees include: Formation documents with apostille, registered office (year 1), corporate kit, compliance check, KYC, banking introduction, tax structure consultation, and 12 months support.
              </p>
            </div>

            {/* Contact Information */}
            <div className="p-6 bg-white/30 border border-gray-300/50 rounded-xl backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-2">Your Email *</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateFormData('contactEmail', e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2.5 bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-2">Your Phone *</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => updateFormData('contactPhone', e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full px-3 py-2.5 bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
              <p className="text-xs text-gray-700 leading-relaxed">
                By submitting this form, you confirm that all information provided is accurate and complete. Our team will review your application and contact you within 24 hours to discuss the next steps.
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-300/50">
              <button
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 bg-white/40 hover:bg-white/50 rounded-xl text-sm font-medium text-gray-900 transition-all"
              >
                <ArrowLeft size={18} />
                Previous
              </button>
              <button
                onClick={() => setShowSuccessModal(true)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <Check size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Progress Bar
  const renderProgressBar = () => (
    <div className="sticky top-0 left-0 right-0 px-8 py-4 border-b border-gray-300/50 bg-white/30 backdrop-blur-xl shadow-sm z-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/40 hover:bg-white/50 rounded-lg text-sm text-gray-900 transition-all"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <h3 className="text-sm font-medium text-gray-900">
              Step {currentStep} of {totalSteps}
            </h3>
          </div>
          <div className="text-sm text-gray-700">
            {selectedTier && (
              <span className="px-3 py-1 bg-white/40 rounded-full text-xs font-semibold uppercase">
                {selectedTier} Tier
              </span>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200/50 rounded-full h-2">
          <div
            className="bg-gray-900 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-600">
          <span>Tier</span>
          <span>Jurisdiction</span>
          <span>Company</span>
          <span>People</span>
          <span>Services</span>
          <span>Documents</span>
          <span>Review</span>
        </div>
      </div>
    </div>
  );

  // Navigation Buttons - NO FLOATING BAR, JUST INLINE BUTTONS
  const renderNavigation = () => {
    return null; // NO MORE FLOATING BAR!
  };

  // Success Modal
  const renderSuccessModal = () => {
    if (!showSuccessModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Application Submitted!</h3>
            <p className="text-sm text-gray-700 mb-6 leading-relaxed">
              Thank you for your SPV formation application. Our team will review your submission and contact you within 24 hours to discuss next steps and answer any questions.
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
    );
  };

  // Main Render
  return (
    <div className="w-full h-full overflow-y-auto">
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}
      {currentStep === 5 && renderStep5()}
      {currentStep === 6 && renderStep6()}
      {currentStep === 7 && renderStep7()}

      {renderSuccessModal()}
    </div>
  );
};

export default SPVFormationFlow;
