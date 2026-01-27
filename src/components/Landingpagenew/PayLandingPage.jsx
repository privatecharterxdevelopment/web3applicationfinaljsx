import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, ChevronRight, Plane, Car, Sparkles, Shield,
  CreditCard, Globe, Phone, Wallet, TrendingUp, Users,
  Building2, Zap, Crown, Star, ArrowRight
} from 'lucide-react';

const PayLandingPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  // SEO: Set document title and meta tags
  useEffect(() => {
    document.title = 'Platinum JetCard - USDC-Backed Travel Card | PrivateCharterX';

    // Set meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = 'Apply for the Platinum JetCard - A USDC-backed Mastercard with fixed jet rates, MEDEVAC services, dedicated account manager, and VIP terminal access worldwide. Earn up to 4% APY.';

    // Set OG tags
    const setOgTag = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    setOgTag('og:title', 'Platinum JetCard - USDC-Backed Travel Card | PrivateCharterX');
    setOgTag('og:description', 'The ultimate travel card for private aviation. Fixed jet rates, MEDEVAC services, and 4% APY staking rewards.');
    setOgTag('og:type', 'website');
    setOgTag('og:url', 'https://privatecharterx.com/pay');

    setIsVisible(true);

    return () => {
      document.title = 'PrivateCharterX';
    };
  }, []);

  // Platinum JetCard data
  const platinumCard = {
    name: 'Platinum JetCard',
    price: '$399',
    priceDetail: 'per month',
    minTopup: 10000,
    benefits: [
      'Everything in Black Card',
      'Platinum Metal JetCard',
      'Dedicated Account Manager',
      'MEDEVAC Services Included',
      'Fixed Hourly Jet Rates',
      'Guaranteed Availability',
      'Fuel Price Protection',
      'VIP Terminal Access Worldwide',
    ],
  };

  // All card tiers for comparison
  const allCards = [
    { name: 'Basic', price: '$59/mo', highlight: false },
    { name: 'Gold', price: '$99/mo', highlight: false },
    { name: 'Black', price: '$229/mo', highlight: false },
    { name: 'Platinum', price: '$399/mo', highlight: true },
  ];

  // Feature categories
  const featureCategories = [
    {
      title: 'Banking & Payments',
      icon: Wallet,
      features: [
        { name: 'USDC Wallet', desc: 'Hold and spend stablecoins instantly' },
        { name: 'eIBAN Account', desc: 'EUR/USD/CHF/GBP virtual bank account' },
        { name: 'Mastercard Debit', desc: 'Accepted at 100M+ merchants worldwide' },
        { name: 'Instant Transfers', desc: 'Send & receive funds globally' },
      ]
    },
    {
      title: 'Travel Benefits',
      icon: Plane,
      features: [
        { name: '40km Ground Transport', desc: 'Mercedes S-Class airport transfers' },
        { name: '10% Booking Discount', desc: 'On all private jet charters' },
        { name: 'Empty Legs Priority', desc: 'First access to discounted flights' },
        { name: 'VIP Terminal Access', desc: 'Skip the crowds worldwide' },
      ]
    },
    {
      title: 'Exclusive Services',
      icon: Crown,
      features: [
        { name: 'Dedicated Manager', desc: '24/7 personal account manager' },
        { name: 'MEDEVAC Services', desc: 'Emergency medical evacuation' },
        { name: 'Fixed Jet Rates', desc: 'Locked hourly rates, no surprises' },
        { name: 'Fuel Protection', desc: 'Protected from fuel price changes' },
      ]
    },
    {
      title: 'Rewards & Staking',
      icon: TrendingUp,
      features: [
        { name: '3-4% APY Staking', desc: 'Earn on your USDC balance' },
        { name: 'PVCX Token Rewards', desc: 'Earn tokens on every booking' },
        { name: 'Referral Bonuses', desc: 'Earn when friends join' },
        { name: 'Loyalty Multipliers', desc: 'Increasing rewards over time' },
      ]
    },
  ];

  // Stats
  const stats = [
    { value: '100M+', label: 'Merchants Worldwide' },
    { value: '24/7', label: 'Concierge Support' },
    { value: '4%', label: 'Max APY on Staking' },
    { value: '10%', label: 'Booking Discounts' },
  ];

  return (
    <div className="min-h-screen bg-white font-['DM_Sans']">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <img
                  src="https://sgfnbormqiqgvhdfwmhz.supabase.co/storage/v1/object/public/logos//PrivatecharterX_logo_vectorized.png"
                  alt="PrivateCharterX"
                  className="h-8 w-auto"
                />
                <span className="font-semibold text-gray-900 hidden sm:block">PrivateCharterX</span>
              </button>
              <div className="flex items-center gap-3">
                <a href="tel:+18332002057" className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
                  <Phone size={14} />
                  (833) 200-2057
                </a>
                <button
                  onClick={() => navigate('/home')}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  Back to App
                </button>
                <button
                  onClick={() => {
                    navigate('/home');
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('openPayPopup'));
                    }, 100);
                  }}
                  className="px-5 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-900 transition-colors"
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100" />

          {/* Decorative elements */}
          <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-gray-200/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-gray-200/20 to-transparent rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/5 rounded-full mb-6">
                  <span className="text-xs font-medium text-gray-600">Web3 · USDC-Backed</span>
                  <img src="/Mastercard-Logo.png" alt="Mastercard" className="h-4 w-auto" />
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-tight mb-6">
                  Access the world.
                  <br />
                  <span className="text-gray-400">Powered by stablecoins.</span>
                </h1>

                <p className="text-lg sm:text-xl text-gray-500 font-light mb-8 max-w-lg">
                  Instant. Borderless. Rewarding. The Platinum JetCard combines crypto flexibility with luxury travel benefits.
                </p>

                {/* Key benefits inline */}
                <div className="flex flex-wrap gap-3 mb-8">
                  {['Fixed Jet Rates', 'MEDEVAC Included', '4% APY', 'VIP Access'].map((benefit) => (
                    <span key={benefit} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700">
                      <Check size={14} className="text-green-600" />
                      {benefit}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      navigate('/home');
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('openPayPopup'));
                      }, 100);
                    }}
                    className="px-8 py-4 bg-black text-white font-medium rounded-full hover:bg-gray-900 transition-all hover:scale-105 flex items-center justify-center gap-2"
                  >
                    Apply for Platinum
                    <ArrowRight size={18} />
                  </button>
                  <button
                    onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-8 py-4 border border-gray-300 text-gray-700 font-medium rounded-full hover:border-gray-400 transition-colors"
                  >
                    View All Benefits
                  </button>
                </div>
              </div>

              {/* Right: Card Visual */}
              <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="relative mx-auto max-w-md">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-300/50 via-white/30 to-gray-400/50 rounded-3xl blur-2xl scale-110" />

                  {/* Card */}
                  <div
                    className="relative aspect-[1.6/1] rounded-2xl shadow-2xl overflow-hidden"
                    style={{
                      background: 'linear-gradient(145deg, #e5e4e2 0%, #c0c0c0 20%, #e8e8e8 40%, #b8b8b8 60%, #d4d4d4 80%, #a8a8a8 100%)'
                    }}
                  >
                    {/* Card content */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Platinum JetCard</p>
                          <p className="text-lg font-light text-gray-800">PrivateCharterX</p>
                        </div>
                        <img src="/Mastercard-Logo.png" alt="Mastercard" className="h-8 w-auto" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Card Number</p>
                        <p className="text-lg tracking-widest text-gray-700 font-light">•••• •••• •••• 4242</p>
                      </div>
                    </div>

                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
                  </div>

                  {/* Price tag */}
                  <div className="absolute -bottom-4 -right-4 bg-black text-white px-4 py-2 rounded-full shadow-lg">
                    <span className="text-lg font-semibold">$399</span>
                    <span className="text-xs text-gray-400">/month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-gray-50 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-3xl sm:text-4xl font-light text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-4">
                Everything included with Platinum
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                The most comprehensive travel card for private aviation enthusiasts and frequent flyers.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              {featureCategories.map((category, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-2xl p-6 sm:p-8 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                      <category.icon size={20} className="text-white" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900">{category.title}</h3>
                  </div>
                  <div className="space-y-4">
                    {category.features.map((feature, fIndex) => (
                      <div key={fIndex} className="flex items-start gap-3">
                        <Check size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-900 font-medium">{feature.name}</p>
                          <p className="text-sm text-gray-500">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platinum Benefits List */}
        <section className="py-16 sm:py-24 bg-black text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Platinum Exclusive</p>
                <h2 className="text-3xl sm:text-4xl font-light mb-6">
                  Benefits reserved for our top members
                </h2>
                <p className="text-gray-400 mb-8">
                  The Platinum JetCard unlocks the highest tier of benefits, including services not available on any other card level.
                </p>
                <div className="space-y-4">
                  {platinumCard.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={14} className="text-white" />
                      </div>
                      <span className="text-gray-200">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-600/30 to-gray-800/30 rounded-3xl blur-2xl scale-110" />
                  <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Starting at</p>
                    <p className="text-5xl font-light mb-1">$399</p>
                    <p className="text-gray-400 mb-6">per month</p>
                    <div className="space-y-3 mb-8">
                      <p className="text-sm text-gray-300 flex items-center gap-2">
                        <Check size={16} className="text-green-500" />
                        $10,000 minimum top-up
                      </p>
                      <p className="text-sm text-gray-300 flex items-center gap-2">
                        <Check size={16} className="text-green-500" />
                        Enhanced KYC verification
                      </p>
                      <p className="text-sm text-gray-300 flex items-center gap-2">
                        <Check size={16} className="text-green-500" />
                        Cancel anytime
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigate('/home');
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('openPayPopup'));
                        }, 100);
                      }}
                      className="w-full py-3 bg-white text-black font-medium rounded-full hover:bg-gray-100 transition-colors"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Card Tiers Comparison */}
        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-4">
                Choose your card
              </h2>
              <p className="text-gray-500">
                Four tiers to match your lifestyle. Start with Basic, upgrade anytime.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {allCards.map((card, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    card.highlight
                      ? 'border-black bg-black text-white scale-105'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {card.highlight && (
                    <span className="inline-block px-2 py-0.5 bg-white text-black text-[10px] font-semibold uppercase rounded-full mb-3">
                      Most Popular
                    </span>
                  )}
                  <h3 className={`text-xl font-medium mb-2 ${card.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {card.name}
                  </h3>
                  <p className={`text-2xl font-light ${card.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {card.price}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => {
                  navigate('/home');
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('openPayPopup'));
                  }, 100);
                }}
                className="px-8 py-3 bg-black text-white font-medium rounded-full hover:bg-gray-900 transition-colors"
              >
                Compare All Cards
              </button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-24 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-6">
              Ready to elevate your travel?
            </h2>
            <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
              Join thousands of members who trust PrivateCharterX for seamless private aviation and banking.
            </p>
            <button
              onClick={() => {
                navigate('/home');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('openPayPopup'));
                }, 100);
              }}
              className="px-10 py-4 bg-black text-white font-medium rounded-full hover:bg-gray-900 transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              Start Your Application
              <ArrowRight size={18} />
            </button>
            <p className="text-sm text-gray-400 mt-4">
              No commitment. Cancel anytime.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <img
                  src="https://sgfnbormqiqgvhdfwmhz.supabase.co/storage/v1/object/public/logos//PrivatecharterX_logo_vectorized.png"
                  alt="PrivateCharterX"
                  className="h-6 w-auto"
                />
                <span className="text-sm text-gray-500">© 2024 PrivateCharterX</span>
              </div>
              <div className="flex items-center gap-6">
                <button onClick={() => navigate('/terms')} className="text-sm text-gray-500 hover:text-gray-900">Terms</button>
                <button onClick={() => navigate('/privacy')} className="text-sm text-gray-500 hover:text-gray-900">Privacy</button>
                <button onClick={() => navigate('/imprint')} className="text-sm text-gray-500 hover:text-gray-900">Imprint</button>
              </div>
              <div className="flex items-center gap-2">
                <img src="/Mastercard-Logo.png" alt="Mastercard" className="h-6 w-auto opacity-60" />
                <span className="text-xs text-gray-400">Accepted worldwide</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
  );
};

export default PayLandingPage;
