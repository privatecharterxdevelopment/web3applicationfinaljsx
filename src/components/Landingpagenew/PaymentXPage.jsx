import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, ArrowRight, Phone, Shield, Zap, Globe,
  CreditCard, Wallet, Car, Plane, Building2, Users,
  TrendingUp, Lock, Headphones, Star
} from 'lucide-react';

const PaymentXPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [cardRotation, setCardRotation] = useState({ x: 0, y: 0 });

  // SEO: Set document title and meta tags
  useEffect(() => {
    document.title = 'PaymentX - USDC Debit Card for Business & Travel | PrivateCharterX';

    const setMetaTag = (name, content) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = name;
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    const setOgTag = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    // Primary SEO meta tags
    setMetaTag('description', 'PaymentX - The premium USDC-backed debit card for business travelers and corporations. Earn up to 4% APY, enjoy airport transfers, and access exclusive travel benefits. Apply now.');
    setMetaTag('keywords', 'USDC debit card, stablecoin card, crypto debit card, business travel card, corporate card, premium debit card, Mastercard, airport transfer, travel rewards, staking rewards');
    setMetaTag('author', 'PrivateCharterX');
    setMetaTag('robots', 'index, follow');

    // Open Graph tags
    setOgTag('og:title', 'PaymentX - USDC Debit Card for Business & Travel');
    setOgTag('og:description', 'Premium stablecoin-backed Mastercard with up to 4% APY, complimentary airport transfers, and exclusive travel discounts.');
    setOgTag('og:type', 'website');
    setOgTag('og:url', 'https://privatecharterx.com/paymentx');
    setOgTag('og:image', 'https://privatecharterx.com/card-preview.png');

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', 'PaymentX - USDC Debit Card');
    setMetaTag('twitter:description', 'The premium stablecoin card for modern travelers. Up to 4% APY, travel benefits included.');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = 'https://privatecharterx.com/paymentx';

    // Structured Data (JSON-LD)
    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "PaymentX USDC Debit Card",
      "description": "Premium USDC-backed Mastercard debit card with staking rewards and travel benefits",
      "brand": {
        "@type": "Brand",
        "name": "PrivateCharterX"
      },
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": "59",
        "highPrice": "399",
        "priceCurrency": "USD",
        "offerCount": "5"
      }
    });

    setIsVisible(true);

    return () => {
      document.title = 'PrivateCharterX';
    };
  }, []);

  // Card 3D hover effect
  const handleCardMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCardRotation({ x: y * 20, y: -x * 20 });
  };

  const handleCardMouseLeave = () => {
    setCardRotation({ x: 0, y: 0 });
  };

  const handleApply = () => {
    navigate('/home');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openPayPopup'));
    }, 100);
  };

  // All benefits organized by category
  const benefitCategories = [
    {
      title: 'Payments & Banking',
      icon: Wallet,
      benefits: [
        { title: 'USDC Wallet', desc: 'Hold stablecoins with zero volatility' },
        { title: 'Virtual & Physical Card', desc: 'Mastercard accepted worldwide' },
        { title: 'Multi-Currency eIBAN', desc: 'EUR, USD, CHF, GBP accounts' },
        { title: 'Instant Settlements', desc: 'Real-time transaction processing' },
      ]
    },
    {
      title: 'Rewards & Staking',
      icon: TrendingUp,
      benefits: [
        { title: 'Up to 4% APY', desc: 'Earn yield on your USDC balance' },
        { title: 'Monthly Payouts', desc: 'Staking rewards paid monthly' },
        { title: 'No Lock-up Period', desc: 'Withdraw anytime, keep earning' },
        { title: 'PVCX Token Rewards', desc: 'Bonus tokens for Crew cardholders' },
      ]
    },
    {
      title: 'Travel Benefits',
      icon: Plane,
      benefits: [
        { title: 'Airport Ground Transport', desc: '5-40 km Mercedes S-Class included' },
        { title: 'Private Jet Discounts', desc: 'Up to 10% off charter bookings' },
        { title: 'Empty Legs Access', desc: 'Priority access to discounted flights' },
        { title: 'Hotel Discounts', desc: 'Up to 10% at partner hotels' },
      ]
    },
    {
      title: 'Premium Services',
      icon: Headphones,
      benefits: [
        { title: '24/7 Concierge', desc: 'Personal assistance anytime' },
        { title: 'AI Travel Assistant', desc: 'Intelligent booking recommendations' },
        { title: 'VIP Terminal Access', desc: 'Skip the crowds worldwide' },
        { title: 'Priority Support', desc: 'Dedicated support line' },
      ]
    },
    {
      title: 'Corporate Features',
      icon: Building2,
      benefits: [
        { title: 'Multi-User Cards', desc: 'Issue cards to your team' },
        { title: 'Expense Management', desc: 'Real-time tracking & controls' },
        { title: 'Corporate Credit Lines', desc: '$50K - $2M credit facility' },
        { title: 'VAT-Compliant Invoicing', desc: 'Automated tax documentation' },
      ]
    },
    {
      title: 'Security & Compliance',
      icon: Shield,
      benefits: [
        { title: 'Swiss Regulated', desc: 'EMI licensed, MiCA compliant' },
        { title: 'Biometric Security', desc: 'Face ID & fingerprint protection' },
        { title: 'Fraud Protection', desc: 'AI-powered fraud detection' },
        { title: 'Instant Card Lock', desc: 'Freeze your card in seconds' },
      ]
    },
  ];

  // Card tiers for comparison
  const cardTiers = [
    { name: 'Basic', price: '$59', transport: '5 km', apy: '1-2%', color: '#b8b8b8' },
    { name: 'Gold', price: '$99', transport: '10 km', apy: '2-3%', color: '#d4af37', popular: true },
    { name: 'Crew', price: '$129', transport: '15 km', apy: '2-4%', color: '#2d5a87', badge: 'CREW' },
    { name: 'Black', price: '$229', transport: '25 km', apy: '3-4%', color: '#1a1a1a' },
    { name: 'Platinum', price: '$399', transport: '40 km', apy: '3-4%', color: '#a8a8a8', badge: 'JETCARD' },
  ];

  return (
    <div className="min-h-screen bg-white font-['DM_Sans']">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-3">
            <img
              src="https://sgfnbormqiqgvhdfwmhz.supabase.co/storage/v1/object/public/logos//PrivatecharterX_logo_vectorized.png"
              alt="PrivateCharterX"
              className="h-8 w-auto"
            />
          </button>
          <div className="flex items-center gap-4">
            <a href="tel:+18332002057" className="hidden md:flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <Phone size={16} />
              <span>(833) 200-2057</span>
            </a>
            <button onClick={() => navigate('/home')} className="text-sm text-gray-600 hover:text-gray-900">
              Dashboard
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
            >
              Apply Now
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* Left: Content */}
            <div className={`flex-1 text-center lg:text-left transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full mb-6">
                <Zap size={14} className="text-yellow-500" />
                <span className="text-xs font-medium text-gray-700">USDC-Powered Fintech Card</span>
                <img src="/Mastercard-Logo.png" alt="Mastercard" className="h-4 w-auto" />
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light text-gray-900 leading-[1.1] mb-6">
                The Future of
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900">
                  Business Payments
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-gray-500 font-light max-w-xl mx-auto lg:mx-0 mb-8">
                PaymentX combines stablecoin efficiency with premium travel benefits.
                Earn rewards, access exclusive perks, and pay anywhere Mastercard is accepted.
              </p>

              {/* Key stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-10">
                <div className="text-center lg:text-left">
                  <p className="text-2xl font-light text-gray-900">4%</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">APY Rewards</p>
                </div>
                <div className="w-px h-12 bg-gray-200 hidden sm:block" />
                <div className="text-center lg:text-left">
                  <p className="text-2xl font-light text-gray-900">10%</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Travel Discounts</p>
                </div>
                <div className="w-px h-12 bg-gray-200 hidden sm:block" />
                <div className="text-center lg:text-left">
                  <p className="text-2xl font-light text-gray-900">40 km</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Free Transport</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={handleApply}
                  className="w-full sm:w-auto px-8 py-4 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20"
                >
                  Get Your Card
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => navigate('/pay')}
                  className="w-full sm:w-auto px-8 py-4 border border-gray-300 text-gray-700 font-medium rounded-full hover:border-gray-400 transition-colors"
                >
                  Compare Plans
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center lg:justify-start gap-6 mt-8">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Shield size={14} />
                  <span>Swiss Regulated</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Lock size={14} />
                  <span>Bank-grade Security</span>
                </div>
              </div>
            </div>

            {/* Right: 3D Card */}
            <div
              className={`flex-1 flex justify-center lg:justify-end transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div
                className="relative"
                style={{
                  perspective: '1000px',
                }}
              >
                {/* Card */}
                <div
                  className="w-[300px] sm:w-[360px] lg:w-[420px] aspect-[1.586/1] rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col justify-between transition-transform duration-200 ease-out"
                  style={{
                    background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 30%, #1a1a1a 60%, #0d0d0d 100%)',
                    transform: `rotateX(${cardRotation.x}deg) rotateY(${cardRotation.y}deg)`,
                    boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {/* Shine effect */}
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      background: `linear-gradient(${135 + cardRotation.y * 2}deg, rgba(255,255,255,0.15) 0%, transparent 50%)`,
                    }}
                  />

                  {/* Top */}
                  <div className="flex justify-between items-start relative z-10">
                    <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-[0.2em]">PrivateCharterX</p>
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-500 opacity-80" />
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-yellow-500 opacity-80" />
                    </div>
                  </div>

                  {/* Chip */}
                  <div className="relative z-10 my-4">
                    <div className="w-10 h-8 sm:w-12 sm:h-10 rounded-md bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-400 opacity-90" />
                  </div>

                  {/* Card Number */}
                  <div className="relative z-10">
                    <p className="text-white/60 text-sm sm:text-base tracking-[0.3em] font-light">
                      •••• •••• •••• 4242
                    </p>
                  </div>

                  {/* Bottom */}
                  <div className="flex justify-between items-end relative z-10 mt-4">
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-1">Cardholder</p>
                      <p className="text-white text-sm sm:text-base tracking-wider">YOUR NAME</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-1">Expires</p>
                      <p className="text-white text-sm sm:text-base">12/29</p>
                    </div>
                  </div>

                  {/* Contactless */}
                  <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 text-gray-500">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8.5 14.5c1.5-2 4.5-2 6 0" />
                      <path d="M6 12c2.5-3.5 9.5-3.5 12 0" />
                      <path d="M3.5 9.5c4-5 13-5 17 0" />
                    </svg>
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-full shadow-lg">
                  4% APY
                </div>
                <div className="absolute -bottom-4 -left-4 px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-full shadow-lg border">
                  USDC Backed
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 lg:py-32 bg-gray-50" id="benefits">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Complete Feature Set</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              From daily payments to exclusive travel perks, PaymentX delivers a complete financial solution for modern professionals.
            </p>
          </div>

          {/* Benefits Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefitCategories.map((category, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
              >
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-900">{category.title}</h3>
                </div>

                {/* Benefits List */}
                <ul className="space-y-4">
                  {category.benefits.map((benefit, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{benefit.title}</p>
                        <p className="text-xs text-gray-500">{benefit.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Card Tiers Quick Compare */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-4">
              Choose Your Card
            </h2>
            <p className="text-gray-500">Five tiers designed for every need. Upgrade anytime.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {cardTiers.map((tier, i) => (
              <div
                key={i}
                className={`relative bg-white rounded-xl p-4 border transition-all hover:shadow-lg cursor-pointer ${
                  tier.popular ? 'border-black shadow-md' : 'border-gray-200'
                }`}
                onClick={handleApply}
              >
                {tier.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black text-white text-[9px] font-medium uppercase rounded-full">
                    Popular
                  </span>
                )}
                {tier.badge && !tier.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-700 text-white text-[9px] font-medium uppercase rounded-full">
                    {tier.badge}
                  </span>
                )}

                {/* Mini Card Visual */}
                <div
                  className="aspect-[1.6/1] rounded-lg mb-3"
                  style={{ background: `linear-gradient(145deg, ${tier.color}, ${tier.color}dd)` }}
                />

                <h4 className="font-medium text-gray-900 text-sm">{tier.name}</h4>
                <p className="text-lg font-light text-gray-900">{tier.price}<span className="text-xs text-gray-400">/mo</span></p>

                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                  <p className="text-[10px] text-gray-500">{tier.transport} transport</p>
                  <p className="text-[10px] text-gray-500">{tier.apy} APY</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={handleApply}
              className="px-8 py-3 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
            >
              Start Application
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Corporate Section */}
      <section className="py-20 lg:py-32 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full mb-6">
                <Building2 size={14} />
                <span className="text-xs">Corporate Solutions</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light mb-6">
                Built for Business
              </h2>

              <p className="text-gray-400 text-lg mb-8 max-w-lg">
                From startups to enterprises, PaymentX Corporate delivers the tools your finance team needs.
                Multi-user cards, real-time expense tracking, and credit lines up to $2M.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  'Unlimited employee cards with custom limits',
                  'Real-time expense management dashboard',
                  'Corporate credit lines ($50K - $2M)',
                  'VAT-compliant invoicing & reporting',
                  'Dedicated account management',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/home')}
                className="px-8 py-4 bg-white text-black font-medium rounded-full hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
              >
                Contact Sales
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="flex-1 flex justify-center">
              <div className="relative">
                {/* Stacked cards effect */}
                <div className="absolute -top-4 -left-4 w-64 h-40 rounded-xl bg-gray-800 transform -rotate-6" />
                <div className="absolute -top-2 -left-2 w-64 h-40 rounded-xl bg-gray-700 transform -rotate-3" />
                <div className="relative w-64 h-40 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <p className="text-[8px] text-gray-400 uppercase tracking-widest">Corporate</p>
                    <Users size={16} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-500 uppercase mb-1">Company</p>
                    <p className="text-white text-sm">Your Business Name</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
            ))}
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900 mb-6">
            Ready to Transform Your Payments?
          </h2>

          <p className="text-gray-500 text-lg mb-10">
            Join thousands of professionals who've upgraded to PaymentX.
            Apply in minutes, get approved instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleApply}
              className="w-full sm:w-auto px-10 py-4 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              Apply Now
              <ArrowRight size={18} />
            </button>
            <p className="text-sm text-gray-400">From $59/month · Cancel anytime</p>
          </div>

          {/* Trust logos */}
          <div className="flex items-center justify-center gap-8 mt-12 opacity-50">
            <img src="/Mastercard-Logo.png" alt="Mastercard" className="h-8 w-auto" />
            <span className="text-xs text-gray-400">Powered by USDC</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src="https://sgfnbormqiqgvhdfwmhz.supabase.co/storage/v1/object/public/logos//PrivatecharterX_logo_vectorized.png"
                alt="PrivateCharterX"
                className="h-6 w-auto opacity-60"
              />
              <span className="text-xs text-gray-400">© 2026 PrivateCharterX AG</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-gray-400">
              <button onClick={() => navigate('/terms')} className="hover:text-gray-600">Terms</button>
              <button onClick={() => navigate('/privacy')} className="hover:text-gray-600">Privacy</button>
              <button onClick={() => navigate('/imprint')} className="hover:text-gray-600">Imprint</button>
              <a href="tel:+18332002057" className="hover:text-gray-600">(833) 200-2057</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PaymentXPage;
