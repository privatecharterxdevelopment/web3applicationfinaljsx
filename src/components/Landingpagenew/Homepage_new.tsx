import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FloatingSearchModal from './FloatingSearchModal';
import AnimatedSection from '../AnimatedSection';
import LandingHeader from './LandingHeader';
import Globe3D from '../Globe3D';
import { supabase } from '../../lib/supabase';
import NewsletterForm from '../NewsletterForm';
import {
  Plane,
  Shield,
  Coins,
  Clock,
  Globe,
  Star,
  Users,
  Zap,
  ChevronDown,
  ArrowRight,
  Check,
  Info,
  ArrowUpDown,
  X,
  MapPin,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Award,
  Repeat,
  Sparkles,
  TrendingUp,
  CheckCircle,
  Leaf,
  Anchor,
  Car
} from 'lucide-react';

// Jet interface
interface Jet {
  id: string;
  aircraft_model: string;
  description: string;
  aircraft_category: string;
  price_range: string;
  range: string;
  capacity: number;
  manufacturer: string;
  image_url: string;
  image_url_1?: string;
  image_url_2?: string;
  image_url_3?: string;
  image_url_4?: string;
  image_url_5?: string;
  title: string;
}

// Helper function to get all images for any jet
const getAllJetImages = (jet: Jet): string[] => {
  const images: string[] = [];

  // Add all available images
  if (jet.image_url && jet.image_url.trim()) images.push(jet.image_url.trim());
  if (jet.image_url_1 && jet.image_url_1.trim()) images.push(jet.image_url_1.trim());
  if (jet.image_url_2 && jet.image_url_2.trim()) images.push(jet.image_url_2.trim());
  if (jet.image_url_3 && jet.image_url_3.trim()) images.push(jet.image_url_3.trim());
  if (jet.image_url_4 && jet.image_url_4.trim()) images.push(jet.image_url_4.trim());
  if (jet.image_url_5 && jet.image_url_5.trim()) images.push(jet.image_url_5.trim());

  // If no images, return default
  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1540962351504-03099e0a754b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80');
  }

  return images;
};

