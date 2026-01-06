import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './LandingHeader';
import Footer from './Footer';
import {
  Plane,
  Car,
  Ship,
  Wine,
  MapPin,
  Hotel,
  UtensilsCrossed,
  Cigarette,
  Package,
  HeartPulse,
  FileText,
  Globe,
  Clock,
  Shield,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Check,
  Navigation,
  Users,
  Star,
  Map,
  Link2,
  Handshake
} from 'lucide-react';

interface ServicesProps {
  setCurrentPage: (page: string) => void;
}

function Services({ setCurrentPage }: ServicesProps) {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = React.useState<string | null>(null);

  // Set page meta
  useEffect(() => {
    document.title = 'Services | PrivateCharterX - Private Jets, Yachts, Luxury Cars & More';

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Discover PrivateCharterX luxury travel services: private jet charter, empty legs, helicopter transfers, yacht charters, luxury car rentals, fine wines, gourmet experiences, and 24/7 concierge.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Discover PrivateCharterX luxury travel services: private jet charter, empty legs, helicopter transfers, yacht charters, luxury car rentals, fine wines, gourmet experiences, and 24/7 concierge.';
      document.head.appendChild(meta);
    }

    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', 'private jet charter, empty legs, helicopter transfer, yacht charter, luxury car rental, chauffeur service, wine sommelier, MEDEVAC, visa assistance, luxury travel, VIP concierge');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = 'private jet charter, empty legs, helicopter transfer, yacht charter, luxury car rental, chauffeur service, wine sommelier, MEDEVAC, visa assistance, luxury travel, VIP concierge';
      document.head.appendChild(meta);
    }

    return () => {
      document.title = 'privatecharterx©';
    };
  }, []);

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const mainServices = [
    {
      icon: Plane,
      title: 'Private Aviation',
      subtitle: 'Jets & Helicopters',
      description: 'Charter private jets from light to ultra-long-range aircraft, plus helicopter transfers for city-to-city travel and scenic tours. Access 5,000+ aircraft globally.',
      features: ['Private jets & helicopters', 'City transfers & tours', 'Instant quotes'],
      query: 'I want to charter a private jet'
    },
    {
      icon: Navigation,
      title: 'Empty Legs',
      subtitle: 'Up to 75% Savings',
      description: 'Book discounted one-way flights on repositioning jets. Real-time empty leg inventory updated daily with significant savings on luxury travel.',
      features: ['Live availability', 'Up to 75% off', 'Last-minute deals'],
      query: 'Show me empty legs'
    },
    {
      icon: Ship,
      title: 'Yachts & Adventures',
      subtitle: 'Maritime Experiences',
      description: 'Discover yacht charters from day cruises to week-long adventures. Access superyachts, sailing experiences, and curated maritime journeys worldwide.',
      features: ['Day charters', 'Weekly rentals', 'Crewed yachts'],
      query: 'I want to charter a yacht'
    },
    {
      icon: Car,
      title: 'Luxury & Sports Cars',
      subtitle: 'Premium Vehicles',
      description: 'Rent Ferraris, Lamborghinis, Rolls-Royces, and premium vehicles in any city. Professional chauffeur services and airport transfers available.',
      features: ['Sports & supercars', 'Chauffeur service', 'Airport transfers'],
      query: 'I need a luxury car rental'
    }
  ];

  const additionalServices = [
    {
      icon: Hotel,
      title: 'Luxury Hotels',
      description: '5-star hotels, resorts, and exclusive accommodations worldwide.',
      query: 'Find luxury hotel'
    },
    {
      icon: Map,
      title: 'Custom Travel Planning',
      description: 'AI-powered luxury itineraries with verified 5-star venues and Michelin dining.',
      query: 'Plan a luxury trip'
    },
    {
      icon: HeartPulse,
      title: 'MEDEVAC Services',
      description: 'Emergency medical evacuation, air ambulance, and repatriation worldwide.',
      query: 'I need MEDEVAC assistance'
    },
    {
      icon: Wine,
      title: 'Wine & Sommelier',
      description: 'Personalized wine recommendations, rare vintages, and champagnes.',
      query: 'Wine recommendations'
    },
    {
      icon: UtensilsCrossed,
      title: 'Gourmet & Delicatessen',
      description: 'Premium caviar, truffles, foie gras, and luxury food items.',
      query: 'Gourmet food selection'
    },
    {
      icon: Cigarette,
      title: 'Fine Cigars',
      description: 'Curated Cuban cigars, rare tobaccos, and premium accessories.',
      query: 'Cuban cigars'
    },
    {
      icon: MapPin,
      title: 'Restaurant Reservations',
      description: 'Michelin-starred restaurants and exclusive dining experiences.',
      query: 'Restaurant reservation'
    },
    {
      icon: Package,
      title: 'Trip Packages',
      description: 'Complete multi-leg journeys with flights, cars, and hotels.',
      query: 'Build trip package'
    },
    {
      icon: FileText,
      title: 'Visa Assistance',
      description: 'Express visa processing in 95% of countries within 24 hours.',
      query: 'Express visa service'
    },
    {
      icon: Link2,
      title: 'Blockchain Signatures',
      description: 'Web3-verified request submissions with on-chain signature authentication.',
      query: 'How does blockchain verification work'
    },
    {
      icon: Handshake,
      title: 'Direct Partner Bookings',
      description: 'Access exclusive rates through our verified luxury partner network.',
      query: 'Tell me about partner bookings'
    }
  ];

  const eliteServices = [
    {
      icon: HeartPulse,
      title: 'MEDEVAC Services',
      description: 'Emergency medical evacuation, air ambulance, and repatriation services. Available exclusively for Elite members.',
      exclusive: true
    },
    {
      icon: Globe,
      title: 'VIP Concierge',
      description: 'Custom requests, event planning, exclusive access, and personalized experiences. 24/7 dedicated support.',
      exclusive: true
    }
  ];

  const faqs = [
    {
      id: 'booking',
      question: 'How do I book a private jet?',
      answer: 'Simply chat with Sphera AI and describe your travel needs - departure city, destination, date, and number of passengers. Our AI will search real-time inventory and provide instant quotes. You can also use our quick search on the homepage.'
    },
    {
      id: 'empty-legs',
      question: 'What are empty legs and how much can I save?',
      answer: 'Empty legs are one-way flights when jets reposition without passengers. You can save up to 75% compared to regular charter prices. Our inventory is updated daily with last-minute deals available.'
    },
    {
      id: 'payment',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, wire transfers, and 70+ cryptocurrencies including BTC, ETH, USDC, and USDT through our CoinGate integration.'
    },
    {
      id: 'subscription',
      question: 'Do I need a subscription to use your services?',
      answer: 'Basic browsing is free. To chat with Sphera AI and make bookings, you need a subscription: Explorer ($99/mo), Traveller ($199/mo), or Elite ($999/mo). Each tier offers different chat limits and exclusive features.'
    },
    {
      id: 'cancellation',
      question: 'What is your cancellation policy?',
      answer: 'Cancellation policies vary by service type and timing. Private jet charters typically allow free cancellation up to 48 hours before departure. Our team will clearly explain terms before you confirm any booking.'
    },
    {
      id: 'coverage',
      question: 'What destinations do you cover?',
      answer: 'We operate globally with access to 5,000+ aircraft, yacht charters in major maritime destinations, and luxury car rentals in 50+ countries. Our network covers private airports, FBOs, and exclusive venues worldwide.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-satoshi">
      <LandingHeader />

      {/* Hero Section */}
      <section className="px-4 sm:px-8 py-16 sm:py-24 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100/60 backdrop-blur-sm rounded-full border border-gray-300/30 mb-8">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] text-gray-600 font-medium tracking-wide uppercase">Luxury Travel Services</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-6 leading-tight tracking-tight">
            Luxury Travel <span className="text-gray-400">Services</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Private jets, yachts, luxury cars, fine wines, and 24/7 concierge — all accessible
            through natural conversation with Sphera AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/dashboard/chat?newChat=true')}
              className="bg-gray-900 text-white px-8 py-4 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Chat with Sphera AI
            </button>
            <button
              onClick={() => navigate('/dashboard/subscriptions/plans')}
              className="border border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-sm font-medium hover:bg-white hover:border-gray-300 transition-all duration-200"
            >
              View Plans
            </button>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="px-4 sm:px-8 py-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '5,000+', label: 'Aircraft Available', icon: Plane },
            { value: '50+', label: 'Countries Covered', icon: Globe },
            { value: '24/7', label: 'Concierge Support', icon: Clock },
            { value: '100%', label: 'Secure Transactions', icon: Shield }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
              <stat.icon className="w-5 h-5 text-gray-400 mx-auto mb-2" />
              <div className="text-2xl font-light text-gray-900 mb-1">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Services */}
      <section className="px-4 sm:px-8 py-16 sm:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">
            Core Services
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Premium transportation and travel experiences at your fingertips
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mainServices.map((service, index) => (
            <div
              key={index}
              onClick={() => navigate(`/dashboard/chat?query=${encodeURIComponent(service.query)}&newChat=true`)}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                    <service.icon className="w-7 h-7 text-gray-700" />
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center text-gray-400 text-2xl font-light transition-transform duration-300 group-hover:rotate-45">
                    +
                  </div>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-1">{service.title}</h3>
                <p className="text-sm text-gray-400 mb-4">{service.subtitle}</p>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">{service.description}</p>
                <div className="flex flex-wrap gap-2">
                  {service.features.map((feature, i) => (
                    <span key={i} className="px-3 py-1.5 bg-gray-50 rounded-full text-xs text-gray-600">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Additional Services Grid */}
      <section className="px-4 sm:px-8 py-16 sm:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">
            Lifestyle & Concierge
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Enhance your journey with curated experiences and premium services
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {additionalServices.map((service, index) => (
            <div
              key={index}
              onClick={() => navigate(`/dashboard/chat?query=${encodeURIComponent(service.query)}&newChat=true`)}
              className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gray-100 transition-colors">
                <service.icon className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">{service.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{service.description}</p>
              <div className="w-5 h-5 flex items-center justify-center text-gray-400 text-lg font-light transition-transform duration-300 group-hover:rotate-90">
                +
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Elite Services */}
      <section className="px-4 sm:px-8 py-16 sm:py-20 max-w-6xl mx-auto">
        <div className="bg-gray-900 rounded-3xl p-8 sm:p-12">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-xs font-medium tracking-wide uppercase mb-6">
              Elite Exclusive
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-white mb-4">
              Premium Elite Services
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Exclusive services available only to Elite members ($999/month)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {eliteServices.map((service, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white mb-2">{service.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{service.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/dashboard/subscriptions/plans')}
              className="bg-white text-gray-900 px-8 py-4 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
            >
              Upgrade to Elite
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 sm:px-8 py-16 sm:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Book luxury travel in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Chat with Sphera AI',
              description: 'Describe your travel needs in natural language. Our AI understands context and preferences.'
            },
            {
              step: '02',
              title: 'Review Options',
              description: 'Get real-time availability, instant quotes, and curated recommendations tailored to you.'
            },
            {
              step: '03',
              title: 'Book & Travel',
              description: 'Add to cart, confirm your booking, and enjoy a seamless luxury travel experience.'
            }
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-sm font-medium mx-auto mb-6">
                {item.step}
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-3">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 sm:px-8 py-16 sm:py-20 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              onClick={() => toggleFaq(faq.id)}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer hover:border-gray-200 transition-all"
            >
              <div className="flex items-center justify-between p-5">
                <h4 className="text-sm font-medium text-gray-900 pr-4">{faq.question}</h4>
                <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${expandedFaq === faq.id ? 'rotate-180' : ''}`} />
              </div>
              {expandedFaq === faq.id && (
                <div className="px-5 pb-5 pt-0">
                  <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-8 py-16 sm:py-20 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-light text-white mb-4">
            Ready to Experience Luxury Travel?
          </h2>
          <p className="text-gray-400 mb-10 max-w-xl mx-auto">
            Start a conversation with Sphera AI and discover a new way to travel.
            Your journey begins with a simple message.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/dashboard/chat?newChat=true')}
              className="bg-white text-gray-900 px-8 py-4 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Start Chatting
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/sphera-ai')}
              className="border border-white/20 text-white px-8 py-4 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Services;
