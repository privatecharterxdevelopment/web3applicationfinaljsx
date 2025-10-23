import React, { useState } from 'react';
import {
  ArrowRight, Check, Shield, Users, Globe, AlertTriangle, ChevronRight, ChevronDown,
  X, Mail, Coins, Lock, CheckCircle, Building2, Clock, FileText,
  TrendingUp, Settings, Target, Award, Briefcase, PieChart, DollarSign,
  BarChart3, Zap, AlertCircle, Wallet
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const CreateDAO = () => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    daoType: '',
    message: ''
  });
  const [contactStatus, setContactStatus] = useState('');

  const daoTypes = [
    {
      id: 1,
      type: 'Investment DAO',
      description: 'Pool capital for asset acquisition and management',
      icon: <DollarSign size={32} />,
      features: ['Collective Investment', 'Profit Sharing', 'Democratic Decisions', 'Regulatory Compliance'],
      minMembers: '25+ Members',
      governance: 'Token-based voting',
      setup: '4-6 weeks'
    },
    {
      id: 2,
      type: 'Service DAO',
      description: 'Coordinate aviation services and operations',
      icon: <Settings size={32} />,
      features: ['Service Coordination', 'Quality Standards', 'Member Benefits', 'Operator Network'],
      minMembers: '10+ Members',
      governance: 'Reputation-based',
      setup: '2-3 weeks'
    },
    {
      id: 3,
      type: 'Protocol DAO',
      description: 'Govern blockchain protocols and smart contracts',
      icon: <Zap size={32} />,
      features: ['Protocol Governance', 'Upgrade Decisions', 'Treasury Management', 'Developer Incentives'],
      minMembers: '50+ Members',
      governance: 'Technical proposals',
      setup: '6-8 weeks'
    },
    {
      id: 4,
      type: 'Social DAO',
      description: 'Community-driven aviation enthusiast network',
      icon: <Users size={32} />,
      features: ['Community Events', 'Knowledge Sharing', 'Member Perks', 'Social Coordination'],
      minMembers: '15+ Members',
      governance: 'Community consensus',
      setup: '1-2 weeks'
    }
  ];

  const roadmapSteps = [
    {
      phase: '01',
      title: 'DAO Structure Design',
      duration: '1-2 weeks',
      description: 'Define governance model, tokenomics, and legal framework'
    },
    {
      phase: '02',
      title: 'Smart Contract Development',
      duration: '2-3 weeks',
      description: 'Deploy voting mechanisms, treasury, and governance contracts'
    },
    {
      phase: '03',
      title: 'Legal & Compliance',
      duration: '2-4 weeks',
      description: 'Regulatory approval and compliance documentation'
    },
    {
      phase: '04',
      title: 'Launch & Governance',
      duration: '1 week',
      description: 'Community onboarding and first governance proposals'
    }
  ];

  const handleContactSubmit = async () => {
    setContactStatus('submitting');
    setTimeout(() => {
      setContactStatus('success');
      setContactForm({ name: '', email: '', company: '', daoType: '', message: '' });
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
            <h3 className="text-2xl font-light text-black mb-2">Create Your DAO</h3>
            <p className="text-gray-500 font-light">Start building your decentralized organization</p>
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
              <h3 className="text-xl font-medium text-black mb-4">DAO creation request submitted</h3>
              <p className="text-gray-600 mb-6">Our team will contact you within 24 hours to begin the process.</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                  <input
                    type="text"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({...contactForm, company: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Organization name (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">DAO Type *</label>
                  <select
                    value={contactForm.daoType}
                    onChange={(e) => setContactForm({...contactForm, daoType: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  >
                    <option value="">Select DAO type</option>
                    <option value="investment">Investment DAO</option>
                    <option value="service">Service DAO</option>
                    <option value="protocol">Protocol DAO</option>
                    <option value="social">Social DAO</option>
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
                  placeholder="Describe your DAO vision and goals..."
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
                      Create DAO
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

      <main className="flex-1 pt-[88px]">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12 mx-4 md:mx-8">

            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-3xl md:text-4xl font-medium text-gray-900 text-center mb-4 tracking-tighter">
                Create Your Decentralized Autonomous Organization
              </h1>
              <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto font-light">
                Launch a DAO with professional governance structures, smart contracts, and regulatory compliance.
                Built for aviation, mobility, and investment communities.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={() => setShowContactModal(true)}
                className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
              >
                Start DAO Creation
              </button>
              <a
                href="mailto:dao@privatecharterx.com"
                className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
              >
                Contact DAO Team
              </a>
            </div>

            {/* Details toggle */}
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
                      Professional legal structure with regulatory compliance
                    </div>
                    <div className="flex items-center">
                      <Check size={16} className="text-green-600 mr-3" />
                      Smart contract deployment on Ethereum and Polygon
                    </div>
                    <div className="flex items-center">
                      <Check size={16} className="text-green-600 mr-3" />
                      Customizable governance and voting mechanisms
                    </div>
                    <div className="flex items-center">
                      <Check size={16} className="text-green-600 mr-3" />
                      Treasury management and multi-signature security
                    </div>
                    <div className="flex items-center">
                      <Check size={16} className="text-green-600 mr-3" />
                      Member onboarding and community management tools
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* DAO Types */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-4 tracking-tighter">
                  Choose Your DAO Type
                </h2>
                <p className="text-gray-500 max-w-2xl mx-auto font-light">
                  Select the governance model that best fits your organization's goals and structure.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {daoTypes.map((dao) => (
                  <div key={dao.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
                        {dao.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{dao.type}</h3>
                        <p className="text-sm text-gray-500">{dao.description}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      {dao.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <Check size={14} className="text-green-600 mr-2" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-100 pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Min Members:</span>
                        <span className="font-medium text-gray-900">{dao.minMembers}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Governance:</span>
                        <span className="font-medium text-gray-900">{dao.governance}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Setup Time:</span>
                        <span className="font-medium text-green-600">{dao.setup}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Roadmap Section */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-4 tracking-tighter">
                  DAO Creation Process
                </h2>
                <p className="text-gray-500 max-w-2xl mx-auto font-light">
                  Our structured 6-10 week process from concept to fully operational DAO.
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

            {/* Benefits Section */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-4 tracking-tighter">
                  Why Create a DAO?
                </h2>
                <p className="text-gray-500 max-w-2xl mx-auto font-light">
                  Leverage the power of decentralized governance for transparent, efficient, and democratic decision-making.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Transparent Governance</h3>
                      <p className="text-gray-600 font-light leading-relaxed">
                        All decisions, votes, and treasury movements are recorded on the blockchain for complete transparency.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Democratic Participation</h3>
                      <p className="text-gray-600 font-light leading-relaxed">
                        Every member has a voice in governance decisions based on their contribution and stake in the organization.
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
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Automated Treasury</h3>
                      <p className="text-gray-600 font-light leading-relaxed">
                        Smart contracts automate fund management, distributions, and financial operations with built-in security.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Globe size={24} className="text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Global Accessibility</h3>
                      <p className="text-gray-600 font-light leading-relaxed">
                        Enable worldwide participation without geographic restrictions or traditional banking limitations.
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
                  Ready to Launch Your DAO?
                </h2>
                <p className="text-gray-500 mb-8 max-w-xl mx-auto font-light">
                  Join the future of organizational governance with blockchain technology.
                  Professional setup, legal compliance, and ongoing support included.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    Start Creating
                    <ArrowRight size={18} />
                  </button>
                  <a
                    href="mailto:dao@privatecharterx.com"
                    className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Mail size={18} />
                    Get Consultation
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />

      {showContactModal && <ContactModal />}
    </div>
  );
};

export default CreateDAO;