// Partner logos for carousel
const partnerLogos = [
  { name: 'Coinmarketcap', logo: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/Coinmarketcap.png' },
  { name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/200px-Apple_logo_black.svg.png' },
  { name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/200px-Google_2015_logo.svg.png' },
  { name: 'Coinbase', logo: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/Coinbase-logo.png' },
  { name: 'BaseChain', logo: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/base.png' },
  { name: 'Mercury', logo: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/mercury-com-logo-vector-2.png' },
  { name: 'NBAA', logo: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/NBAA_logo.png' },
  { name: 'Alchemy', logo: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/Alchemy+Logo+-+Black.png' },
  { name: 'AutoSalonSwitzerland', logo: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/Autosalon-zuerich.com.png' }
];

// Compact Partner Logo Carousel Component
const CompactPartnerCarousel = () => {
  return (
    <div className="relative w-full py-8 overflow-hidden bg-transparent">
      <div className="flex items-center justify-center">
        <div className="relative w-full max-w-7xl">
          {/* Left blur gradient */}
          <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-gray-50 via-gray-50/80 via-gray-50/50 to-transparent z-10 pointer-events-none"></div>

          {/* Right blur gradient */}
          <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-gray-50 via-gray-50/80 via-gray-50/50 to-transparent z-10 pointer-events-none"></div>

          {/* Scrolling container */}
          <div className="overflow-hidden">
            <div
              className="flex items-center gap-8"
              style={{
                width: `${partnerLogos.length * 2 * 160}px`,
                animation: 'scroll 25s linear infinite'
              }}
            >
              {/* First set of logos */}
              {partnerLogos.map((partner, index) => (
                <div key={`first-${index}`} className="flex-shrink-0 w-24 h-12 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-50 hover:opacity-80">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-w-full max-h-full object-contain filter"
                    style={{ maxHeight: '32px', maxWidth: '96px' }}
                  />
                </div>
              ))}
              {/* Second set for seamless loop */}
              {partnerLogos.map((partner, index) => (
                <div key={`second-${index}`} className="flex-shrink-0 w-24 h-12 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-50 hover:opacity-80">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-w-full max-h-full object-contain filter"
                    style={{ maxHeight: '32px', maxWidth: '96px' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-${partnerLogos.length * 160}px);
          }
        }
      `}</style>
    </div>
  );
};

function Homepage() {
  const navigate = useNavigate();
  const [jets, setJets] = useState<Jet[]>([]);
  const [cardImageIndexes, setCardImageIndexes] = useState<{[key: string]: number}>({});

  const handleGetStarted = () => {
    console.log('Get Started clicked!');
    console.log('Navigating to /dashboard');
    navigate('/dashboard');
  };

  const handleInfoClick = () => {
    navigate('/services'); // Navigate to services page
  };

  // Fetch jets from database
  useEffect(() => {
    const fetchJets = async () => {
      try {
        const { data, error } = await supabase.from('jets').select('*').limit(6);
        if (error) throw error;
        setJets(data || []);
      } catch (error) {
        console.error('Error fetching jets:', error);
        setJets([]);
      }
    };

    fetchJets();
  }, []);

  // Gallery navigation for cards
  const nextCardImage = (jetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const jet = jets.find(j => j.id === jetId);
    if (!jet) return;

    const totalImages = getAllJetImages(jet).length;
    setCardImageIndexes(prev => ({
      ...prev,
      [jetId]: ((prev[jetId] || 0) + 1) % totalImages
    }));
  };

  const prevCardImage = (jetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const jet = jets.find(j => j.id === jetId);
    if (!jet) return;

    const totalImages = getAllJetImages(jet).length;
    setCardImageIndexes(prev => ({
      ...prev,
      [jetId]: ((prev[jetId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  const handleJetClick = (jet: Jet) => {
    // Navigate to jet details or show modal
    console.log('Jet clicked:', jet.aircraft_model);
  };

  // All page navigation now handled by React Router

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 px-4 py-4 overflow-x-hidden">
      <LandingHeader onGetStarted={handleGetStarted} />

      {/* Hero Section */}
      {/* Mobile Layout - Stacked (Globe above, Search below) - Full screen height */}
      <div className="md:hidden max-w-7xl mx-auto rounded-2xl overflow-hidden min-h-[calc(100vh-100px)] flex flex-col justify-start pt-4">
        {/* Globe Section - Mobile - Centered, pushed down more */}
        <div className="relative h-[224px] flex items-center justify-center overflow-hidden mt-10">
          <div className="w-[262px] h-[262px]">
            <Globe3D />
          </div>
        </div>

        {/* Spacing between globe and floating element */}
        <div className="h-6"></div>

        {/* Floating Search Modal - Below Globe on Mobile */}
        <div className="px-2 pb-4">
          <FloatingSearchModal />
        </div>
      </div>

      {/* Desktop Layout - Overlapping (Original) */}
      <div className="hidden md:block max-w-7xl mx-auto rounded-2xl overflow-hidden relative min-h-[85vh]">
        {/* Background Globe - Full Color - Centered */}
        <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full">
            <Globe3D />
          </div>
        </div>

        {/* Content overlay - Centered Floating Search Modal */}
        <section className="absolute inset-0 z-20 flex items-center justify-center px-8">
          <FloatingSearchModal />
        </section>
      </div>

        {/* Philosophy Text Section */}
        <AnimatedSection animation="fade-in" delay={100}>
          <section className="px-4 sm:px-8 py-12 sm:py-16 max-w-4xl mx-auto">
            <p className="text-center text-base sm:text-lg text-gray-800 leading-relaxed">
              PrivateCharterX is the world's first <span className="bg-gray-200 px-2 py-1 rounded">Web3 and AI-powered</span> luxury travel platform. Jets, helicopters, empty legs, luxury rentals, transfers, curated adventures—searchable by AI, bookable 24/7 with <span className="bg-gray-200 px-2 py-1 rounded">70+ cryptocurrencies</span> via CoinGate. Human support standing by. Our <span className="bg-gray-200 px-2 py-1 rounded">tokenization services</span> transforms aircraft, hangars, and airfields into income-generating digital assets while staying operational. NFT holders unlock <span className="bg-gray-200 px-2 py-1 rounded">free empty legs</span>, 10% discounts, and priority access.
            </p>
          </section>
        </AnimatedSection>

        {/* Animated AI Prompts Marquee */}
        <section className="py-8 sm:py-12 overflow-hidden">
          <style>{`
            @keyframes scrollLeft {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            @keyframes scrollRight {
              0% { transform: translateX(-50%); }
              100% { transform: translateX(0); }
            }
            .animate-scroll-left {
              animation: scrollLeft 180s linear infinite;
            }
            .animate-scroll-right {
              animation: scrollRight 180s linear infinite;
            }
            .marquee-row:hover .animate-scroll-left,
            .marquee-row:hover .animate-scroll-right {
              animation-play-state: paused;
            }
            .prompt-card {
              transition: all 0.2s ease;
            }
            .prompt-card:hover {
              transform: scale(1.02);
              box-shadow: 0 8px 20px rgba(0,0,0,0.08);
            }
            .prompt-card:active {
              transform: scale(0.98);
            }
            .prompt-card .plus-icon {
              transition: transform 0.3s ease;
            }
            .prompt-card:hover .plus-icon {
              transform: rotate(90deg);
            }
          `}</style>

          <div className="space-y-4">
            {/* Row 1 - Left to Right */}
            <div className="marquee-row relative">
              <div className="animate-scroll-left flex gap-3 w-max">
                {[...Array(2)].map((_, setIndex) => (
                  <div key={setIndex} className="flex gap-3">
                    {[
                      { prompt: "I need a private jet from Zurich to London", tier: "explorer" },
                      { prompt: "Book a light jet from Geneva to Nice", tier: "explorer" },
                      { prompt: "Show me available jets for Paris to Ibiza", tier: "explorer" },
                      { prompt: "Find me a heavy jet for 12 passengers", tier: "explorer" },
                      { prompt: "What's the cheapest jet to Barcelona?", tier: "explorer" },
                      { prompt: "Empty legs from London", tier: "explorer" },
                      { prompt: "Show me empty legs to Monaco", tier: "explorer" },
                      { prompt: "Group charter for 20 passengers", tier: "elite" },
                      { prompt: "Helicopter transfer Nice to Monaco", tier: "explorer" },
                      { prompt: "Alpine scenic helicopter tour", tier: "explorer" },
                      { prompt: "Ground transport from Schiphol", tier: "explorer" },
                      { prompt: "Luxury car pickup Geneva airport", tier: "explorer" },
                      { prompt: "Yacht charter Mediterranean", tier: "traveller" },
                      { prompt: "Superyacht Monaco Grand Prix", tier: "traveller" },
                      { prompt: "Free airport transfer included", tier: "elite" },
                      { prompt: "VIP event access Monaco Grand Prix", tier: "elite" },
                      { prompt: "MembershipX card benefits", tier: "elite" }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => navigate(`/dashboard/chat?query=${encodeURIComponent(item.prompt)}&newChat=true`)}
                        className="prompt-card group relative flex-shrink-0 flex items-center gap-3 pl-3 pr-4 py-4 rounded-2xl text-xs whitespace-nowrap cursor-pointer border border-gray-200/40"
                        style={{
                          background: 'rgba(255, 255, 255, 0.7)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                        }}
                      >
                        <span
                          className="absolute -top-2 left-3 px-2 py-0.5 rounded-full text-[10px] font-medium border text-gray-600"
                          style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(8px)',
                            borderColor: 'rgba(0,0,0,0.08)'
                          }}
                        >
                          {item.tier === 'elite' ? 'Elite' : item.tier === 'traveller' ? 'Traveller' : 'Explorer'}
                        </span>
                        <span className="text-gray-800">{item.prompt}</span>
                        <span className="plus-icon ml-auto text-gray-400 text-lg font-light">+</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2 - Right to Left */}
            <div className="marquee-row relative">
              <div className="animate-scroll-right flex gap-3 w-max">
                {[...Array(2)].map((_, setIndex) => (
                  <div key={setIndex} className="flex gap-3">
                    {[
                      { prompt: "I'd like a Barolo red wine for my flight", tier: "explorer" },
                      { prompt: "Do you have Dom Pérignon?", tier: "explorer" },
                      { prompt: "Show me your champagne selection", tier: "explorer" },
                      { prompt: "Château Margaux 2015 please", tier: "explorer" },
                      { prompt: "Wine recommendations for celebration", tier: "explorer" },
                      { prompt: "Order Krug Grande Cuvée", tier: "explorer" },
                      { prompt: "Cuban cigars for my flight", tier: "explorer" },
                      { prompt: "Do you have Cohiba Behike?", tier: "explorer" },
                      { prompt: "Premium cigar selection", tier: "explorer" },
                      { prompt: "Montecristo No. 2 box", tier: "explorer" },
                      { prompt: "Michelin star restaurant Zurich", tier: "explorer" },
                      { prompt: "Rooftop restaurant in Monaco", tier: "explorer" },
                      { prompt: "Best Italian near my hotel Milan", tier: "explorer" },
                      { prompt: "VIP catering experience on board", tier: "elite" },
                      { prompt: "Full meal catering on my jet", tier: "explorer" },
                      { prompt: "Concierge book dinner for 8", tier: "traveller" },
                      { prompt: "Event booking private venue", tier: "traveller" }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => navigate(`/dashboard/chat?query=${encodeURIComponent(item.prompt)}&newChat=true`)}
                        className="prompt-card group relative flex-shrink-0 flex items-center gap-3 pl-3 pr-4 py-4 rounded-2xl text-xs whitespace-nowrap cursor-pointer border border-gray-200/40"
                        style={{
                          background: 'rgba(255, 255, 255, 0.7)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                        }}
                      >
                        <span
                          className="absolute -top-2 left-3 px-2 py-0.5 rounded-full text-[10px] font-medium border text-gray-600"
                          style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(8px)',
                            borderColor: 'rgba(0,0,0,0.08)'
                          }}
                        >
                          {item.tier === 'elite' ? 'Elite' : item.tier === 'traveller' ? 'Traveller' : 'Explorer'}
                        </span>
                        <span className="text-gray-800">{item.prompt}</span>
                        <span className="plus-icon ml-auto text-gray-400 text-lg font-light">+</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Row 3 - Left to Right */}
            <div className="marquee-row relative">
              <div className="animate-scroll-left flex gap-3 w-max" style={{ animationDuration: '160s' }}>
                {[...Array(2)].map((_, setIndex) => (
                  <div key={setIndex} className="flex gap-3">
                    {[
                      { prompt: "Helicopter Zurich to Gstaad", tier: "explorer" },
                      { prompt: "Wedding helicopter Lake Como", tier: "explorer" },
                      { prompt: "Airport transfers Geneva", tier: "explorer" },
                      { prompt: "Swiss Alps helicopter tour", tier: "explorer" },
                      { prompt: "Luxury van for 6 to Cannes", tier: "explorer" },
                      { prompt: "Last-minute Zurich to St. Moritz", tier: "explorer" },
                      { prompt: "Jets with bedroom capability", tier: "explorer" },
                      { prompt: "Yacht week Croatia", tier: "traveller" },
                      { prompt: "Round trip to Dubai", tier: "explorer" },
                      { prompt: "MEDEVAC flight Greece to Switzerland", tier: "elite" },
                      { prompt: "Express Visa for Thailand", tier: "explorer" },
                      { prompt: "Concierge services Monaco", tier: "traveller" },
                      { prompt: "Break the price on competitor quote", tier: "traveller" },
                      { prompt: "Empty legs Zurich departing", tier: "explorer" },
                      { prompt: "Show all Geneva empty legs", tier: "explorer" },
                      { prompt: "Vintage Bordeaux for my jet", tier: "explorer" },
                      { prompt: "Cigars for a 3-hour flight", tier: "explorer" }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => navigate(`/dashboard/chat?query=${encodeURIComponent(item.prompt)}&newChat=true`)}
                        className="prompt-card group relative flex-shrink-0 flex items-center gap-3 pl-3 pr-4 py-4 rounded-2xl text-xs whitespace-nowrap cursor-pointer border border-gray-200/40"
                        style={{
                          background: 'rgba(255, 255, 255, 0.7)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                        }}
                      >
                        <span
                          className="absolute -top-2 left-3 px-2 py-0.5 rounded-full text-[10px] font-medium border text-gray-600"
                          style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(8px)',
                            borderColor: 'rgba(0,0,0,0.08)'
                          }}
                        >
                          {item.tier === 'elite' ? 'Elite' : item.tier === 'traveller' ? 'Traveller' : 'Explorer'}
                        </span>
                        <span className="text-gray-800">{item.prompt}</span>
                        <span className="plus-icon ml-auto text-gray-400 text-lg font-light">+</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Service Cards - 4 Cards in Single Row */}
        <section className="px-4 sm:px-8 pt-8 sm:pt-12 pb-2 sm:pb-3 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Global Fleet */}
            <div
              onClick={handleGetStarted}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
            >
              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                  Global Fleet
                  <br />
                  <span className="text-gray-400 text-sm">Worldwide Access</span>
                </h3>
                <p className="text-gray-600 text-sm leading-snug mb-3">Access worldwide network of luxury aircraft with real-time availability.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Real-time</span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Global</span>
                </div>
                <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
                  +
                </div>
              </div>
            </div>

            {/* Web3 Integration */}
            <div
              onClick={handleGetStarted}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
            >
              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                  Web3 Integration
                  <br />
                  <span className="text-gray-400 text-sm">Blockchain Powered</span>
                </h3>
                <p className="text-gray-600 text-sm leading-snug mb-3">Blockchain-powered bookings with smart contracts and crypto payments.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Smart Contracts</span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Crypto</span>
                </div>
                <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
                  +
                </div>
              </div>
            </div>

            {/* Tokenized Assets */}
            <div
              onClick={handleGetStarted}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
            >
              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                  Tokenized Assets
                  <br />
                  <span className="text-gray-400 text-sm">Digital Ownership</span>
                </h3>
                <p className="text-gray-600 text-sm leading-snug mb-3">Fractional ownership through digital tokens and secure transactions.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Fractional</span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Secure</span>
                </div>
                <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
                  +
                </div>
              </div>
            </div>

            {/* Sphera AI */}
            <div
              onClick={() => navigate('/dashboard/chat?newChat=true')}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
            >
              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                  Sphera AI
                  <br />
                  <span className="text-gray-400 text-sm">v1.0 Travel Intelligence</span>
                </h3>
                <p className="text-gray-600 text-sm leading-snug mb-3">The most intelligent travel AI. Empty legs, private jets, wines, delicacies, smart cart.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">AI-Powered</span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">24/7</span>
                </div>
                <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
                  +
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Four Cards Section - Ground Transport, Tokenize, Visa, Partner */}
        <section className="px-4 sm:px-8 pt-1 sm:pt-1 pb-8 sm:pb-12 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Ground Transport */}
            <div
              onClick={handleGetStarted}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
            >
              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                  Ground Transport
                  <br />
                  <span className="text-gray-400 text-sm">Move Smarter</span>
                </h3>
                <p className="text-gray-600 text-sm leading-snug mb-3">End-to-end ground transportation. Luxury cars, helicopters, and concierge support.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Luxury Cars</span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">24/7</span>
                </div>
                <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
                  +
                </div>
              </div>
            </div>

            {/* Tokenize Your Business */}
            <div
              onClick={handleGetStarted}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
            >
              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                  Tokenize Your Business
                  <br />
                  <span className="text-gray-400 text-sm">Get Instant Liquidity</span>
                </h3>
                <p className="text-gray-600 text-sm leading-snug mb-3">Transform your company into a tokenized entity with fractional ownership and equity tokens.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Smart Contracts</span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Liquidity</span>
                </div>
                <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
                  +
                </div>
              </div>
            </div>

            {/* Express Visa Service */}
            <div
              onClick={() => navigate('/dashboard/chat?query=Express%20Visa%20Service&newChat=true')}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
            >
              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                  Express Visa
                  <br />
                  <span className="text-gray-400 text-sm">24h Guarantee</span>
                </h3>
                <p className="text-gray-600 text-sm leading-snug mb-3">Hassle-free visa processing in 95% of countries. $250/person with verified agent network.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">24h Processing</span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">95% Coverage</span>
                </div>
                <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
                  +
                </div>
              </div>
            </div>

            {/* Become a Partner */}
            <div
              onClick={() => window.location.href = 'mailto:admin@privatecharterx.com?subject=Partner%20Inquiry&body=Hello%2C%0A%0AI%20am%20interested%20in%20becoming%20a%20partner%20with%20PrivateCharterX.%0A%0APlease%20contact%20me%20to%20discuss%20the%20partnership%20opportunities.%0A%0ABest%20regards'}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
            >
              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                  Become a Partner
                  <br />
                  <span className="text-gray-400 text-sm">Expand Your Business</span>
                </h3>
                <p className="text-gray-600 text-sm leading-snug mb-3">List your services on our platform. Luxury cars, taxis, adventure packages, limousines.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Global Exposure</span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Secure</span>
                </div>
                <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
                  +
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CharterToken Ecosystem - HIDDEN */}
        {/* Section removed as per request */}

        {/* Fractional Ownership - HIDDEN */}
        {/* Section removed as per request */}

        {/* Yachts Coming Soon Banner */}
        <AnimatedSection animation="slide-up" delay={100}>
          <section className="px-4 sm:px-8 py-8 sm:py-12 max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 md:h-[300px]">
                {/* Left - Text Content */}
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                    Yachting and Boats
                    <br />
                    <span className="text-gray-400 text-sm">Maritime Luxury</span>
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    19,000+ yachts, superyachts, and boats available for direct booking in Q1/2026. From day cruises to week-long adventures—searchable via Sphera AI. KYC required.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Sphera AI</span>
                    <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Global Fleet</span>
                    <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">KYC Required</span>
                  </div>
                </div>
                {/* Right - Video with overlay */}
                <div className="h-56 md:h-full overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-100 relative">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    poster="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/pngwing.com-2.png"
                  >
                    <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/13151265-hd_1280_720_25fps.mov" type="video/mp4" />
                    <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/13151265-hd_1280_720_25fps.mov" type="video/quicktime" />
                  </video>
                  {/* Text overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="text-white text-2xl md:text-3xl font-light tracking-wide">Q1 / 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Private Jet Buy/Sell Coming Soon Banner - Reversed Layout */}
        <AnimatedSection animation="slide-up" delay={120}>
          <section className="px-4 sm:px-8 py-8 sm:py-12 max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 md:h-[300px]">
                {/* Left - Image with overlay */}
                <div className="h-56 md:h-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-300 relative order-2 md:order-1">
                  <img
                    src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/tokenization-images/Privatecharterx_aircraft_sales.jpeg"
                    alt="Private Jet Buy/Sell"
                    className="w-full h-full object-cover"
                  />
                  {/* Text overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="text-white text-2xl md:text-3xl font-light tracking-wide">Q1 / 2026</span>
                  </div>
                </div>
                {/* Right - Text Content */}
                <div className="p-8 md:p-10 flex flex-col justify-center order-1 md:order-2">
                  <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                    Private Jet Buy/Sell
                    <br />
                    <span className="text-gray-400 text-sm">AI & Web3 Powered Marketplace</span>
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Discover daily off-market offers and 9,000+ aircraft worldwide—from props to BBJ jets. Transparent pricing with direct contact via Sphera AI.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Sphera AI</span>
                    <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Off-Market Deals</span>
                    <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Direct Contact</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* All-in-one Global Mobility Platform - ChatGPT Style */}
        <AnimatedSection animation="slide-up" delay={150}>
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
              <div className="relative px-6 sm:px-12 py-12 sm:py-16">
                {/* Header */}
                <div className="text-center mb-10">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-3">
                    Your AI-Powered Travel Concierge
                  </h2>
                  <p className="text-gray-700 text-sm md:text-base max-w-xl mx-auto font-light">
                    Meet Sphera AI — book jets, discover wines, arrange transfers, and more through natural conversation.
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
                <div className="text-center mt-10">
                  <button
                    onClick={() => {
                      const dashboardSection = document.getElementById('dashboard-access');
                      if (dashboardSection) {
                        dashboardSection.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        window.location.href = '/dashboard/chat';
                      }
                    }}
                    className="px-8 py-3 rounded-xl text-sm font-medium transition-all duration-200 border border-white/40 hover:border-white/60 hover:shadow-lg"
                    style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      color: '#374151'
                    }}
                  >
                    Chat with Sphera AI
                  </button>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Simple Steps Section - HIDDEN */}
        {/* Section removed as per request */}

        {/* What does digital ownership mean in Web3 - HIDDEN */}
        {/* Section removed as per request */}

        {/* FAQ Section */}
        <AnimatedSection animation="slide-up" delay={100}>
          <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-gray-900 mb-2">Got Questions?</h2>
              <h3 className="text-xl font-light text-gray-500">We've got answers</h3>
            </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  question: "What services does PrivateCharterX offer?",
                  answer: "We offer private jet charter, helicopter transfers, empty leg flights, luxury car rentals, yacht charters, ground transportation, and curated adventure packages. All bookable 24/7 through our AI assistant Sphera or with human support."
                },
                {
                  question: "What cryptocurrencies do you accept?",
                  answer: "We accept 70+ cryptocurrencies via CoinGate including BTC, ETH, USDC, and USDT. Traditional payment methods are also available."
                },
                {
                  question: "What is Sphera AI?",
                  answer: "Sphera AI is our intelligent travel assistant that helps you search flights, compare options, build multi-stop journeys, and manage your cart. Available 24/7 with instant responses and human support standing by when needed."
                },
                {
                  question: "How do empty leg flights work?",
                  answer: "Empty legs are one-way repositioning flights offered at significant discounts (up to 75% off). They have fixed routes and dates. Instant payment via crypto checkout available for immediate booking confirmation."
                },
                {
                  question: "What is NFT Membership?",
                  answer: "Our NFT Membership (0.5 ETH) gives you 10% off all bookings, one free empty leg per year, priority access to deals, and exclusive VIP experiences. Benefits are verifiable on-chain and transferable."
                },
                {
                  question: "What subscription plans are available?",
                  answer: "Explorer ($99/mo), Traveller ($299/mo), and Elite ($999/mo with unlimited AI chats). Each tier unlocks commission discounts on bookings. Annual plans available."
                },
                {
                  question: "What is asset tokenization?",
                  answer: "We help aircraft, hangar, and airfield owners tokenize their assets into income-generating digital securities under SEC regulations. Assets stay operational while owners gain liquidity through fractional ownership tokens."
                },
                {
                  question: "Do you offer carbon offset options?",
                  answer: "Yes. CO2 certificates are included with every booking at no extra cost and may qualify for tax benefits. SAF (Sustainable Aviation Fuel) certificates are available on request with blockchain verification for up to 80% carbon reduction."
                }
              ].map((faq, index) => (
                <FAQCard key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-4">Can't find what you're searching for?</p>
              <button
                onClick={() => navigate('/helpdesk')}
                className="text-gray-900 font-medium hover:text-gray-700 transition-colors underline"
              >
                Check our Helpdesk
              </button>
            </div>
          </div>
          </section>
        </AnimatedSection>


        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200" style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 300 }}>
          {/* Main Footer Content */}
          <div className="px-4 sm:px-8 py-12 sm:py-16">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6">

                {/* Brand / Logo / Social / Payment - Left Side */}
                <div>
                  {/* Logo */}
                  <img
                    src="https://i.ibb.co/DPF5g3Sk/iu42DU1.png"
                    alt="PrivateCharterX"
                    className="h-12 object-contain mb-3"
                  />
                  {/* Description */}
                  <p className="text-sm text-gray-500 mb-4 font-light">
                    Blockchain-powered private aviation platform revolutionizing luxury travel.
                  </p>
                  {/* Social Icons - 1 row, left aligned */}
                  <div className="flex gap-3 justify-start">
                    {/* LinkedIn */}
                    <a href="https://www.linkedin.com/company/privatecharterx" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                    {/* X (Twitter) */}
                    <a href="https://x.com/PrivatecharterX" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                    {/* OpenSea */}
                    <a href="https://opensea.io/collection/privatecharterx-membership-card" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.629 0 12 0ZM5.92 12.403l.051-.081 3.123-4.884a.107.107 0 0 1 .187.014c.52 1.169.972 2.623.76 3.528-.088.372-.335.876-.614 1.342a2.405 2.405 0 0 1-.117.199.106.106 0 0 1-.09.045H6.013a.106.106 0 0 1-.091-.163Zm13.914 1.68a.109.109 0 0 1-.065.101c-.243.103-1.07.485-1.414.962-.878 1.222-1.548 2.97-3.048 2.97H9.053a4.019 4.019 0 0 1-4.013-4.028v-.072c0-.058.048-.106.108-.106h3.485c.07 0 .12.063.115.132-.026.226.017.459.125.67.206.42.636.682 1.099.682h1.726v-1.347H9.99a.11.11 0 0 1-.089-.173l.063-.09c.16-.231.391-.586.621-.992.156-.274.308-.566.43-.86.024-.052.043-.107.065-.16.033-.094.067-.182.091-.269a4.57 4.57 0 0 0 .065-.223c.057-.25.081-.514.081-.787 0-.108-.004-.221-.014-.327-.005-.117-.02-.235-.034-.352a3.415 3.415 0 0 0-.048-.312 6.494 6.494 0 0 0-.098-.468l-.014-.06c-.03-.108-.056-.21-.09-.317a11.824 11.824 0 0 0-.328-.972 5.212 5.212 0 0 0-.142-.355c-.072-.178-.146-.339-.213-.49a3.564 3.564 0 0 1-.094-.197 4.658 4.658 0 0 0-.103-.213c-.024-.053-.053-.104-.072-.152l-.211-.388c-.029-.053.019-.118.077-.101l1.32.357h.01l.173.05.192.054.07.019v-.783c0-.379.302-.686.679-.686a.66.66 0 0 1 .477.202.69.69 0 0 1 .2.484V6.65l.141.039c.01.005.022.01.031.017.034.024.084.062.147.11.05.038.103.086.165.137a10.351 10.351 0 0 1 .574.504c.214.199.454.432.684.691.065.074.127.146.192.226.062.079.132.156.19.232.079.104.16.212.235.324.033.053.074.108.105.161.096.142.178.288.257.435.034.067.067.141.096.213.089.197.159.396.202.598a.65.65 0 0 1 .024.169v.015c.007.074.01.149.003.224a1.813 1.813 0 0 1-.091.481 2.149 2.149 0 0 1-.127.325c-.034.082-.074.16-.113.243a2.872 2.872 0 0 1-.338.513 1.12 1.12 0 0 1-.113.149c-.036.046-.076.091-.112.141-.058.072-.117.149-.185.215l-.24.267c-.03.036-.07.072-.104.108l-.203.219a.105.105 0 0 1-.074.03h-1.05v1.348h1.323c.295 0 .576-.104.804-.298.075-.065.439-.381.875-.851a.094.094 0 0 1 .058-.03l3.83-1.106a.11.11 0 0 1 .137.103v.773Z"/>
                      </svg>
                    </a>
                    {/* Email */}
                    <a href="mailto:info@privatecharterx.com" className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </a>
                  </div>
                  {/* Payment Icons */}
                  <div className="mt-6">
                    <p className="text-xs text-gray-400 mb-2 font-light">We accept</p>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500 font-light">BTC</span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500 font-light">ETH</span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500 font-light">USDC</span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500 font-light">USDT</span>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Services</h4>
                  <div className="space-y-2.5">
                    <button onClick={() => navigate('/dashboard/chat?query=private+jet')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                      Private Jets
                    </button>
                    <button onClick={() => navigate('/dashboard/chat?query=helicopter')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                      Helicopters
                    </button>
                    <button onClick={() => navigate('/dashboard/chat?query=empty+legs')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                      Empty Legs
                    </button>
                    <button onClick={() => navigate('/dashboard/chat?query=luxury+car')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                      Luxury Cars
                    </button>
                    <span className="block text-sm text-gray-400 text-left">
                      Yacht Charters <span className="text-xs">(Q1/2026)</span>
                    </span>
                    <button onClick={() => navigate('/dashboard/chat?query=airport+transfer')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                      Ground Transport
                    </button>
                    <button onClick={() => navigate('/dashboard/chat?newChat=true')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                      Sphera AI
                    </button>
                  </div>
                </div>

                {/* Web3 & Tokenization */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Web3</h4>
                  <div className="space-y-2.5">
                    <button onClick={() => navigate('/dashboard/web3/tokenization')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                      Tokenize Your Asset
                    </button>
                    <button onClick={() => navigate('/dashboard/web3/nft-marketplace')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                      NFT Membership
                    </button>
                    <button onClick={() => navigate('/dashboard/web3/pvcx-token')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                      PVCX Token
                    </button>
                    <button onClick={() => navigate('/dashboard/web3/launchpad')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                      Launchpad
                    </button>
                    <button onClick={() => navigate('/dashboard/web3/marketplace')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                      Marketplace
                    </button>
                  </div>
                </div>

                {/* Support */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Support</h4>
                  <div className="space-y-2.5">
                    <button onClick={() => {
                      const faqSection = document.querySelector('#faq');
                      faqSection?.scrollIntoView({ behavior: 'smooth' });
                    }} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                      FAQ
                    </button>
                    <button onClick={() => window.location.href = 'mailto:support@privatecharterx.com'} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                      Help Center
                    </button>
                    <button onClick={() => navigate('/dashboard/subscription')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                      Manage Subscription
                    </button>
                    <button onClick={() => navigate('/dashboard/requests')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                      My Requests
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Legal Links Bar */}
          <div className="border-t border-gray-200 bg-gray-50">
            <div className="px-4 sm:px-8 py-4">
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
                  <button onClick={() => navigate('/terms')} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                    Terms of Service
                  </button>
                  <button onClick={() => navigate('/privacy')} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                    Privacy Policy
                  </button>
                  <button onClick={() => navigate('/cookies')} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                    Cookie Policy
                  </button>
                  <button onClick={() => navigate('/imprint')} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                    Imprint
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Company Info Bar */}
          <div className="border-t border-gray-200 bg-gray-100">
            <div className="px-4 sm:px-8 py-4">
              <div className="max-w-6xl mx-auto">
                <p className="text-xs text-gray-500 text-center">
                  PrivateCharterX LLC - 1000 Brickell Ave. 715 - 33131 Miami, Florida - United States of America - Registration Nr L24000299516
                </p>
              </div>
            </div>
          </div>
        </footer>

    </div>
  );
}

// FAQ Accordion Component
function FAQCard({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h4 className="text-base font-light text-gray-900 flex-1">{question}</h4>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
        >
          <p className="text-sm text-gray-600 font-light leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Homepage;