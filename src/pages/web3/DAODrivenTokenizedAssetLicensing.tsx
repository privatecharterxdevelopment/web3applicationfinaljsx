import React, { useState } from 'react';
import {
  ArrowRight, Check, Shield, Users, Globe, AlertTriangle, ChevronRight, ChevronDown,
  X, Mail, Plane, Anchor, Lock, CheckCircle, Building2, Coins, Clock, FileText,
  TrendingUp, Navigation, Compass, MapPin, Calendar, Eye, EyeOff, Cloud, Mountain,
  Phone, Search, Star, Timer, Wifi, Zap, AlertCircle, Car, Helicopter, Wallet,
  BarChart3, PieChart, DollarSign, CreditCard, Briefcase, Target, Award, Settings
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const TokenizingGlobalMobility = () => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    assetType: '',
    message: ''
  });
  const [contactStatus, setContactStatus] = useState('');

  // Use PrivateCharterX logo for all assets
  const LOGO_URL = 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/PrivatecharterX_logo_vectorized.glb.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9Qcml2YXRlY2hhcnRlclhfbG9nb192ZWN0b3JpemVkLmdsYi5wbmciLCJpYXQiOjE3NTcyNDc5MzgsImV4cCI6MTc4ODc4MzkzOH0.gA0Flwg99EsLDyQC5MxSSon5NmL70x_ewRTaWolSHmc';

  // Example tokenized assets
  const tokenizedAssets = [
    {
      id: 1,
      type: 'Private Jet',
      model: 'Gulfstream G650ER',
      image: LOGO_URL,
      tokenValue: '€12.5M',
      tokens: '12,500 Tokens @ €1,000',
      yield: '8.2% APY',
      utilization: '78%',
      features: ['Part 135 Certified', 'Global Range', 'DAO Governance'],
      location: 'Geneva, Switzerland'
    },
    {
      id: 2,
      type: 'Luxury Yacht',
      model: 'Azimut Grande 35M',
      image: LOGO_URL,
      tokenValue: '€8.9M',
      tokens: '8,900 Tokens @ €1,000',
      yield: '6.8% APY',
      utilization: '65%',
      features: ['MCA Certified', 'Mediterranean Charter', 'Professional Crew'],
      location: 'Monaco, France'
    },
    {
      id: 3,
      type: 'Exotic Car',
      model: 'McLaren Senna',
      image: LOGO_URL,
      tokenValue: '€1.2M',
      tokens: '1,200 Tokens @ €1,000',
      yield: '12.5% APY',
      utilization: '89%',
      features: ['Track Events', 'Concierge Service', 'Insurance Included'],
      location: 'Zurich, Switzerland'
    },
    {
      id: 4,
      type: 'Helicopter',
      model: 'Airbus H145',
      image: LOGO_URL,
      tokenValue: '€4.8M',
      tokens: '4,800 Tokens @ €1,000',
      yield: '9.4% APY',
      utilization: '72%',
      features: ['EASA Certified', 'Emergency Medical', 'Corporate Charter'],
      location: 'Frankfurt, Germany'
    }
  ];

  // Roadmap steps
  const roadmapSteps = [
    {
      phase: '01',
      title: 'Initial Assessment',
      duration: '2-3 weeks',
      description: 'Comprehensive asset valuation and legal review'
    },
    {
      phase: '02',
      title: 'Legal Structure',
      duration: '3-4 weeks',
      description: 'Special purpose vehicle establishment and regulatory approval'
    },
    {
      phase: '03',
      title: 'Token Creation',
      duration: '1-2 weeks',
      description: 'Smart contract deployment and token generation'
    },
    {
      phase: '04',
      title: 'Market Launch',
      duration: '2-3 weeks',
      description: 'Investor onboarding and trading approval'
    }
  ];

  const handleContactSubmit = async () => {
    setContactStatus('submitting');
    setTimeout(() => {
      setContactStatus('success');
      setContactForm({ name: '', email: '', company: '', assetType: '', message: '' });
    }, 1500);
  };

  const ContactModal = () => (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && setShowContactModal(false)}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-8 border-b border-gray-100">
          <div>
            <h3 className="text-2xl font-light text-black mb-2">Asset Tokenization Request</h3>
            <p className="text-gray-500 font-light">Let us tokenize your asset</p>
          </div>
          <button
            onClick={() => setShowContactModal(false)}
            className="p-3 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          {contactStatus === 'success' ? (
            <div className="text-center">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-black mb-4">Request successfully submitted</h3>
              <p className="text-gray-600 mb-6">Our team will contact you within 24 hours.</p>
              <button
                onClick={() => setShowContactModal(false)}
                className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="your.email@domain.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({...contactForm, company: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Company name (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Asset Type *</label>
                  <select
                    value={contactForm.assetType}
                    onChange={(e) => setContactForm({...contactForm, assetType: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  >
                    <option value="">Select asset</option>
                    <option value="private-jet">Private Jet</option>
                    <option value="helicopter">Helicopter</option>
                    <option value="yacht">Yacht</option>
                    <option value="exotic-car">Exotic Car</option>
                    <option value="evtol">eVTOL</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                  placeholder="Describe your asset and tokenization goals..."
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleContactSubmit}
                  disabled={contactStatus === 'submitting'}
                  className="flex-1 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {contactStatus === 'submitting' ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      Send request
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="px-8 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Header />

      {/* Main Content */}
      <main className="flex-1 pt-[88px]">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Floating Container */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12 mx-4 md:mx-8">
          {/* Hero Section - Exact same as CarbonCertificates */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-medium text-gray-900 text-center mb-4 tracking-tighter">
              Revolutionary blockchain-based tokenization process for premium mobility assets
            </h1>
            <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto font-light">
              From registration to DAO governance – fully regulated, transparent and professionally managed with FINMA compliance.
              Democratic participation with utility tokens and blockchain verification.
            </p>
          </div>

          {/* Action Buttons - Same style as CarbonCertificates */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => setShowContactModal(true)}
              className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
            >
              Start Tokenization
            </button>
            <a
              href="mailto:tokenization@privatecharterx.com"
              className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
            >
              Contact Team
            </a>
          </div>

          {/* Details toggle - Same as CarbonCertificates */}
          <div className="text-center mb-16">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-center gap-2 mx-auto text-gray-600 hover:text-gray-800 transition-colors"
            >
              <span className="text-sm">Show details</span>
              <ChevronRight
                className={`transition-transform ${showDetails ? 'rotate-90' : ''}`}
                size={16}
              />
            </button>
            {showDetails && (
              <div className="mt-6 p-6 bg-white rounded-2xl border border-gray-100 text-left shadow-sm max-w-2xl mx-auto">
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Check size={16} className="text-green-600 mr-3" />
                    FINMA-compliant utility token structure with professional legal oversight
                  </div>
                  <div className="flex items-center">
                    <Check size={16} className="text-green-600 mr-3" />
                    Democratic DAO governance without investment characteristics
                  </div>
                  <div className="flex items-center">
                    <Check size={16} className="text-green-600 mr-3" />
                    Blockchain verification with transparent smart contracts
                  </div>
                  <div className="flex items-center">
                    <Check size={16} className="text-green-600 mr-3" />
                    Professional custody through licensed custodians
                  </div>
                  <div className="flex items-center">
                    <Check size={16} className="text-green-600 mr-3" />
                    Secondary trading on regulated marketplaces
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Asset Cards Carousel - Same structure as CarbonCertificates */}
          <div className="mb-20">
            <div className="relative overflow-hidden">
              <style dangerouslySetInnerHTML={{
                __html: `
                  @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                  }
                  .animate-scroll {
                    animation: scroll 30s linear infinite;
                  }
                  .animate-scroll:hover {
                    animation-play-state: paused;
                  }
                  .carousel-container {
                    position: relative;
                  }
                  .carousel-container::before,
                  .carousel-container::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 100px;
                    z-index: 10;
                    pointer-events: none;
                  }
                  .carousel-container::before {
                    left: 0;
                    background: linear-gradient(to right, rgba(249, 250, 251, 1), rgba(249, 250, 251, 0));
                  }
                  .carousel-container::after {
                    right: 0;
                    background: linear-gradient(to left, rgba(249, 250, 251, 1), rgba(249, 250, 251, 0));
                  }
                `
              }} />
              <div className="carousel-container">
                <div className="flex gap-6 animate-scroll">
                  {[...tokenizedAssets, ...tokenizedAssets].map((asset, index) => (
                    <div key={`${asset.id}-${index}`} className="flex-shrink-0 w-80 bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-sm text-gray-500 font-mono">#{asset.type.replace(' ', '').toUpperCase()}{String(asset.id).padStart(3, '0')}</span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ACTIVE
                        </span>
                      </div>

                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
                        <img
                          src={asset.image}
                          alt="PrivateCharterX"
                          className="w-12 h-12 object-contain"
                        />
                      </div>

                      <div className="text-center">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">{asset.type}</span>
                        <h3 className="font-medium text-gray-900 mb-3 text-lg">{asset.model}</h3>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Value:</span>
                            <span className="font-medium text-gray-900">{asset.tokenValue}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Yield:</span>
                            <span className="font-medium text-green-600">{asset.yield}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Utilization:</span>
                            <span className="font-medium text-gray-900">{asset.utilization}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-center text-xs text-gray-500 mb-3">
                          <MapPin size={12} className="mr-1" />
                          {asset.location}
                        </div>

                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-600">DAO Governance Active</p>
                          <p className="text-xs text-gray-500">Democratic participation enabled</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Roadmap Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-4 tracking-tighter">
                Asset Tokenization Roadmap
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto font-light">
                Our structured 8-12 week process from initial assessment to market launch.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {roadmapSteps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 h-full">
                    <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center text-lg font-medium mb-4">
                      {step.phase}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{step.title}</h3>
                    <div className="text-sm font-medium text-green-600 mb-3">{step.duration}</div>
                    <p className="text-gray-600 text-sm font-light leading-relaxed">{step.description}</p>
                  </div>
                  {index < roadmapSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 -right-3 w-6 h-0.5 bg-gray-200"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-4 tracking-tighter">
                How Asset Tokenization Works
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto font-light">
                A transparent, regulated process designed to democratize access to premium mobility assets.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Registration & Verification</h3>
                    <p className="text-gray-600 font-light leading-relaxed">
                      Complete KYC verification, qualified investor checks, and compliance screening against international sanctions lists.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Target size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Asset Selection & Due Diligence</h3>
                    <p className="text-gray-600 font-light leading-relaxed">
                      Transparent presentation of valuation, charter history, professional appraisals, and detailed risk disclosure.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Wallet size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Token Purchase & Custody</h3>
                    <p className="text-gray-600 font-light leading-relaxed">
                      Secure payment processing, automatic token transfer, and professional custody through FINMA-licensed providers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users size={24} className="text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">DAO Governance & Participation</h3>
                    <p className="text-gray-600 font-light leading-relaxed">
                      Democratic participation in asset decisions, automated distributions, and real-time tracking of asset performance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-4 tracking-tighter">
                Ready to Tokenize Your Assets?
              </h2>
              <p className="text-gray-500 mb-8 max-w-xl mx-auto font-light">
                Join the future of asset ownership with blockchain technology.
                Professional, regulated, and transparent tokenization services.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowContactModal(true)}
                  className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  Get Started
                  <ArrowRight size={18} />
                </button>
                <a
                  href="mailto:tokenization@privatecharterx.com"
                  className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Mail size={18} />
                  Contact Us
                </a>
              </div>
            </div>
          </div>

          </div>
        </div>
      </main>

      <Footer />

      {/* Contact Modal */}
      {showContactModal && <ContactModal />}
    </div>
  );
};

export default TokenizingGlobalMobility;