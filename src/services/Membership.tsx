import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, X, Star, Zap, Crown, Shield, Plane, Home, 
  Helicopter, Users, Calendar, Award, Sparkles, ArrowRight,
  ChevronDown, ChevronUp, Info, CreditCard, Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';

interface MembershipTier {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing: 'monthly' | 'yearly' | 'one-time';
  popular?: boolean;
  features: string[];
  limits: {
    emptyLegs: number;
    housing: number;
    helicopters: number;
  };
  savings?: string;
  icon: React.ReactNode;
  color: string;
  benefits: string[];
}

const membershipTiers: MembershipTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for occasional listings',
    price: 0,
    currency: 'USD',
    billing: 'monthly',
    features: [
      'Browse all listings',
      'Contact property owners',
      'Basic support',
      'Standard search filters'
    ],
    limits: {
      emptyLegs: 0,
      housing: 0,
      helicopters: 0
    },
    icon: <Users size={24} />,
    color: 'gray',
    benefits: [
      'Access to luxury marketplace',
      'Verified user badge',
      'Email notifications'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Best value for regular empty leg operations',
    price: 199,
    currency: 'USD',
    billing: 'monthly',
    popular: true,
    features: [
      'Up to 10 empty leg listings/month',
      'Up to 3 helicopter listings/month',
      'Priority listing placement',
      'Advanced analytics',
      'Priority customer support',
      'Featured listing eligibility',
      'Commission-free direct bookings'
    ],
    limits: {
      emptyLegs: 10,
      housing: 0,
      helicopters: 3
    },
    savings: 'Save up to $790/month',
    icon: <Plane size={24} />,
    color: 'blue',
    benefits: [
      'Featured in search results',
      'Advanced listing analytics',
      'Priority customer support',
      'Verified operator badge',
      'Bulk listing tools',
      'Custom branding options'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For luxury real estate and aviation companies',
    price: 499,
    currency: 'USD',
    billing: 'monthly',
    features: [
      'Unlimited empty leg listings',
      'Up to 20 luxury housing listings',
      'Unlimited helicopter listings',
      'White-label solutions',
      'Dedicated account manager',
      'Custom integrations',
      'API access',
      'Advanced reporting'
    ],
    limits: {
      emptyLegs: -1, // Unlimited
      housing: 20,
      helicopters: -1 // Unlimited
    },
    savings: 'Best value for volume',
    icon: <Crown size={24} />,
    color: 'gold',
    benefits: [
      'Unlimited aviation listings',
      'Premium luxury housing slots',
      'White-label marketplace',
      'Dedicated success manager',
      'Custom API integration',
      'Advanced analytics suite',
      'Priority listing placement',
      'Custom commission rates'
    ]
  }
];

const payAsYouGoRates = [
  {
    type: 'housing',
    name: 'Luxury Housing',
    price: 49,
    currency: 'USD',
    billing: 'per listing',
    icon: <Home size={20} />,
    description: 'List your luxury property'
  },
  {
    type: 'emptyleg',
    name: 'Empty Leg Flight',
    price: 99,
    currency: 'USD',
    billing: 'per listing',
    icon: <Plane size={20} />,
    description: 'Post your empty leg flight'
  },
  {
    type: 'helicopter',
    name: 'Helicopter Transfer',
    price: 99,
    currency: 'USD',
    billing: 'per listing',
    icon: <Helicopter size={20} />,
    description: 'List helicopter services'
  }
];

