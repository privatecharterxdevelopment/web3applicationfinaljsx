import React, { useState } from 'react';
import { 
  ArrowRight, Check, Shield, Users, Globe, AlertTriangle, ChevronRight, ChevronDown,
  X, Mail, Plane, Anchor, Lock, CheckCircle, Building2, Coins, Clock, FileText,
  TrendingUp, Navigation, Compass, MapPin, Calendar, Eye, EyeOff, Cloud, Mountain,
  Phone, Search, Star, Timer, Wifi, Zap, AlertCircle
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const DAODrivenTokenizedAssetLicensing = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [expandedDisclaimer, setExpandedDisclaimer] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState('');
  const [selectedService, setSelectedService] = useState(null);

  // Asset carousel data - jets and yachts for NFT DAO
  const assetCards = [
    {
      id: 1,
      type: 'Private Jet Access',
      model: 'Gulfstream G650ER',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/PrivatecharterX_logo_vectorized.glb.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9Qcml2YXRlY2hhcnRlclhfbG9nb192ZWN0b3JpemVkLmdsYi5wbmciLCJpYXQiOjE3NTcyNDc5MzgsImV4cCI6MTc4ODc4MzkzOH0.gA0Flwg99EsLDyQC5MxSSon5NmL70x_ewRTaWolSHmc',
      tokens: '1,000 Access NFTs',
      access: '1 Flight Hour per NFT',
      features: ['Part 135 Certified', 'DAO Governance', 'Global Access'],
      operator: 'USA/EU Certified',
      contact: 'admin@privatecharterx.com'
    },
    {
      id: 2,
      type: 'Luxury Yacht Access',
      model: 'Azimut Grande 35M',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/PrivatecharterX_logo_vectorized.glb.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9Qcml2YXRlY2hhcnRlclhfbG9nb192ZWN0b3JpemVkLmdsYi5wbmciLCJpYXQiOjE3NTcyNDc5MzgsImV4cCI6MTc4ODc4MzkzOH0.gA0Flwg99EsLDyQC5MxSSon5NmL70x_ewRTaWolSHmc',
      tokens: '500 Access NFTs',
      access: '4-6 Charter Hours per NFT',
      features: ['MCA Certified', 'Malta Registration', 'DAO Voting'],
      operator: 'Malta (EU Flag State)',
      contact: 'admin@privatecharterx.com'
    },
    {
      id: 3,
      type: 'Super Yacht Access',
      model: 'Benetti Custom 180',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/PrivatecharterX_logo_vectorized.glb.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9Qcml2YXRlY2hhcnRlclhfbG9nb192ZWN0b3JpemVkLmdsYi5wbmciLCJpYXQiOjE3NTcyNDc5MzgsImV4cCI6MTc4ODc4MzkzOH0.gA0Flwg99EsLDyQC5MxSSon5NmL70x_ewRTaWolSHmc',
      tokens: '1000 Premium NFTs',
      access: '8-12 Charter Hours per NFT',
      features: ['Luxury Class', 'Enhanced Access', 'Priority Booking'],
      operator: 'International Waters',
      contact: 'admin@privatecharterx.com'
    },
    {
      id: 4,
      type: 'Business Jet Access',
      model: 'Bombardier Global 7500',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/PrivatecharterX_logo_vectorized.glb.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9Qcml2YXRlY2hhcnRlclhfbG9nb192ZWN0b3JpemVkLmdsYi5wbmciLCJpYXQiOjE3NTcyNDc5MzgsImV4cCI6MTc4ODc4MzkzOH0.gA0Flwg99EsLDyQC5MxSSon5NmL70x_ewRTaWolSHmc',
      tokens: '800 Access NFTs',
      access: '1.5 Flight Hours per NFT',
      features: ['Ultra Long Range', 'Premium Interior', 'Worldwide Access'],
      operator: 'Part 135 Certified',
      contact: 'admin@privatecharterx.com'
    }
  ];

  // Service cards data
  const serviceCards = [
    {
      id: 'utility-tokens',
      title: 'Utility Access Tokens',
      subtitle: 'Flight hour vouchers with explicit non-investment classification',
      icon: Coins,
      details: [
        'Each NFT represents specific flight hours (jets: 1 hour) or charter time (yachts: 4-6 hours)',
        'Digital vouchers redeemable with certified Part 135 aviation and MCA marine operators',
        'No profit distributions, dividends, financial returns, or investment characteristics',
        'Legal structure designed as service access tokens, explicitly not securities or ownership',
        'Utility-focused functionality for booking and access fulfillment only',
        'Clear regulatory distinction from investment products through usage-based design'
      ]
    },
    {
      id: 'dao-governance',
      title: 'DAO Governance',
      subtitle: 'Democratic participation without guaranteed profit distributions',
      icon: Users,
      details: [
        'Token holders receive democratic voting rights only - no contractual distribution rights',
        'Asset disposal and exit proceeds subject exclusively to voluntary DAO voting decisions',
        'Any profit distributions constitute voluntary governance decisions, not securities benefits',
        'No predetermined distribution formulas or guaranteed return commitments',
        'Exit strategies and asset sales determined through democratic voting processes only',
        'Governance participation focused on service quality and operator oversight'
      ]
    },
    {
      id: 'kyc-compliance',
      title: 'KYC Verification',
      subtitle: 'Institutional-grade identity verification required',
      icon: Shield,
      details: [
        'Comprehensive KYC verification through Sumsub/Jumio mandatory for all transactions',
        'Enhanced due diligence procedures for high-value token acquisitions above €50,000',
        'Identity verification required before token minting, transfer, and access redemption',
        'Continuous sanctions screening against OFAC, EU, and UN consolidated lists',
        'Professional compliance officer oversight with quarterly audits and reporting',
        'Anti-money laundering procedures meeting international banking standards'
      ]
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Regulatory Compliance',
      description: 'Utility token structure across optimal jurisdictions with professional legal counsel ensuring compliance.',
      highlight: 'Malta (yachts), USA/EU (aviation)'
    },
    {
      icon: Users,
      title: 'Democratic Governance',
      description: 'Token holders participate in key decisions through DAO voting without investment characteristics.',
      highlight: 'Voting rights only - no profit guarantees'
    },
    {
      icon: CheckCircle,
      title: 'Professional Operations',
      description: 'Certified operators with proven safety records manage all assets with continuous monitoring.',
      highlight: 'Part 135 & MCA certified operators'
    }
  ];

  const benefits = [
    { title: 'Transparent Cost Structure', description: 'Fixed hourly rates with no hidden fees. Token holders pay only for actual time used.' },
    { title: 'Environmental Responsibility', description: 'Carbon offset programs funded through token transaction fees with CO2 compensation certificates.' },
    { title: 'Secondary Market Liquidity', description: 'Tokens are transferable on approved markets after KYC verification.' },
    { title: 'Quality Assurance', description: 'Service level agreements with certified operators ensure consistent experience.' }
  ];

  const faqData = [
    {
      id: 1,
      question: 'Are these tokens considered securities?',
      answer: 'No, these are explicitly utility tokens representing access rights to specific flight hours. They have no investment characteristics, profit distributions, or ownership rights. The legal structure is designed to comply with utility token regulations across jurisdictions.'
    },
    {
      id: 2,
      question: 'How does DAO governance work?',
      answer: 'Token holders receive democratic voting rights only - no contractual rights to profit distributions. Any decisions regarding asset management are voluntary DAO governance decisions, never contractual obligations or securities benefits.'
    },
    {
      id: 3,
      question: 'What happens if an operator goes out of business?',
      answer: 'The DAO governance structure allows token holders to vote on alternative certified operators. Assets are professionally managed with multiple operator agreements to ensure service continuity.'
    },
    {
      id: 4,
      question: 'Can I transfer or sell my access tokens?',
      answer: 'Yes, tokens are transferable after mandatory KYC verification of the new holder. All transfers require compliance approval to maintain regulatory standards.'
    }
  ];

  const handleWaitlistSubmit = async () => {
    setWaitlistStatus('submitting');
    setTimeout(() => {
      setWaitlistStatus('success');
      setWaitlistEmail('');
    }, 1500);
  };

  const ServiceDetailModal = ({ service, onClose }) => {
    if (!service) return null;

    return (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-8 border-b border-gray-100">
            <div>
              <h2 className="text-2xl font-light text-black mb-2">{service.title}</h2>
              <p className="text-gray-500 font-light">{service.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-50 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          
          <div className="p-8 overflow-y-auto">
            <div className="space-y-4">
              {service.details.map((detail, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-3"></div>
                  <p className="text-gray-700 font-light leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const WaitlistModal = () => (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && setShowWaitlistModal(false)}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-light text-black">Join Launch Waitlist</h3>
          <button
            onClick={() => setShowWaitlistModal(false)}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={waitlistEmail}
              onChange={(e) => setWaitlistEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="your.email@domain.com"
            />
          </div>
          
          <div className="mb-6">
            <p className="text-xs text-gray-500 leading-relaxed">
              By joining our waitlist, you acknowledge that tokens represent access rights only. 
              Comprehensive KYC verification required. Not investment securities.
            </p>
          </div>

          {waitlistStatus === 'success' ? (
            <div className="text-center">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <p className="text-black font-medium mb-2">Successfully Added</p>
              <p className="text-sm text-gray-500">You'll receive updates about our Q1 2026 launch.</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleWaitlistSubmit}
              disabled={waitlistStatus === 'submitting'}
              className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
            >
              {waitlistStatus === 'submitting' ? 'Adding...' : 'Join Waitlist'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 pt-[88px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 tracking-tighter">
              DAO-driven tokenized asset access with utility-based licensing and transparent governance
            </h1>
            <p className="text-gray-500 mb-12 max-w-2xl mx-auto font-light">
              Revolutionary blockchain-based access vouchers for premium aviation and marine assets. 1,000 NFT licenses provide 
              specific flight hours or charter access through certified operators. Utility tokens with DAO governance - 
              explicitly not investment securities.
            </p>
            
            {/* Coming Soon Badge */}
            <div className="inline-flex items-center gap-2 bg-black text-white px-6 py-2 rounded-full text-sm font-medium mb-8">
              <Timer size={16} />
              Coming Soon Q1 2026
            </div>
          </div>

          {/* Action Buttons - HIDDEN
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => setShowWaitlistModal(true)}
              className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
            >
              Join Launch Waitlist
              <ArrowRight size={18} />
            </button>
            <a
              href="mailto:compliance@privatecharterx.com"
              className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Mail size={18} />
              Compliance Inquiries
            </a>
          </div>
          */}

          {/* Asset Carousel - HIDDEN
          <div className="mb-20">
            <h2 className="text-2xl font-light text-black mb-8 text-center">Available Asset Access Tokens</h2>
            <div className="relative overflow-hidden">
              <style dangerouslySetInnerHTML={{
                __html: `
                  @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                  }
                  .animate-scroll {
                    animation: scroll 40s linear infinite;
                  }
                  .animate-scroll:hover {
                    animation-play-state: paused;
                  }
                `
              }} />
              <div className="flex gap-6 animate-scroll">
                {[...assetCards, ...assetCards].map((asset, index) => (
                  <div key={`${asset.id}-${index}`} className="flex-shrink-0 w-80 bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={asset.image} 
                        alt={asset.model}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{asset.type}</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      
                      <h3 className="font-medium text-gray-900 mb-2 text-lg">{asset.model}</h3>
                      
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tokens:</span>
                          <span className="font-medium">{asset.tokens}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Access:</span>
                          <span className="font-medium">{asset.access}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Operator:</span>
                          <span className="font-medium text-xs">{asset.operator}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {asset.features.map((feature, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                            {feature}
                          </span>
                        ))}
                      </div>

                      <div className="text-xs text-gray-500">
                        Contact: {asset.contact}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          */}

          {/* Features Section - 2 Rows Layout */}
          <div className="space-y-8 mb-20">
            {/* First Row - Main Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-black mb-3">{feature.title}</h3>
                  <p className="text-gray-600 font-light leading-relaxed mb-3">{feature.description}</p>
                  <p className="text-sm font-medium text-black">{feature.highlight}</p>
                </div>
              ))}
            </div>

            {/* Second Row - Additional Compliance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-black mb-2">VCS Verified</h3>
                <p className="text-gray-600 font-light text-sm">Verified Carbon Standard certification for environmental projects</p>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Globe size={20} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-black mb-2">Global Coverage</h3>
                <p className="text-gray-600 font-light text-sm">Operations across USA, EU, and Asia-Pacific regions</p>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Lock size={20} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-medium text-black mb-2">Blockchain Verified</h3>
                <p className="text-gray-600 font-light text-sm">Immutable smart contracts and NFT verification</p>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <AlertCircle size={20} className="text-orange-600" />
                </div>
                <h3 className="text-lg font-medium text-black mb-2">24/7 Support</h3>
                <p className="text-gray-600 font-light text-sm">Dedicated compliance and operations support team</p>
              </div>
            </div>
          </div>

          {/* Regulatory Compliance Text Section */}
          <div className="bg-gray-100 rounded-2xl p-8 mb-20">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-light text-black mb-6">Regulatory Framework & Compliance</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p className="font-light">
                  Our tokenized asset access platform operates under a comprehensive legal framework designed to ensure full regulatory compliance across multiple jurisdictions. All NFT tokens represent utility access rights only, explicitly classified as service vouchers rather than investment securities.
                </p>
                <p className="font-light">
                  The DAO governance structure provides democratic voting rights without contractual profit distributions. Token holders participate in operational decisions through voluntary consensus, maintaining clear separation from investment characteristics. Professional operators maintain all required certifications including Part 135 aviation and MCA marine compliance.
                </p>
                <p className="font-light">
                  Mandatory KYC verification through certified providers ensures anti-money laundering compliance, while legal structures across Malta, USA, and EU jurisdictions provide robust regulatory coverage. This framework enables transparent, compliant asset access without securities classification complications.
                </p>
              </div>
            </div>
          </div>

          {/* Service Cards Grid */}
          <div className="mb-20">
            <h2 className="text-2xl font-light text-black mb-8 text-center">Key Service Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviceCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => setSelectedService(card)}
                  className="bg-white rounded-2xl border border-gray-100 hover:shadow-sm transition-all duration-300 p-6 text-left group"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-colors">
                    <card.icon size={20} />
                  </div>
                  <h3 className="text-lg font-medium text-black mb-2 group-hover:text-gray-700 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-500 font-light leading-relaxed mb-4">
                    {card.subtitle}
                  </p>
                  <div className="mt-4 text-sm text-black font-light flex items-center gap-1 group-hover:gap-2 transition-all">
                    View details <ArrowRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-20">
            <h2 className="text-2xl font-light text-black mb-8 text-center">Comprehensive Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check size={14} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-black mb-2">{benefit.title}</h3>
                    <p className="text-gray-600 font-light leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating CTA Banner */}
          <div className="relative overflow-hidden rounded-3xl mb-20">
            <div 
              className="bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.4)), url('https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/2025%20Formula%201%20(2).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi8yMDI1IEZvcm11bGEgMSAoMikucG5nIiwiaWF0IjoxNzU3MjQ3Mzk2LCJleHAiOjQ4NTUwMDkxMTM5Nn0.HnRWU42-6ZPtucNSEUyvylMbjTrVSfexe0c1IuBHi_E')`
              }}
            >
              <div className="px-8 py-16 lg:px-16">
                <div className="max-w-2xl">
                  <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                    Ready to revolutionize your asset access?
                  </h2>
                  <p className="text-xl text-gray-200 mb-8 font-light">
                    Join thousands of forward-thinking individuals who are already positioning themselves for the future of tokenized asset access. 
                    Get priority access to our Q1 2026 launch with exclusive early-bird benefits.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setShowWaitlistModal(true)}
                      className="bg-white text-black px-8 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                    >
                      Secure Your Spot
                      <ArrowRight size={18} />
                    </button>
                    <a
                      href="mailto:early-access@privatecharterx.com"
                      className="border-2 border-white text-white px-8 py-3 rounded-xl font-medium hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2"
                    >
                      <Mail size={18} />
                      Early Access Inquiry
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* JetMembership Integration Notice */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-20 shadow-[0_0_0_1px_rgba(108,43,217,0.3),0_10px_40px_-10px_rgba(108,43,217,0.15)]">
            <div className="flex items-start gap-4">
              <Users size={24} className="text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-medium text-black mb-4">JetMembership Program Integration</h3>
                <p className="text-sm text-gray-600 font-light leading-relaxed mb-4">
                  Enhance your token access with our exclusive JetMembership program - a separate offering providing 
                  additional benefits, priority booking privileges, and enhanced service levels beyond standard token access rights.
                </p>
                <a
                  href="mailto:membership@privatecharterx.com"
                  className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 transition-colors"
                >
                  <Mail size={16} />
                  JetMembership Inquiries (Separate Program)
                </a>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-20">
            <h2 className="text-2xl font-light text-black mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4 max-w-4xl mx-auto">
              {faqData.map((faq) => (
                <div key={faq.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="flex items-center justify-between w-full p-6 text-left hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-lg font-medium text-black pr-4">{faq.question}</h3>
                    <ChevronRight
                      size={20}
                      className={`text-gray-400 transition-transform flex-shrink-0 ${expandedFaq === faq.id ? 'rotate-90' : ''}`}
                    />
                  </button>
                  
                  {expandedFaq === faq.id && (
                    <div className="px-6 pb-6">
                      <div className="w-1 h-1 bg-black rounded-full mb-3"></div>
                      <p className="text-gray-600 font-light leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Legal Disclaimer - Foldable */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-20">
            <button
              onClick={() => setExpandedDisclaimer(!expandedDisclaimer)}
              className="flex items-center justify-between w-full p-6 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <AlertTriangle size={24} className="text-gray-400 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-black">Legal Framework & Utility Token Classification</h3>
                  <p className="text-sm text-gray-500 mt-1">Important legal and regulatory information</p>
                </div>
              </div>
              <ChevronDown
                size={20}
                className={`text-gray-400 transition-transform flex-shrink-0 ${expandedDisclaimer ? 'rotate-180' : ''}`}
              />
            </button>
            
            {expandedDisclaimer && (
              <div className="px-6 pb-6 border-t border-gray-100">
                <div className="space-y-4 text-sm text-gray-700 font-light leading-relaxed pt-4">
                  <p>
                    <strong className="text-black">Utility Token Structure:</strong> All NFT tokens represent specific access hours 
                    and booking rights only - explicitly not investment securities, ownership interests, or profit-sharing arrangements. 
                    No guaranteed returns, distributions, or financial benefits promised to token holders. 
                    Tokens function as digital vouchers for professional operator services.
                  </p>
                  
                  <p>
                    <strong className="text-black">DAO Governance Rights:</strong> Token holders receive democratic voting rights only - 
                    not contractual rights to profit distributions or asset sale proceeds. Any decisions regarding asset disposal, 
                    exit strategies, or profit allocation are entirely voluntary DAO governance decisions, never as contractual obligations 
                    or securities benefits.
                  </p>
                  
                  <p>
                    <strong className="text-black">Professional Operations:</strong> Assets operated exclusively by certified Part 135 aviation 
                    operators and MCA-certified marine management companies. Token holders book directly with professional operators 
                    using NFT credentials for service access fulfillment only.
                  </p>
                  
                  <p>
                    <strong className="text-black">Mandatory Compliance:</strong> Comprehensive KYC verification through certified third-party 
                    providers required for all token transactions. Legal structure designed to maintain utility token 
                    classification with governance participation rights only.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white p-12 rounded-3xl text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-light mb-4">Join the Future of Asset Access</h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto font-light">
                Be among the first to experience revolutionary blockchain-based asset access with democratic governance.
                Launch coming Q1 2026.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowWaitlistModal(true)}
                  className="bg-white text-black px-8 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  Join Launch Waitlist
                  <ArrowRight size={18} />
                </button>
                <a 
                  href="mailto:info@privatecharterx.com"
                  className="border border-white/30 text-white px-8 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Mail size={18} />
                  Get In Touch
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Modals */}
      {selectedService && (
        <ServiceDetailModal 
          service={selectedService} 
          onClose={() => setSelectedService(null)} 
        />
      )}
      
      {showWaitlistModal && <WaitlistModal />}
    </div>
  );
};

export default DAODrivenTokenizedAssetLicensing;
