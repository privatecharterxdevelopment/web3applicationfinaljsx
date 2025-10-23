import React from 'react';
import { useAuth } from '../../../thefinalwebapplicationpcx-main/src/context/AuthContext';

const PricingPackages = () => {
  const { user } = useAuth();
  const plans = [
    {
      id: 'free',
      name: 'EXPLORER',
      price: null,
      chats: 2,
      period: 'total',
      stripeLink: 'https://sphera.ai/signup',
      features: [
        '2 AI Conversations',
        'Text Only',
        'Try Sphera AI',
        'No Credit Card'
      ]
    },
    {
      id: 'starter',
      name: 'STARTER',
      price: 79,
      chats: 15,
      period: 'month',
      stripeLink: 'https://buy.stripe.com/starter',
      features: [
        '15 AI Conversations',
        'Voice & Text Support',
        'Real-time Availability',
        'Basic Route Planning',
        'Email Support'
      ]
    },
    {
      id: 'pro',
      name: 'PROFESSIONAL',
      price: 149,
      chats: 30,
      period: 'month',
      stripeLink: 'https://buy.stripe.com/pro',
      badge: 'MOST POPULAR',
      popular: true,
      features: [
        '30 AI Conversations',
        'Everything in Starter',
        'Priority Support',
        'Advanced Analytics',
        'Dedicated Manager',
        'Custom Flight Requests'
      ]
    },
    {
      id: 'elite',
      name: 'ELITE',
      price: null,
      chats: null,
      period: 'custom',
      isCustom: true,
      contactLink: 'mailto:elite@sphera.ai',
      badge: 'CUSTOM',
      features: [
        'Unlimited Conversations',
        'Everything in Professional',
        'Unlimited Voice Calls',
        '24/7 Concierge Service',
        'White Glove Treatment',
        'API Access',
        'Dedicated Account Team',
        'Custom Integration'
      ]
    }
  ];

  const handlePlanClick = (plan) => {
    if (plan.isCustom) {
      window.location.href = plan.contactLink;
    } else {
      window.location.href = plan.stripeLink;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] py-16 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="h-px w-12 bg-black/20 mb-6 mx-auto" />
          <p className="text-xs tracking-[0.3em] uppercase text-black/40 mb-3 font-light">Pricing</p>
          <h1 className="text-4xl font-light text-black tracking-tight mb-3">Choose Your Plan</h1>
          <p className="text-sm text-black/40 font-light">Select the perfect journey for your needs</p>
          <div className="h-px w-12 bg-black/20 mx-auto mt-6" />
        </div>

        {/* Free Plan - Horizontal Bar */}
        {plans.filter(p => p.id === 'free').map((plan) => (
          <div
            key={plan.id}
            onClick={() => handlePlanClick(plan)}
            className="mb-8 bg-white/60 backdrop-blur-xl border border-black/10 rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.01]"
          >
            <div className="flex flex-wrap items-center justify-between gap-6">
              {/* Left: Plan Info */}
              <div className="flex-1 min-w-[200px]">
                <p className="text-[10px] tracking-[0.3em] uppercase text-black/40 mb-1 font-light">Plan</p>
                <h3 className="text-2xl font-light text-black tracking-tight mb-2">{plan.name}</h3>
                <p className="text-3xl font-light text-black">Free</p>
              </div>

              {/* Middle: Features */}
              <div className="flex-1 min-w-[300px]">
                <p className="text-[10px] tracking-[0.2em] uppercase text-black/40 mb-3 font-light">Includes</p>
                <div className="flex flex-wrap gap-4">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-black/20" />
                      <p className="text-xs text-black/60 font-light">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: CTA */}
              <div className="flex-shrink-0">
                <button className="bg-gray-400 text-white px-8 py-3 rounded-2xl text-xs tracking-[0.2em] uppercase font-light cursor-default whitespace-nowrap" disabled>
                  In Usage
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Paid Plans - Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.filter(p => p.id !== 'free').map((plan) => (
            <div
              key={plan.id}
              onClick={() => handlePlanClick(plan)}
              className={`relative backdrop-blur-xl rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                plan.popular 
                  ? 'bg-white/80 border-2 border-black' 
                  : 'bg-white/60 border border-black/10'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute top-0 right-0 bg-black text-white px-3 py-1 text-[9px] tracking-[0.2em] font-light">
                  {plan.badge}
                </div>
              )}

              <div className="p-8">
                {/* Plan Name */}
                <div className="mb-8">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-black/40 mb-2 font-light">Plan</p>
                  <h3 className="text-xl font-light text-black tracking-tight">{plan.name}</h3>
                </div>

                {/* Price */}
                <div className="mb-8 pb-8 border-b border-black/10">
                  {plan.price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-light text-black">${plan.price}</span>
                      <span className="text-sm text-black/40 font-light">/month</span>
                    </div>
                  ) : plan.isCustom ? (
                    <div>
                      <p className="text-2xl font-light text-black mb-1">Custom Pricing</p>
                      <p className="text-xs text-black/40 font-light">Tailored to your needs</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-5xl font-light text-black mb-1">Free</p>
                      <p className="text-xs text-black/40 font-light">No credit card required</p>
                    </div>
                  )}
                </div>

                {/* Chat Count */}
                <div className="mb-8 pb-8 border-b border-black/10">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-black/40 mb-2 font-light">Conversations</p>
                  {plan.chats !== null ? (
                    <p className="text-2xl font-light text-black">
                      {plan.chats} <span className="text-sm text-black/40">
                        {plan.period === 'total' ? 'total' : 'per month'}
                      </span>
                    </p>
                  ) : (
                    <p className="text-2xl font-light text-black">Unlimited</p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-black/40 mb-4 font-light">Includes</p>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-1 h-1 rounded-full bg-black/20 mt-2 flex-shrink-0" />
                      <p className="text-xs text-black/60 font-light leading-relaxed">{feature}</p>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button 
                  className={`w-full py-3 rounded-2xl text-xs tracking-[0.2em] uppercase font-light transition-all ${
                    plan.id === 'free' 
                      ? 'bg-gray-400 text-white cursor-default' 
                      : 'bg-black text-white hover:bg-black/80'
                  }`}
                  disabled={plan.id === 'free'}
                >
                  {plan.id === 'free' ? 'In Usage' : plan.isCustom ? 'Contact Us' : 'Select Plan'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-xs text-black/30 font-light">All plans include secure payments and instant confirmations</p>
        </div>
      </div>
    </div>
  );
};

export default PricingPackages;