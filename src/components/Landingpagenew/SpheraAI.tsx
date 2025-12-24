import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LandingHeader from './LandingHeader';
import Footer from './Footer';
import {
  MessageSquare,
  Sparkles,
  Plane,
  Car,
  Ship,
  Wine,
  MapPin,
  Clock,
  Shield,
  Zap,
  Globe,
  Check,
  ArrowRight,
  Bot,
  Brain,
  Mic,
  Image,
  ChevronDown,
  Hotel,
  UtensilsCrossed,
  Cigarette,
  Package,
  HeartPulse,
  FileText,
  Calculator,
  Navigation
} from 'lucide-react';

interface SpheraAIProps {
  setCurrentPage: (page: string) => void;
}

function SpheraAI({ setCurrentPage }: SpheraAIProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedFaq, setExpandedFaq] = React.useState<string | null>(null);

  // Scroll to pricing section if hash is #pricing
  useEffect(() => {
    if (location.hash === '#pricing') {
      setTimeout(() => {
        const pricingSection = document.getElementById('pricing');
        if (pricingSection) {
          pricingSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.hash]);

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const capabilities = [
    {
      icon: Plane,
      title: 'Private Jets',
      description: 'Search and book private jets from light jets to ultra-long-range aircraft for any destination'
    },
    {
      icon: Navigation,
      title: 'Empty Legs',
      description: 'Find discounted one-way flights on repositioning jets with real-time availability'
    },
    {
      icon: Bot,
      title: 'Helicopters',
      description: 'Book helicopter transfers, city-to-city flights, and scenic tours worldwide'
    },
    {
      icon: Ship,
      title: 'Yachts & Adventures',
      description: 'Discover yacht charters, superyachts, sailing experiences and maritime adventures'
    },
    {
      icon: Car,
      title: 'Luxury & Sports Cars',
      description: 'Rent Ferraris, Lamborghinis, Rolls-Royces, and premium vehicles in any city'
    },
    {
      icon: Navigation,
      title: 'Airport Transfers',
      description: 'Professional chauffeur services, VIP transfers, and multi-vehicle arrangements'
    },
    {
      icon: Hotel,
      title: 'Luxury Hotels',
      description: 'Search and book 5-star hotels, resorts, and exclusive accommodations worldwide'
    },
    {
      icon: Wine,
      title: 'Wine & Sommelier',
      description: 'Personalized wine recommendations, rare vintages, and champagne selections'
    },
    {
      icon: UtensilsCrossed,
      title: 'Delicatessen & Gourmet',
      description: 'Premium caviar, truffles, foie gras, and luxury food items delivered anywhere'
    },
    {
      icon: Cigarette,
      title: 'Fine Cigars',
      description: 'Curated selection of Cuban cigars, rare tobaccos, and premium smoking accessories'
    },
    {
      icon: MapPin,
      title: 'Restaurants',
      description: 'Find Michelin-starred restaurants, make reservations, and arrange transfers'
    },
    {
      icon: Package,
      title: 'Trip Packages',
      description: 'Build complete multi-leg journeys combining flights, cars, hotels, and experiences'
    },
    {
      icon: HeartPulse,
      title: 'MEDEVAC Services',
      description: 'Emergency medical evacuation, air ambulance, and repatriation services (Elite tier)'
    },
    {
      icon: FileText,
      title: 'Visa Assistance',
      description: 'Visa application support, documentation help, and travel permit services'
    },
    {
      icon: Calculator,
      title: 'Price Calculator',
      description: 'Get instant flight estimates based on route, aircraft type, and passengers'
    },
    {
      icon: Globe,
      title: 'Concierge Services',
      description: 'Custom requests, event planning, tickets, and exclusive VIP experiences'
    }
  ];

  const features = [
    {
      icon: Brain,
      title: 'Advanced AI Intelligence',
      description: 'State-of-the-art reasoning and natural conversation for seamless travel planning'
    },
    {
      icon: Zap,
      title: 'Real-Time Results',
      description: 'Live pricing, availability, and instant booking capabilities'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your conversations are encrypted and never shared with third parties'
    },
    {
      icon: Clock,
      title: '24/7 Available',
      description: 'Your AI concierge is always ready to assist, day or night'
    }
  ];

  const faqs = [
    {
      id: 'what-is',
      question: 'What is Sphera AI?',
      answer: 'Sphera AI is your personal luxury lifestyle concierge powered by advanced AI. It offers 16 integrated capabilities: private jets, empty legs, helicopters, yachts, luxury cars, airport transfers, hotels, wine & sommelier, delicatessen, cigars, restaurants, trip packages, MEDEVAC services, visa assistance, price calculation, and custom concierge requests — all through natural conversation.'
    },
    {
      id: 'how-works',
      question: 'How does Sphera AI work?',
      answer: 'Simply type your request in natural language. Sphera AI understands context, remembers your preferences, and handles complex multi-step requests. It connects to our real-time booking systems for live pricing and availability, can build complete trip packages, and adds items directly to your cart.'
    },
    {
      id: 'subscription',
      question: 'Do I need a subscription?',
      answer: 'Yes, Sphera AI is available through our subscription plans: Explorer ($49/mo - 5 chats, 10 messages each), Traveller ($99/mo - 10 chats, 25 messages each), and Elite ($399/mo - unlimited chats and messages). Elite members also get exclusive access to MEDEVAC services.'
    },
    {
      id: 'booking',
      question: 'Can Sphera AI actually book services?',
      answer: 'Yes! Sphera AI can search real inventory, get instant price quotes, and add items to your cart. For jets, helicopters, yachts, and premium services, our team reviews and confirms bookings. Restaurant reservations and simpler requests are processed directly.'
    },
    {
      id: 'capabilities',
      question: 'What services can I access?',
      answer: 'Aviation (private jets, empty legs, helicopters, MEDEVAC), Ground (luxury cars, sports cars, chauffeur services, airport transfers), Maritime (yachts, superyachts, adventures), Hospitality (hotels, restaurants, reservations), Lifestyle (wines, champagnes, delicatessen, cigars), and Concierge (visa assistance, event planning, custom requests).'
    },
    {
      id: 'languages',
      question: 'What languages does Sphera AI support?',
      answer: 'Sphera AI can understand and respond in multiple languages including English, German, French, Spanish, Italian, Portuguese, Russian, Chinese, Arabic, and more. Simply write in your preferred language.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-4">
      <LandingHeader />

      {/* Hero Section - ChatGPT Style Mockup */}
      <section className="px-4 sm:px-8 py-8 sm:py-12 max-w-6xl mx-auto">
        {/* Gradient Background Container */}
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #dee2e6 50%, #ced4da 75%, #adb5bd 100%)',
            minHeight: '600px'
          }}
        >
          {/* Subtle Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.5) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.4) 0%, transparent 50%)'
            }}
          />

          {/* Content */}
          <div className="relative z-10 px-6 sm:px-12 py-12 sm:py-16">
            {/* Header - Centered */}
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-medium tracking-wide uppercase mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Concierge
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-3">
                Meet Sphera AI
              </h1>
              <p className="text-gray-700 text-sm md:text-base max-w-xl mx-auto font-light">
                Book jets, discover wines, arrange transfers, and more through natural conversation.
              </p>
            </div>

            {/* Floating Chat Window Mockup */}
            <div className="max-w-4xl mx-auto">
              <div
                className="bg-white/95 rounded-2xl shadow-2xl overflow-hidden border border-white/50"
                style={{ backdropFilter: 'blur(20px)' }}
              >
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-100/80 border-b border-gray-200/60">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 bg-white/60 rounded-md text-xs text-gray-500 font-light">
                      privatecharterx.com/dashboard/chat
                    </div>
                  </div>
                </div>

                {/* Chat Interface */}
                <div className="flex" style={{ height: '420px' }}>
                  {/* Sidebar */}
                  <div className="w-48 bg-gray-50/80 border-r border-gray-200/60 p-3 hidden sm:block relative">
                    <div className="flex items-center mb-4">
                      <img
                        src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/PrivatecharterX_logo_vectorized.glb.png"
                        alt="PrivateCharterX"
                        className="h-7 w-auto object-contain"
                      />
                    </div>
                    <button className="w-full flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-700 mb-3">
                      <span>+</span> New Chat
                    </button>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 px-1">History</div>
                    <div className="space-y-1">
                      <div className="px-2 py-1.5 bg-gray-100/80 rounded text-[11px] text-gray-600 truncate">Wine recommendations</div>
                      <div className="px-2 py-1.5 text-[11px] text-gray-500 truncate">Private jet to Monaco</div>
                      <div className="px-2 py-1.5 text-[11px] text-gray-500 truncate">Airport transfer LAX</div>
                    </div>
                    <div className="absolute bottom-4 left-3 right-3 hidden sm:block">
                      <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-gray-500">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                        0.000 $PVCX
                      </div>
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 flex flex-col bg-white">
                    {/* Chat Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">Wine recommendations</span>
                        <span className="text-[10px] text-gray-400">Unlimited messages</span>
                      </div>
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] text-gray-600">Elite</span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {/* User Message */}
                      <div className="flex justify-end">
                        <div className="bg-gray-900 text-white px-4 py-2 rounded-2xl text-sm max-w-xs">
                          I'd like to get a wine from France instead
                        </div>
                      </div>

                      {/* AI Response */}
                      <div className="flex justify-start">
                        <div className="flex flex-col gap-1.5 max-w-sm">
                          <div className="flex items-center gap-1.5 px-1">
                            <div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                            <span className="text-[10px] text-gray-500 font-medium">Sphera AI</span>
                          </div>
                          <div className="bg-gray-50 px-4 py-3 rounded-2xl text-sm text-gray-700">
                            Perfect! French wines are the epitome of elegance. Let me show you our exceptional French selection.
                          </div>
                        </div>
                      </div>

                      {/* Wine Results */}
                      <div className="flex justify-start">
                        <div className="max-w-sm space-y-2">
                          <span className="inline-block px-2 py-0.5 bg-gray-900 text-white text-[10px] rounded">Wines · 20</span>
                          <div className="space-y-2">
                            {[
                              { name: 'Moët & Chandon Grand Vintage 2015', region: 'Champagne, France', price: '65-95' },
                              { name: 'Château Rieussec 2017', region: 'Sauternes, Bordeaux', price: '50-120' },
                              { name: 'Egly-Ouriet Grand Cru Brut NV', region: 'Champagne, France', price: '80-120' }
                            ].map((wine, i) => (
                              <div key={i} className="flex items-center justify-between px-3 py-2 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400">🍷</span>
                                  <div>
                                    <p className="text-xs font-medium text-gray-800">{wine.name}</p>
                                    <p className="text-[10px] text-gray-400">{wine.region}</p>
                                  </div>
                                </div>
                                <span className="text-xs font-medium text-gray-600">${wine.price}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
                        <input
                          type="text"
                          placeholder="Ask about jets, helicopters, cars, wines..."
                          className="flex-1 bg-transparent text-xs text-gray-600 outline-none"
                          disabled
                        />
                        <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/dashboard/chat?newChat=true')}
                className="px-8 py-3 rounded-xl text-sm font-medium transition-all duration-200 border border-white/40 hover:border-white/60 hover:shadow-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  color: '#374151'
                }}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Chat with Sphera AI
              </button>
              <button
                onClick={() => navigate('/subscriptions/plans')}
                className="px-8 py-3 rounded-xl text-sm font-medium transition-all duration-200 border border-gray-300 hover:bg-white/20"
                style={{ color: '#374151' }}
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">
            16 Powerful Capabilities
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            From private jets and yachts to fine wines and MEDEVAC services — Sphera AI is your all-in-one luxury lifestyle assistant.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {capabilities.map((cap, index) => (
            <div
              key={index}
              onClick={() => navigate('/dashboard/chat?newChat=true')}
              className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <h3 className="text-base font-medium text-gray-900 mb-2 leading-tight">
                {cap.title}
                <br />
                <span className="text-gray-400 text-sm font-normal">{cap.description.split(' ').slice(0, 3).join(' ')}</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">{cap.description}</p>
              <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
                +
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* Pricing Preview */}
      <section id="pricing" className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            See what's included in each membership tier.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { name: 'Explorer', price: 49 },
            { name: 'Traveller', price: 99, popular: true },
            { name: 'Elite', price: 399 }
          ].map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl p-6 border text-center ${plan.popular ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200'}`}
            >
              {plan.popular && (
                <span className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded uppercase font-medium">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-medium text-gray-900 mt-3">{plan.name}</h3>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-light text-gray-900">${plan.price}</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>
              <button
                onClick={() => navigate('/subscriptions/plans')}
                className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
                  plan.popular
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>

        {/* Features Comparison Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-4 font-medium text-gray-900">Feature</th>
                  <th className="text-center py-4 px-4 font-medium text-gray-900">Explorer</th>
                  <th className="text-center py-4 px-4 font-medium text-gray-900">Traveller</th>
                  <th className="text-center py-4 px-4 font-medium text-gray-900">Elite Club</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'AI Chats/month', explorer: '5', traveller: '10', elite: 'Unlimited' },
                  { feature: 'Messages/chat', explorer: '10', traveller: '25', elite: 'Unlimited' },
                  { feature: 'Empty Legs', explorer: true, traveller: true, elite: true },
                  { feature: 'Ground Transport', explorer: true, traveller: true, elite: true },
                  { feature: 'Restaurants', explorer: true, traveller: true, elite: true },
                  { feature: 'MEDEVAC Services', explorer: false, traveller: true, elite: true },
                  { feature: 'Concierge Services', explorer: false, traveller: true, elite: true },
                  { feature: 'Group Charter', explorer: false, traveller: true, elite: true },
                  { feature: 'Event Booking', explorer: false, traveller: true, elite: true },
                  { feature: 'Free Airport Transfers', explorer: false, traveller: false, elite: '2x/month' },
                  { feature: 'MembershipX Card', explorer: false, traveller: false, elite: true },
                  { feature: 'VIP Event Invites', explorer: false, traveller: false, elite: true },
                  { feature: 'Support', explorer: 'Email', traveller: 'Priority', elite: '24/7 Phone' },
                ].map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 last:border-b-0">
                    <td className="py-3 px-4 text-gray-700">{row.feature}</td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.explorer === 'boolean' ? (
                        row.explorer ? (
                          <Check className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )
                      ) : (
                        <span className="text-gray-600">{row.explorer}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.traveller === 'boolean' ? (
                        row.traveller ? (
                          <Check className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )
                      ) : (
                        <span className="text-gray-600">{row.traveller}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.elite === 'boolean' ? (
                        row.elite ? (
                          <Check className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )
                      ) : (
                        <span className="text-gray-600">{row.elite}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedFaq === faq.id ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedFaq === faq.id && (
                <div className="px-6 pb-4 text-sm text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default SpheraAI;
