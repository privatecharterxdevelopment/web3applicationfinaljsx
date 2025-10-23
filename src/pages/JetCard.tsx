import React, { useState } from 'react';
import { 
  ArrowRight, Check, Shield, Users, Globe, AlertTriangle, ChevronRight, ChevronDown,
  X, Mail, Plane, Clock, CheckCircle, Building2, Coins, Timer, FileText,
  TrendingUp, Navigation, Compass, MapPin, Calendar, Eye, EyeOff, Cloud, Mountain,
  Phone, Search, Star, Zap, AlertCircle, Crown, Award, Briefcase, Sparkles, Headphones
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const JetCard: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showConsultingModal, setShowConsultingModal] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const jetCards = [
    {
      id: 'starter',
      name: 'Starter',
      price: 'CHF 50,000',
      hours: '10 Hours',
      popular: false,
      features: [
        'Full global fleet access',
        'Light to ultra long-range jets',
        'US, Europe, Asia, Africa coverage',
        'Basic concierge support',
        '72h booking notice',
        'Standard processing'
      ],
      highlight: 'Entry Level'
    },
    {
      id: 'essentials', 
      name: 'Essentials',
      price: 'CHF 125,000',
      hours: '25 Hours',
      popular: false,
      features: [
        'Full global fleet access',
        'All aircraft categories available',
        'Worldwide route coverage',
        'Priority concierge support',
        '48h booking notice',
        'Fast-track processing'
      ],
      highlight: 'Best Value'
    },
    {
      id: 'business',
      name: 'Business', 
      price: 'CHF 250,000',
      hours: '50 Hours',
      popular: true,
      features: [
        'Complete global fleet access',
        'Ultra long-range & VIP jets',
        'Global coverage including remote destinations',
        'Dedicated account coordinator',
        '24h express booking',
        'Priority processing & scheduling',
        'Guest booking privileges',
        'Guaranteed aircraft availability'
      ],
      highlight: 'Most Popular'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 'CHF 500,000', 
      hours: '100 Hours',
      popular: false,
      features: [
        'Unlimited global fleet access',
        'Premium VIP configured aircraft',
        'Worldwide including private airstrips',
        'Personal flight team',
        '6h instant booking',
        'White-glove service'
      ],
      highlight: 'VIP Access'
    },
    {
      id: 'custom',
      name: 'Enterprise',
      price: 'Custom Quote',
      hours: 'Custom Hours', 
      popular: false,
      features: [
        'Bespoke fleet arrangements',
        'Dedicated aircraft access',
        'Global route customization',
        'Personal account manager',
        'Instant booking capability',
        'Corporate billing solutions'
      ],
      highlight: 'Tailored'
    }
  ];

  const benefits = [
    {
      title: 'Immediate Cost Efficiency',
      description: 'Pre-purchase hours at locked-in rates, avoiding market fluctuations and peak pricing premiums.'
    },
    {
      title: 'Streamlined Operations',
      description: 'Skip lengthy booking procedures. Your hours are pre-allocated for instant aircraft deployment.'
    },
    {
      title: 'Global Accessibility',
      description: 'Access our worldwide network across US, Europe, Asia, and Africa with consistent service standards.'
    },
    {
      title: 'Priority Scheduling',
      description: 'JetCard holders receive priority aircraft allocation during high-demand periods.'
    },
    {
      title: 'Administrative Simplification',
      description: 'Single payment covers all future flights. No per-flight invoicing or payment delays.'
    },
    {
      title: 'Enhanced Flexibility',
      description: 'Change routes, aircraft types, and schedules without renegotiating contracts or pricing.'
    }
  ];

  const handleSubmit = async () => {
    setStatus('submitting');
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 1500);
  };

  const handleConsultingSubmit = async () => {
    setStatus('submitting');
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      setShowConsultingModal(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header onShowDashboard={() => {}} />

      <main className="flex-1 pt-[88px]">
        {/* Hero Section with Cards - WHITE BACKGROUND */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-4 py-2 rounded-full text-sm font-light mb-8">
                <Sparkles size={16} />
                NFT Features Available Soon
              </div>
              
              <h1 className="text-4xl md:text-6xl font-light mb-6 tracking-tight text-black">
                JetCard & Bulk Travel Options
              </h1>
              <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
                Immediate and fast processing for B2B and B2C clients. 
                Pre-purchase flight hours with global fleet access and transparent pricing.
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <style dangerouslySetInnerHTML={{
                __html: `
                  @keyframes glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(0, 0, 0, 0.1), 0 0 40px rgba(0, 0, 0, 0.05); }
                    50% { box-shadow: 0 0 30px rgba(0, 0, 0, 0.15), 0 0 50px rgba(0, 0, 0, 0.1); }
                  }
                  .glow-effect {
                    animation: glow 2s ease-in-out infinite;
                  }
                `
              }} />
              
              {/* Row 1: Starter, Essentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {jetCards.slice(0, 2).map((card) => (
                  <div 
                    key={card.id}
                    className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    <div className="p-6">
                      <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider">
                        {card.highlight}
                      </div>
                      
                      <div className="mb-6 text-left">
                        <h3 className="text-2xl font-medium text-black mb-2">{card.name}</h3>
                        <div className="text-3xl font-light text-black mb-2">{card.price}</div>
                        <div className="text-sm text-gray-600">{card.hours}</div>
                      </div>

                      <div className="space-y-3 mb-8">
                        {card.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Check size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 font-light">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setShowModal(true)}
                        className="w-full py-3 rounded-xl transition-colors font-medium text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                      >
                        Get Started
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 2: Business (Popular - Full Width Banner) */}
              <div className="mb-8">
                <div 
                  className="relative bg-white border-2 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] glow-effect shadow-lg"
                >
                  <div className="absolute top-0 left-0 right-0 bg-black text-white text-center py-2 text-xs font-medium uppercase tracking-wider">
                    {jetCards[2].highlight}
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8 pt-12">
                    <div className="text-left">
                      <h3 className="text-3xl font-medium text-black mb-3">{jetCards[2].name}</h3>
                      <div className="text-4xl font-light text-black mb-2">{jetCards[2].price}</div>
                      <div className="text-lg text-gray-600 mb-6">{jetCards[2].hours}</div>
                      
                      <button
                        onClick={() => setShowModal(true)}
                        className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
                      >
                        Get Started
                      </button>
                    </div>
                    
                    <div className="lg:col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {jetCards[2].features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Check size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 font-light">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Premium, Enterprise */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {jetCards.slice(3, 5).map((card) => (
                  <div 
                    key={card.id}
                    className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    <div className="p-6">
                      <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider">
                        {card.highlight}
                      </div>
                      
                      <div className="mb-6 text-left">
                        <h3 className="text-2xl font-medium text-black mb-2">{card.name}</h3>
                        <div className="text-3xl font-light text-black mb-2">{card.price}</div>
                        <div className="text-sm text-gray-600">{card.hours}</div>
                      </div>

                      <div className="space-y-3 mb-8">
                        {card.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Check size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 font-light">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setShowModal(true)}
                        className="w-full py-3 rounded-xl transition-colors font-medium text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                      >
                        {card.id === 'custom' ? 'Request Quote' : 'Get Started'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <p className="text-gray-600 text-sm font-light mb-6">
                  Global fleet access across US, Europe, Asia, and Africa with consistent service standards
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* JetCard Advantages */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-light text-black mb-4">JetCard Efficiency Advantages</h2>
              <p className="text-gray-600 font-light max-w-2xl mx-auto">
                Experience the operational and financial benefits of bulk hour purchasing
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 hover:shadow-sm transition-all duration-300 border border-gray-100">
                  <h3 className="text-lg font-medium text-black mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 font-light text-sm leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-light text-black mb-4">How JetCard Works</h2>
              <p className="text-gray-600 font-light max-w-2xl mx-auto">
                Streamlined process from purchase to global flight access
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              {[
                { title: 'Choose Package', desc: 'Select flight hours based on your travel volume and budget requirements' },
                { title: 'Complete Verification', desc: 'Quick KYC process with enhanced due diligence for regulatory compliance' },
                { title: 'Fund Account', desc: 'Secure bank transfer with transparent fee structure and instant activation' },
                { title: 'Book Globally', desc: 'Access worldwide fleet with priority scheduling and guaranteed availability' }
              ].map((step, index) => (
                <div key={index} className="text-left">
                  <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center text-xl font-medium mb-6">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-medium text-black mb-3">{step.title}</h3>
                  <p className="text-gray-600 font-light text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>

            {/* Two buttons */}
            <div className="text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-black text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  Get Package Details
                  <ArrowRight size={18} />
                </button>
                <a 
                  href="mailto:jetcard@privatecharterx.com"
                  className="border border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Mail size={18} />
                  Email Us Directly
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Personal Consulting - LAST SECTION */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-light text-black mb-4">Need Help Choosing the Right Package?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto font-light">
              Our aviation consultants analyze your travel patterns and route requirements to recommend 
              the most cost-effective JetCard package. Personalized guidance for optimal efficiency.
            </p>
            <button
              onClick={() => setShowConsultingModal(true)}
              className="bg-black text-white px-8 py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors text-lg flex items-center justify-center gap-3 mx-auto"
            >
              <Headphones size={20} />
              Schedule Personal Consultation
              <ArrowRight size={20} />
            </button>
          </div>
        </section>
      </main>

      <Footer />

      {/* Modals remain the same */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-light text-black">Get Package Information</h3>
              <button
                onClick={() => setShowModal(false)}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="your.email@domain.com"
                />
              </div>
              
              <div className="mb-6">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Get detailed package information including routes, aircraft availability, and pricing breakdowns.
                </p>
              </div>

              {status === 'success' ? (
                <div className="text-center">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                  <p className="text-black font-medium mb-2">Information Sent</p>
                  <p className="text-sm text-gray-500">Our team will contact you within 24 hours.</p>
                </div>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={status === 'submitting'}
                  className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
                >
                  {status === 'submitting' ? 'Sending...' : 'Get Package Details'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showConsultingModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowConsultingModal(false)}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-light text-black">Personal Consulting Request</h3>
              <button
                onClick={() => setShowConsultingModal(false)}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="your.email@domain.com"
                />
              </div>
              
              <div className="mb-6">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Schedule a consultation to discuss your travel patterns, preferred routes, and optimal package selection.
                </p>
              </div>

              {status === 'success' ? (
                <div className="text-center">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                  <p className="text-black font-medium mb-2">Consultation Scheduled</p>
                  <p className="text-sm text-gray-500">Our consultant will contact you within 12 hours.</p>
                </div>
              ) : (
                <button
                  onClick={handleConsultingSubmit}
                  disabled={status === 'submitting'}
                  className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
                >
                  {status === 'submitting' ? 'Scheduling...' : 'Schedule Consultation'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JetCard;
