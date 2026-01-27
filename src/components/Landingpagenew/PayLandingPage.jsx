import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Phone } from 'lucide-react';

const PayLandingPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  // SEO: Set document title and meta tags
  useEffect(() => {
    document.title = 'PCX Card - USDC-Backed Travel Card | PrivateCharterX';

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = 'Apply for the PCX Card - A USDC-backed Mastercard with travel benefits, staking rewards, and VIP access. From $59/month.';

    const setOgTag = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    setOgTag('og:title', 'PCX Card - USDC-Backed Travel Card | PrivateCharterX');
    setOgTag('og:description', 'The travel card powered by stablecoins. Up to 4% APY, travel discounts, and VIP access.');
    setOgTag('og:type', 'website');
    setOgTag('og:url', 'https://privatecharterx.com/pay');

    setIsVisible(true);

    return () => {
      document.title = 'PrivateCharterX';
    };
  }, []);

  const handleApply = () => {
    navigate('/home');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openPayPopup'));
    }, 100);
  };

  // Benefits list
  const benefits = [
    'USDC Wallet & Mastercard',
    'Up to 4% APY Staking',
    '10% Booking Discounts',
    'Airport Ground Transport',
    'VIP Terminal Access',
    '24/7 Concierge Support',
  ];

  // Card tiers
  const cards = [
    {
      name: 'Basic',
      price: '$59',
      color: 'bg-gradient-to-br from-gray-200 to-gray-300',
      features: ['USDC Wallet', 'Virtual Card', '5km Transport', '1-2% APY'],
    },
    {
      name: 'Gold',
      price: '$99',
      color: 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500',
      features: ['Metal Card', 'Priority eIBAN', '10km Transport', '2-3% APY'],
      popular: true,
    },
    {
      name: 'Black',
      price: '$229',
      color: 'bg-gradient-to-br from-gray-800 to-black',
      textWhite: true,
      features: ['Exclusive Black Card', 'Unlimited eIBAN', '25km Transport', '3-4% APY'],
    },
    {
      name: 'Platinum',
      price: '$399',
      color: 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300',
      features: ['JetCard Benefits', 'Fixed Jet Rates', '40km Transport', 'MEDEVAC Included'],
      badge: 'JETCARD',
    },
  ];

  return (
    <div className="min-h-screen bg-white font-['DM_Sans']">
      {/* Simple Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <img
              src="https://sgfnbormqiqgvhdfwmhz.supabase.co/storage/v1/object/public/logos//PrivatecharterX_logo_vectorized.png"
              alt="PrivateCharterX"
              className="h-7 w-auto"
            />
          </button>
          <div className="flex items-center gap-3">
            <a href="tel:+18332002057" className="hidden sm:flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
              <Phone size={14} />
              <span>(833) 200-2057</span>
            </a>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </nav>

      {/* Hero - Simple & Bold */}
      <section className="pt-24 pb-16 sm:pt-32 sm:pb-24 px-4">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full mb-6">
            <span className="text-xs text-gray-600">Powered by USDC</span>
            <img src="/Mastercard-Logo.png" alt="Mastercard" className="h-4 w-auto" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-tight mb-4">
            The card for
            <br />
            <span className="text-gray-400">modern travelers</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-500 font-light max-w-xl mx-auto mb-8">
            Spend stablecoins anywhere. Earn rewards. Access exclusive travel benefits.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <button
              onClick={handleApply}
              className="w-full sm:w-auto px-8 py-3 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight size={18} />
            </button>
            <span className="text-sm text-gray-400">From $59/month</span>
          </div>

          {/* Benefits Row */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {benefits.map((benefit, i) => (
              <span key={i} className="flex items-center gap-1.5 text-sm text-gray-600">
                <Check size={14} className="text-green-500" />
                {benefit}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2">
              Choose your card
            </h2>
            <p className="text-gray-500">Four tiers. Upgrade anytime.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, i) => (
              <div
                key={i}
                className={`relative bg-white rounded-2xl p-5 border transition-all hover:shadow-lg ${
                  card.popular ? 'border-black shadow-md' : 'border-gray-200'
                }`}
              >
                {card.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black text-white text-[10px] font-medium uppercase rounded-full">
                    Popular
                  </span>
                )}
                {card.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-600 text-white text-[10px] font-medium uppercase rounded-full">
                    {card.badge}
                  </span>
                )}

                {/* Card Visual */}
                <div
                  className={`aspect-[1.6/1] rounded-xl mb-4 ${card.color} ${card.textWhite ? 'text-white' : 'text-gray-800'} p-3 flex flex-col justify-between`}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-70">PCX {card.name}</span>
                  <div className="flex justify-between items-end">
                    <span className="text-xs opacity-60">•••• 4242</span>
                    <img src="/Mastercard-Logo.png" alt="" className="h-5 w-auto opacity-80" />
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-2xl font-light text-gray-900">{card.price}</span>
                  <span className="text-sm text-gray-400">/mo</span>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-5">
                  {card.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={14} className="text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <button
                  onClick={handleApply}
                  className={`w-full py-2.5 rounded-full text-sm font-medium transition-colors ${
                    card.popular
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Feature Grid */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2">
              Built for travelers
            </h2>
            <p className="text-gray-500">Everything you need in one card</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: 'USDC Wallet',
                desc: 'Hold and spend stablecoins. No volatility, instant settlements.',
              },
              {
                title: 'Global eIBAN',
                desc: 'EUR, USD, CHF, GBP accounts. Send & receive internationally.',
              },
              {
                title: 'Travel Rewards',
                desc: 'Up to 10% off bookings. Priority empty legs access.',
              },
              {
                title: 'Ground Transport',
                desc: 'Mercedes S-Class transfers included with every card.',
              },
              {
                title: 'Staking Rewards',
                desc: 'Earn up to 4% APY on your balance. Paid monthly.',
              },
              {
                title: 'VIP Access',
                desc: 'Skip the crowds. VIP terminal access worldwide.',
              },
            ].map((feature, i) => (
              <div key={i} className="p-5 bg-gray-50 rounded-xl">
                <h3 className="font-medium text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20 bg-black text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-light mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-400 mb-8">
            Apply in minutes. No commitment required.
          </p>
          <button
            onClick={handleApply}
            className="px-8 py-3 bg-white text-black font-medium rounded-full hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
          >
            Apply Now
            <ArrowRight size={18} />
          </button>
          <p className="text-xs text-gray-500 mt-4">
            Cancel anytime · No hidden fees
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src="https://sgfnbormqiqgvhdfwmhz.supabase.co/storage/v1/object/public/logos//PrivatecharterX_logo_vectorized.png"
                alt="PrivateCharterX"
                className="h-5 w-auto opacity-60"
              />
              <span className="text-xs text-gray-400">© 2024 PrivateCharterX</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <button onClick={() => navigate('/terms')} className="hover:text-gray-600">Terms</button>
              <button onClick={() => navigate('/privacy')} className="hover:text-gray-600">Privacy</button>
              <button onClick={() => navigate('/imprint')} className="hover:text-gray-600">Imprint</button>
            </div>
            <div className="flex items-center gap-2">
              <img src="/Mastercard-Logo.png" alt="Mastercard" className="h-5 w-auto opacity-50" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PayLandingPage;
