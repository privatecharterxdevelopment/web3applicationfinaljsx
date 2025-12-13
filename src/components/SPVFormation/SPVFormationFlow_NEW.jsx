import React, { useState, useEffect } from 'react';
import {
  Building2,
  Info,
  X,
  Loader2,
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle2,
  Check,
  Users,
  MapPin
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { convertToUSD } from '../../services/currencyService';

const SPVFormationFlow = ({ onBack, onSuccess }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tier');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedTierTab, setSelectedTierTab] = useState('standard');

  // Form data state - persisted during form filling
  const [formData, setFormData] = useState({
    // Step 1: Tier & Jurisdiction
    selectedTier: 'standard',
    jurisdiction: '',
    jurisdictionDetails: null,
    // Step 2: Company Info
    companyName: '',
    businessActivity: '',
    companyDescription: '',
    numberOfDirectors: '1',
    numberOfShareholders: '1',
    planningToTokenizeAssets: false,
    assetType: '',
    // Step 3: Directors & Shareholders
    directors: [{ fullName: '', nationality: '', residency: '', email: '', phone: '', passportNumber: '' }],
    shareholders: [{ fullName: '', nationality: '', ownership: '100', email: '', phone: '', passportNumber: '' }],
    // Step 4: Additional Services
    needsNomineeDirector: false,
    needsNomineeShareholder: false,
    needsBankAccountGuarantee: false,
    needsAccounting: false,
    needsSubstancePackage: false,
    needsVATRegistration: false,
    needsExpressService: false,
    // Step 5: Contact
    contactEmail: user?.email || '',
    contactPhone: '',
  });

  const tabs = [
    { id: 'tier', label: 'Jurisdiction' },
    { id: 'company', label: 'Company' },
    { id: 'people', label: 'Directors' },
    { id: 'services', label: 'Services' },
    { id: 'review', label: 'Review' }
  ];

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

  const tiers = [
    { id: 'premium', label: 'Premium', flag: '🇨🇭', price: '$6,500 - $9,200', tax: 'Low tax (8-17%)' },
    { id: 'standard', label: 'Standard', flag: '🇰🇾', price: '$4,300 - $6,500', tax: '0% corporate tax', popular: true },
    { id: 'budget', label: 'Budget', flag: '🇸🇨', price: '$3,300 - $4,600', tax: '0% tax' },
    { id: 'usa', label: 'USA', flag: '🇺🇸', price: '$3,500 - $3,800', tax: 'US market access' }
  ];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotalCost = () => {
    if (!formData.jurisdictionDetails) return { formation: 0, annual: 0 };

    let formation = formData.jurisdictionDetails.formation;
    let annual = formData.jurisdictionDetails.annual;

    if (formData.needsNomineeDirector) annual += 1800;
    if (formData.needsNomineeShareholder) annual += 1500;
    if (formData.needsBankAccountGuarantee) formation += 2500;
    if (formData.needsAccounting) annual += 2000;
    if (formData.needsSubstancePackage) annual += 5000;
    if (formData.needsVATRegistration) formation += 1500;
    if (formData.needsExpressService) formation = Math.round(formation * 1.5);

    return { formation, annual };
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      const costs = calculateTotalCost();
      const requestData = {
        tier: formData.selectedTier,
        jurisdiction: formData.jurisdiction,
        jurisdictionDetails: formData.jurisdictionDetails,
        companyName: formData.companyName,
        businessActivity: formData.businessActivity,
        companyDescription: formData.companyDescription,
        numberOfDirectors: formData.numberOfDirectors,
        numberOfShareholders: formData.numberOfShareholders,
        planningToTokenizeAssets: formData.planningToTokenizeAssets,
        assetType: formData.assetType,
        directors: formData.directors,
        shareholders: formData.shareholders,
        services: {
          nomineeDirector: formData.needsNomineeDirector,
          nomineeShareholder: formData.needsNomineeShareholder,
          bankAccountGuarantee: formData.needsBankAccountGuarantee,
          accounting: formData.needsAccounting,
          substancePackage: formData.needsSubstancePackage,
          vatRegistration: formData.needsVATRegistration,
          expressService: formData.needsExpressService,
        },
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        totalFormationCost: costs.formation,
        totalAnnualCost: costs.annual,
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
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error submitting SPV formation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (activeTab) {
      case 'tier': return formData.jurisdictionDetails !== null;
      case 'company': return formData.companyName && formData.businessActivity;
      case 'people': return formData.directors[0]?.fullName && formData.shareholders[0]?.fullName;
      case 'services': return true;
      case 'review': return formData.contactEmail;
      default: return true;
    }
  };

  const goToNextTab = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  // Info Modal
  const InfoModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowInfoModal(false)}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">About SPV Formation</h3>
          <button onClick={() => setShowInfoModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-4 text-sm text-gray-600">
          <p><strong className="text-gray-900">What is an SPV?</strong><br/>A Special Purpose Vehicle (SPV) is a legal entity created for a specific, limited purpose - typically to isolate financial risk, hold assets, or structure investments.</p>
          <p><strong className="text-gray-900">Why form an SPV?</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Asset protection and liability isolation</li>
            <li>Tax optimization for international operations</li>
            <li>Investment structuring and fundraising</li>
            <li>Real estate and aircraft/yacht ownership</li>
            <li>Tokenization of assets</li>
          </ul>
          <p><strong className="text-gray-900">Our Service Includes:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Full company formation and registration</li>
            <li>Registered office address</li>
            <li>Corporate documents and certificates</li>
            <li>Bank account introduction</li>
            <li>Optional nominee services</li>
            <li>Ongoing compliance support</li>
          </ul>
          <p className="text-xs text-gray-400 pt-2">Processing times vary by jurisdiction. Our team will contact you within 24 hours of submission.</p>
        </div>
      </div>
    </div>
  );

  // Tab 1: Tier & Jurisdiction Selection
  const renderTierTab = () => {
    const tierJurisdictions = jurisdictions[selectedTierTab] || [];

    return (
      <div className="space-y-4">
        {/* Tier Tabs */}
        <div className="flex items-center gap-1 bg-gray-100/60 border border-gray-200/50 rounded-lg p-1">
          {tiers.map(tier => (
            <button
              key={tier.id}
              onClick={() => {
                setSelectedTierTab(tier.id);
                updateFormData('selectedTier', tier.id);
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedTierTab === tier.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-1">{tier.flag}</span> {tier.label}
            </button>
          ))}
        </div>

        {/* Selected Tier Info */}
        <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between text-xs">
          <span className="text-gray-500">{tiers.find(t => t.id === selectedTierTab)?.price}</span>
          <span className="text-gray-500">{tiers.find(t => t.id === selectedTierTab)?.tax}</span>
        </div>

        {/* Jurisdictions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {tierJurisdictions.map((j) => (
            <div
              key={j.name}
              onClick={() => {
                updateFormData('jurisdiction', j.name);
                updateFormData('jurisdictionDetails', j);
              }}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                formData.jurisdiction === j.name
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-100 hover:border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{j.name}</span>
                <span className="text-xs font-semibold text-gray-900">${Math.round(convertToUSD(j.formation, 'EUR')).toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-1.5 line-clamp-1">{j.description}</p>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span><Clock size={9} className="inline mr-0.5" />{j.duration}</span>
                <span><DollarSign size={9} className="inline mr-0.5" />{j.tax}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Tab 2: Company Information
  const renderCompanyTab = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Company Name *</label>
        <input
          type="text"
          value={formData.companyName}
          onChange={(e) => updateFormData('companyName', e.target.value)}
          placeholder="e.g., Global Investment Holdings Ltd."
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Business Activity *</label>
        <select
          value={formData.businessActivity}
          onChange={(e) => updateFormData('businessActivity', e.target.value)}
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
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
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Business Description</label>
        <textarea
          value={formData.companyDescription}
          onChange={(e) => updateFormData('companyDescription', e.target.value)}
          placeholder="Brief description of planned activities..."
          rows={3}
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Number of Directors</label>
          <select
            value={formData.numberOfDirectors}
            onChange={(e) => updateFormData('numberOfDirectors', e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Number of Shareholders</label>
          <select
            value={formData.numberOfShareholders}
            onChange={(e) => updateFormData('numberOfShareholders', e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
        <input
          type="checkbox"
          checked={formData.planningToTokenizeAssets}
          onChange={(e) => updateFormData('planningToTokenizeAssets', e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
        <div>
          <p className="text-sm font-medium text-gray-900">Planning to tokenize assets</p>
          <p className="text-[10px] text-gray-500">We'll prepare the necessary legal structure</p>
        </div>
      </label>

      {formData.planningToTokenizeAssets && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Asset Type</label>
          <select
            value={formData.assetType}
            onChange={(e) => updateFormData('assetType', e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <option value="">Select asset type</option>
            <option value="jet">Private Jet</option>
            <option value="helicopter">Helicopter</option>
            <option value="yacht">Yacht</option>
            <option value="real-estate">Real Estate</option>
            <option value="multiple">Multiple Assets</option>
          </select>
        </div>
      )}
    </div>
  );

  // Tab 3: Directors & Shareholders
  const renderPeopleTab = () => (
    <div className="space-y-4">
      {/* Director */}
      <div className="border border-gray-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-900">Director #1</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={formData.directors[0]?.fullName || ''}
            onChange={(e) => updateFormData('directors', [{ ...formData.directors[0], fullName: e.target.value }])}
            placeholder="Full Name *"
            className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <input
            type="text"
            value={formData.directors[0]?.nationality || ''}
            onChange={(e) => updateFormData('directors', [{ ...formData.directors[0], nationality: e.target.value }])}
            placeholder="Nationality *"
            className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <input
            type="text"
            value={formData.directors[0]?.residency || ''}
            onChange={(e) => updateFormData('directors', [{ ...formData.directors[0], residency: e.target.value }])}
            placeholder="Country of Residence"
            className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <input
            type="email"
            value={formData.directors[0]?.email || ''}
            onChange={(e) => updateFormData('directors', [{ ...formData.directors[0], email: e.target.value }])}
            placeholder="Email"
            className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
      </div>

      {/* Shareholder */}
      <div className="border border-gray-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase size={14} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-900">Shareholder #1</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={formData.shareholders[0]?.fullName || ''}
            onChange={(e) => updateFormData('shareholders', [{ ...formData.shareholders[0], fullName: e.target.value }])}
            placeholder="Full Name *"
            className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <input
            type="number"
            value={formData.shareholders[0]?.ownership || '100'}
            onChange={(e) => updateFormData('shareholders', [{ ...formData.shareholders[0], ownership: e.target.value }])}
            placeholder="Ownership %"
            className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <input
            type="text"
            value={formData.shareholders[0]?.nationality || ''}
            onChange={(e) => updateFormData('shareholders', [{ ...formData.shareholders[0], nationality: e.target.value }])}
            placeholder="Nationality"
            className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <input
            type="email"
            value={formData.shareholders[0]?.email || ''}
            onChange={(e) => updateFormData('shareholders', [{ ...formData.shareholders[0], email: e.target.value }])}
            placeholder="Email"
            className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
        Additional KYC documents (passport copies, proof of address) will be requested after initial review.
      </div>
    </div>
  );

  // Tab 4: Additional Services
  const renderServicesTab = () => {
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
      <div className="space-y-3">
        {services.map(s => (
          <label key={s.key} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-gray-200 transition-all">
            <input
              type="checkbox"
              checked={formData[s.key]}
              onChange={(e) => updateFormData(s.key, e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{s.label}</span>
                <span className="text-xs font-semibold text-gray-700">{s.price}</span>
              </div>
              <p className="text-[10px] text-gray-500">{s.desc}</p>
            </div>
          </label>
        ))}

        {/* Running Total */}
        <div className="bg-gray-900 text-white rounded-xl p-4 mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Formation</span>
            <span>${Math.round(convertToUSD(costs.formation, 'EUR')).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Annual (Year 1)</span>
            <span>${Math.round(convertToUSD(costs.annual, 'EUR')).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-700">
            <span>Total</span>
            <span>${Math.round(convertToUSD(costs.formation + costs.annual, 'EUR')).toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  // Tab 5: Review & Submit
  const renderReviewTab = () => {
    const costs = calculateTotalCost();

    if (submitSuccess) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Submitted!</h3>
          <p className="text-sm text-gray-500 mb-6">Our team will review your submission and contact you within 24 hours.</p>
          <button
            onClick={() => onBack?.()}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            View My SPVs
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Jurisdiction</p>
            <p className="text-sm font-medium text-gray-900">{formData.jurisdiction || '-'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Company</p>
            <p className="text-sm font-medium text-gray-900 truncate">{formData.companyName || '-'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Activity</p>
            <p className="text-sm font-medium text-gray-900 capitalize">{formData.businessActivity?.replace('-', ' ') || '-'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Duration</p>
            <p className="text-sm font-medium text-gray-900">{formData.jurisdictionDetails?.duration || '-'}</p>
          </div>
        </div>

        {/* Selected Services */}
        {(formData.needsNomineeDirector || formData.needsNomineeShareholder || formData.needsBankAccountGuarantee ||
          formData.needsAccounting || formData.needsSubstancePackage || formData.needsVATRegistration || formData.needsExpressService) && (
          <div className="border border-gray-100 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Additional Services</p>
            <div className="space-y-1">
              {formData.needsNomineeDirector && <div className="flex items-center gap-2 text-xs text-gray-700"><CheckCircle2 size={12} className="text-emerald-500" /> Nominee Director</div>}
              {formData.needsNomineeShareholder && <div className="flex items-center gap-2 text-xs text-gray-700"><CheckCircle2 size={12} className="text-emerald-500" /> Nominee Shareholder</div>}
              {formData.needsBankAccountGuarantee && <div className="flex items-center gap-2 text-xs text-gray-700"><CheckCircle2 size={12} className="text-emerald-500" /> Bank Account Guarantee</div>}
              {formData.needsAccounting && <div className="flex items-center gap-2 text-xs text-gray-700"><CheckCircle2 size={12} className="text-emerald-500" /> Accounting</div>}
              {formData.needsSubstancePackage && <div className="flex items-center gap-2 text-xs text-gray-700"><CheckCircle2 size={12} className="text-emerald-500" /> Substance Package</div>}
              {formData.needsVATRegistration && <div className="flex items-center gap-2 text-xs text-gray-700"><CheckCircle2 size={12} className="text-emerald-500" /> VAT Registration</div>}
              {formData.needsExpressService && <div className="flex items-center gap-2 text-xs text-gray-700"><CheckCircle2 size={12} className="text-emerald-500" /> Express Service</div>}
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-3">
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => updateFormData('contactEmail', e.target.value)}
            placeholder="Your Email *"
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <input
            type="tel"
            value={formData.contactPhone}
            onChange={(e) => updateFormData('contactPhone', e.target.value)}
            placeholder="Your Phone"
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        {/* Total */}
        <div className="bg-gray-900 text-white rounded-xl p-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Formation</span>
            <span>${Math.round(convertToUSD(costs.formation, 'EUR')).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Annual</span>
            <span>${Math.round(convertToUSD(costs.annual, 'EUR')).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-700">
            <span>Total</span>
            <span>${Math.round(convertToUSD(costs.formation + costs.annual, 'EUR')).toLocaleString()}</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.contactEmail}
          className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <><Loader2 size={16} className="animate-spin" /> Submitting...</>
          ) : (
            <><Check size={16} /> Submit Application</>
          )}
        </button>

        <p className="text-[10px] text-gray-400 text-center">
          By submitting, you confirm all information is accurate. We'll contact you within 24 hours.
        </p>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">SPV Formation</h1>
          <button
            onClick={() => setShowInfoModal(true)}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            title="What is SPV Formation?"
          >
            <Info size={16} className="text-gray-400" />
          </button>
        </div>
        {formData.jurisdictionDetails && (
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>{formData.jurisdiction}</span>
            <span>${Math.round(convertToUSD(formData.jurisdictionDetails.formation, 'EUR')).toLocaleString()} formation</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 border-b border-gray-100">
        <div className="flex items-center gap-1">
          {tabs.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            const isPast = tabs.findIndex(t => t.id === activeTab) > idx;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : isPast
                      ? 'bg-gray-100 text-gray-700'
                      : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-5">
        {activeTab === 'tier' && renderTierTab()}
        {activeTab === 'company' && renderCompanyTab()}
        {activeTab === 'people' && renderPeopleTab()}
        {activeTab === 'services' && renderServicesTab()}
        {activeTab === 'review' && renderReviewTab()}
      </div>

      {/* Next Button (not on review tab) */}
      {activeTab !== 'review' && !submitSuccess && (
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={goToNextTab}
            disabled={!canProceed()}
            className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && <InfoModal />}
    </div>
  );
};

export default SPVFormationFlow;
