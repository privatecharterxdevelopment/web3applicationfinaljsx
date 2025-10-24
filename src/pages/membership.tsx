import React, { useState } from 'react';
import {
  Check, ArrowRight, Zap, Brain, Star, Users, Clock, Shield, 
  Mail, X, Sparkles, Bot, MessageSquare, Code, Database, Globe
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Modal Component for Plan Details
const PlanDetailModal = ({ plan, onClose }) => {
  if (!plan) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-8 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-light text-black mb-2">{plan.name} Plan</h2>
            <p className="text-gray-500 font-light">{plan.description}</p>
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
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-3"></div>
                <p className="text-gray-700 font-light leading-relaxed">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Membership() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');

  const membershipPlans = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Best for personal use.',
      monthlyPrice: 29,
      annualPrice: 290,
      features: [
        '10,000 AI tokens per month',
        'Basic chat interface',
        'Standard response time',
        'Email support',
        'Mobile app access',
        'Export conversations'
      ],
      popular: false
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large teams & corporations.',
      monthlyPrice: 79,
      annualPrice: 790,
      features: [
        '50,000 AI tokens per month',
        'Advanced features',
        'Priority support',
        'API access',
        'Team collaboration',
        'Custom integrations',
        'Advanced analytics'
      ],
      popular: true
    },
    {
      id: 'business',
      name: 'Business',
      description: 'Best for business owners.',
      monthlyPrice: 199,
      annualPrice: 1990,
      features: [
        'Unlimited AI tokens',
        'Enterprise features',
        'Dedicated support',
        'Custom models',
        'White-label options',
        'On-premise deployment'
      ],
      popular: false
    }
  ];

  const getPrice = (plan) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="flex-1 pt-[88px]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 mb-6 shadow-sm">
              <span className="w-2 h-2 bg-black rounded-full"></span>
              <span className="text-sm text-gray-600 font-medium">OUR PLANS</span>
            </div>
            
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Plans for Your Need
            </h1>

            <p className="text-gray-500 mb-12 max-w-2xl mx-auto text-lg">
              Select from best plan, ensuring a perfect match. Need more or 
              less? Customize your subscription for a seamless fit!
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 mb-16">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Annually
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
            {membershipPlans.map((plan, index) => {
              const isEnterprise = plan.id === 'enterprise';
              
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-8 transition-all duration-300 ${
                    isEnterprise 
                      ? 'bg-black text-white transform scale-105' 
                      : 'bg-white border border-gray-100 hover:shadow-lg'
                  }`}
                >
                  {/* Plan Icon */}
                  <div className="text-center mb-8">
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
                      isEnterprise ? 'bg-white' : 'bg-gray-100'
                    }`}>
                      <div className={`w-6 h-6 rounded-full ${
                        isEnterprise ? 'bg-black' : 'bg-gray-400'
                      }`}></div>
                    </div>

                    <h3 className={`text-xl font-semibold mb-2 ${
                      isEnterprise ? 'text-white' : 'text-gray-900'
                    }`}>
                      {plan.name}
                    </h3>
                    
                    <p className={`text-sm mb-8 ${
                      isEnterprise ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {plan.description}
                    </p>

                    {/* Pricing */}
                    <div className="mb-8">
                      <div className="flex items-baseline justify-center gap-1 mb-2">
                        <span className={`text-4xl font-bold ${
                          isEnterprise ? 'text-white' : 'text-gray-900'
                        }`}>
                          ${getPrice(plan)}
                        </span>
                        <span className={`text-sm ${
                          isEnterprise ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          / per month
                        </span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button 
                      className={`w-full py-3 px-6 rounded-xl font-medium transition-all mb-8 ${
                        isEnterprise
                          ? 'bg-white text-black hover:bg-gray-100'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Get Started
                    </button>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className={`font-semibold mb-4 ${
                      isEnterprise ? 'text-white' : 'text-gray-900'
                    }`}>
                      Features
                    </h4>
                    <div className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start gap-3">
                          <Check size={16} className={`flex-shrink-0 mt-0.5 ${
                            isEnterprise ? 'text-white' : 'text-green-500'
                          }`} />
                          <span className={`text-sm ${
                            isEnterprise ? 'text-gray-200' : 'text-gray-600'
                          }`}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional Information Sections */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-20">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-light text-black mb-2">AI Features Included</h2>
              <p className="text-gray-500 font-light">Advanced artificial intelligence capabilities across all plans</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
              {[
                { icon: MessageSquare, label: 'AI Chat', desc: 'Intelligent conversations' },
                { icon: Code, label: 'Code Generation', desc: 'Programming assistance' },
                { icon: Database, label: 'Data Analysis', desc: 'Insights & analytics' },
                { icon: Users, label: 'Team Features', desc: 'Collaboration tools' },
                { icon: Shield, label: 'Security', desc: 'Enterprise protection' },
                { icon: Globe, label: 'API Access', desc: 'Custom integrations' },
                { icon: Clock, label: 'Support', desc: '24/7 assistance' },
                { icon: Star, label: 'Custom Models', desc: 'Tailored solutions' }
              ].map((feature, index) => (
                <div key={index} className="p-6 border-r border-b border-gray-50 hover:bg-gray-25 transition-colors">
                  <feature.icon size={24} className="text-gray-400 mb-3" />
                  <h3 className="font-medium text-black mb-1 text-sm">{feature.label}</h3>
                  <p className="text-xs text-gray-500 font-light">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20">
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl"></div>
              <div className="relative px-8 sm:px-12 py-16 sm:py-20 text-center text-white">
                <h2 className="text-3xl sm:text-4xl font-light mb-6">
                  Ready to Experience AI?
                </h2>
                <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
                  Get started with your AI journey today. Our team is available 24/7 
                  to assist with onboarding and feature customization.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="inline-flex items-center justify-center bg-white text-gray-900 px-8 py-4 rounded-2xl font-medium hover:bg-gray-100 transition-all duration-300 group">
                    Start Free Trial
                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a
                    href="mailto:admin@privatecharterx.com"
                    className="inline-flex items-center justify-center bg-transparent text-white border border-white/30 px-8 py-4 rounded-2xl font-medium hover:bg-white/10 transition-all duration-300"
                  >
                    <Mail size={16} className="mr-2" />
                    Get In Touch
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Plan Detail Modal */}
      <PlanDetailModal
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
      />
    </div>
  );
}