const Membership: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showFAQ, setShowFAQ] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const faqData = [
    {
      id: 'pricing',
      question: 'How does the pricing work?',
      answer: 'You can either pay per listing or choose a monthly subscription. Professional membership gives you 10 empty leg listings for $199/month, saving you up to $790 compared to individual pricing. Housing listings are always pay-per-post at $49 each.'
    },
    {
      id: 'commission',
      question: 'Do you take commission on bookings?',
      answer: 'We take a 12% commission on successful luxury housing bookings. For empty leg flights, our commission varies by membership tier - Professional members get reduced rates, while Enterprise clients can negotiate custom commission structures.'
    },
    {
      id: 'verification',
      question: 'How does verification work?',
      answer: 'All listing creators must be verified users. We verify identity documents, business licenses (for commercial operators), and aircraft/property ownership. This ensures trust and safety in our premium marketplace.'
    },
    {
      id: 'support',
      question: 'What support do you provide?',
      answer: 'Professional and Enterprise members get priority support. Enterprise clients receive dedicated account managers. All members can access our knowledge base and community forums.'
    }
  ];

  const handleSelectTier = async (tierId: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (tierId === 'starter') {
      // Free tier - just update user status
      navigate('/marketplace');
      return;
    }

    setLoading(true);
    try {
      // In a real app, integrate with Stripe for subscription management
      const tier = membershipTiers.find(t => t.id === tierId);
      if (!tier) return;

      // Simulate subscription creation
      console.log('Creating subscription for tier:', tier.name);
      
      // Redirect to marketplace after successful subscription
      setTimeout(() => {
        setLoading(false);
        navigate('/marketplace');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating subscription:', error);
      setLoading(false);
      alert('Failed to create subscription. Please try again.');
    }
  };

  const handlePayAsYouGo = (type: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    navigate('/marketplace', { state: { postType: type } });
  };

  const getTierColor = (color: string, opacity = '100') => {
    const colors = {
      gray: `bg-gray-${opacity === '100' ? '900' : '100'} text-${opacity === '100' ? 'white' : 'gray-900'}`,
      blue: `bg-blue-${opacity === '100' ? '600' : '50'} text-${opacity === '100' ? 'white' : 'blue-900'}`,
      gold: `bg-gradient-to-r from-yellow-400 to-orange-500 text-white`
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 pt-[88px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-blue-100">
              <Award size={16} />
              Membership Plans
            </div>
            <h1 className="text-4xl md:text-5xl font-thin mb-6 text-gray-900">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Join the world's most exclusive luxury marketplace. Connect with premium travelers 
              and grow your business with our verified community.
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-white rounded-2xl p-1 border border-gray-200 shadow-sm mb-12">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all relative ${
                  billingCycle === 'yearly'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  20%
                </span>
              </button>
            </div>
          </div>

          {/* Membership Tiers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {membershipTiers.map((tier) => (
              <div
                key={tier.id}
                className={`bg-white rounded-3xl border-2 transition-all duration-300 relative overflow-hidden ${
                  tier.popular 
                    ? 'border-blue-200 shadow-xl shadow-blue-100/50 scale-105' 
                    : 'border-gray-100 hover:border-gray-200 shadow-lg hover:shadow-xl'
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-2 text-sm font-medium">
                    <Star size={14} className="inline mr-1" />
                    Most Popular
                  </div>
                )}
                
                <div className={`p-8 ${tier.popular ? 'pt-12' : ''}`}>
                  {/* Tier Header */}
                  <div className="text-center mb-8">
                    <div className={`w-16 h-16 ${getTierColor(tier.color, '50')} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      {tier.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{tier.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{tier.description}</p>
                    
                    <div className="mb-4">
                      <div className="text-4xl font-bold text-gray-900">
                        {tier.price === 0 ? 'Free' : `$${tier.price}`}
                        {tier.price > 0 && (
                          <span className="text-lg text-gray-500 font-normal">
                            /{billingCycle === 'yearly' ? 'year' : 'month'}
                          </span>
                        )}
                      </div>
                      {tier.savings && (
                        <p className="text-sm text-green-600 font-medium mt-1">{tier.savings}</p>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    <h4 className="font-medium text-gray-900 text-sm">What's included:</h4>
                    <ul className="space-y-3">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Limits */}
                  <div className="bg-gray-50 rounded-2xl p-4 mb-8">
                    <h4 className="font-medium text-gray-900 text-sm mb-3">Monthly Limits:</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {tier.limits.emptyLegs === -1 ? '∞' : tier.limits.emptyLegs}
                        </div>
                        <div className="text-xs text-gray-500">Empty Legs</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {tier.limits.housing === -1 ? '∞' : tier.limits.housing}
                        </div>
                        <div className="text-xs text-gray-500">Housing</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {tier.limits.helicopters === -1 ? '∞' : tier.limits.helicopters}
                        </div>
                        <div className="text-xs text-gray-500">Helicopters</div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectTier(tier.id)}
                    disabled={loading}
                    className={`w-full py-4 rounded-2xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                      tier.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                        : tier.price === 0
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {tier.price === 0 ? 'Get Started Free' : 'Choose Plan'}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pay-as-You-Go Section */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Pay-as-You-Go</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Not ready for a subscription? Post individual listings with our flexible pay-per-post pricing.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {payAsYouGoRates.map((rate) => (
                <div key={rate.type} className="border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      {rate.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{rate.name}</h3>
                      <p className="text-sm text-gray-500">{rate.description}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      ${rate.price} {rate.currency}
                    </div>
                    <div className="text-sm text-gray-500">{rate.billing}</div>
                  </div>
                  
                  <button
                    onClick={() => handlePayAsYouGo(rate.type)}
                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Post Listing
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Features Comparison */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 mb-16">
            <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">Why Choose Membership?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={24} className="text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Premium Placement</h3>
                <p className="text-sm text-gray-600">
                  Members get priority placement in search results and featured listing eligibility.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield size={24} className="text-green-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Verified Status</h3>
                <p className="text-sm text-gray-600">
                  Verified operator badges increase trust and booking conversion rates.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap size={24} className="text-purple-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Advanced Tools</h3>
                <p className="text-sm text-gray-600">
                  Access analytics, bulk listing tools, and priority customer support.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
            
            <div className="max-w-3xl mx-auto space-y-4">
              {faqData.map((faq) => (
                <div key={faq.id} className="border border-gray-200 rounded-2xl">
                  <button
                    onClick={() => setShowFAQ(showFAQ === faq.id ? null : faq.id)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-2xl"
                  >
                    <h3 className="font-medium text-gray-900">{faq.question}</h3>
                    {showFAQ === faq.id ? (
                      <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400" />
                    )}
                  </button>
                  {showFAQ === faq.id && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-3xl p-12">
              <h2 className="text-3xl font-bold mb-4">Ready to Join the Elite?</h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Join thousands of luxury providers already growing their business with PrivateCharterX Marketplace.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => handleSelectTier('professional')}
                  className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  Start 14-Day Free Trial
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => navigate('/marketplace')}
                  className="border border-white/20 text-white px-8 py-4 rounded-2xl font-medium hover:bg-white/10 transition-colors"
                >
                  Browse Marketplace
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Modals */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
          onSuccess={() => setShowLoginModal(false)}
          onSwitchToForgotPassword={() => {
            setShowLoginModal(false);
            // You can add forgot password modal here if needed
          }}
        />
      )}

      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
          onSuccess={() => setShowRegisterModal(false)}
        />
      )}
    </div>
  );
};

export default Membership;
