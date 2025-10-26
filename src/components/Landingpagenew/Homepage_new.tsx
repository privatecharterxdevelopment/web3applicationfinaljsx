import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedSection from '../AnimatedSection';
import LandingHeader from './LandingHeader';
import Globe3D from '../Globe3D';
import { supabase } from '../../lib/supabase';
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
    console.log('Navigating to /glas (glassmorphic dashboard)');
    navigate('/glas');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-4 overflow-x-hidden">
      <LandingHeader onGetStarted={handleGetStarted} />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto rounded-2xl overflow-hidden shadow-xl border border-white/20 relative backdrop-blur-xl bg-white/10 min-h-[600px]">
        {/* Background Globe */}
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full absolute opacity-60">
            <Globe3D />
          </div>
        </div>

        {/* Glassmorphic overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/40 to-white/20 backdrop-blur-md z-10"></div>

        {/* Content overlay - 3 column layout */}
        <section className="absolute inset-0 z-20 px-4 sm:px-8 flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center w-full">
            {/* Left: Title */}
            <div className="flex flex-col justify-center">
              <div className="mb-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="bg-gray-100/90 text-gray-700 px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase backdrop-blur-sm">
                  web3 and ai powered multi charter
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 leading-tight tracking-tight">
                Tokenizing global mobility<br />
                <span className="font-normal">aviation. assets. benefits.</span>
              </h1>
            </div>

            {/* Middle: Globe (empty - globe is in background) */}
            <div className="hidden lg:block"></div>

            {/* Right: Description */}
            <div className="flex items-center justify-center lg:justify-end">
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-sm">
                All-in-one Web3 mobility platform: Asset tokenization, private jet charters, empty legs, luxury cars, and crypto-enabled rides.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Partner Logo Carousel */}
      <CompactPartnerCarousel />

        {/* Service Cards - 8 Cards in Clean Grid */}
        <section className="px-4 sm:px-8 py-12 sm:py-16 max-w-6xl mx-auto">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div
            onClick={handleGetStarted}
            className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
          >
            <div className="h-16 sm:h-20 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
              <Plane className="w-6 h-6 text-gray-700" />
            </div>
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 leading-tight">Charter Booking</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-snug">Instant private jet booking with blockchain verification and smart contracts.</p>
              <ArrowRight className="w-4 h-4 text-black mt-4" />
            </div>
          </div>

          <div
            onClick={handleGetStarted}
            className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
          >
            <div className="h-20 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
              <Coins className="w-6 h-6 text-gray-700" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2 leading-tight">Flight Tokenization</h3>
              <p className="text-gray-600 text-sm leading-snug">Convert flight hours into tradeable digital tokens for maximum flexibility.</p>
              <ArrowRight className="w-4 h-4 text-black mt-4" />
            </div>
          </div>

          <div
            onClick={handleGetStarted}
            className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
          >
            <div className="h-20 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
              <Shield className="w-6 h-6 text-gray-700" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2 leading-tight">Secure Payments</h3>
              <p className="text-gray-600 text-sm leading-snug">Encrypted blockchain transactions ensure secure and transparent payments.</p>
              <ArrowRight className="w-4 h-4 text-black mt-4" />
            </div>
          </div>

          <div
            onClick={handleGetStarted}
            className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
          >
            <div className="h-20 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
              <Clock className="w-6 h-6 text-gray-700" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2 leading-tight">Real-Time Tracking</h3>
              <p className="text-gray-600 text-sm leading-snug">Live flight tracking and updates through decentralized networks.</p>
              <ArrowRight className="w-4 h-4 text-black mt-4" />
            </div>
          </div>

          <div
            onClick={handleGetStarted}
            className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
          >
            <div className="h-20 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
              <Globe className="w-6 h-6 text-gray-700" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2 leading-tight">Global Network</h3>
              <p className="text-gray-600 text-sm leading-snug">Access worldwide fleet of private jets through our blockchain powered platform.</p>
              <ArrowRight className="w-4 h-4 text-black mt-4" />
            </div>
          </div>

          <div
            onClick={handleGetStarted}
            className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
          >
            <div className="h-20 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
              <Star className="w-6 h-6 text-gray-700" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2 leading-tight">Premium Service</h3>
              <p className="text-gray-600 text-sm leading-snug">Luxury concierge services with transparent pricing and quality assurance.</p>
              <ArrowRight className="w-4 h-4 text-black mt-4" />
            </div>
          </div>

          <div
            onClick={handleGetStarted}
            className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
          >
            <div className="h-20 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
              <Users className="w-6 h-6 text-gray-700" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2 leading-tight">Shared Ownership</h3>
              <p className="text-gray-600 text-sm leading-snug">Fractional jet ownership through tokenization and smart contracts.</p>
              <ArrowRight className="w-4 h-4 text-black mt-4" />
            </div>
          </div>

          <div
            onClick={handleGetStarted}
            className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
          >
            <div className="h-20 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
              <Zap className="w-6 h-6 text-gray-700" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2 leading-tight">Instant Verification</h3>
              <p className="text-gray-600 text-sm leading-snug">Automated identity and payment verification through blockchain technology.</p>
              <ArrowRight className="w-4 h-4 text-black mt-4" />
            </div>
          </div>
          </div>
        </section>

        {/* CharterToken Ecosystem */}
        <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-6">
                  CharterToken Ecosystem
                  <br />
                  <span className="text-gray-400">Earn, Swap, Reward</span>
                </h2>
                <p className="text-gray-600 mb-8 text-sm md:text-base">
                  Our native token powers the entire ecosystem. Earn rewards from bookings, swap tokens seamlessly, and unlock exclusive benefits.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Award className="w-5 h-5 text-gray-700" />
                    <span className="text-sm md:text-base">Earn 5% CharterTokens on every booking</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Repeat className="w-5 h-5 text-gray-700" />
                    <span className="text-sm md:text-base">Swap tokens with zero fees</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-5 h-5 text-gray-700" />
                    <span className="text-sm md:text-base">Unlock NFT membership benefits</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">CharterToken (CTX)</span>
                    <span className="text-base sm:text-lg font-medium">$12.47</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Your Balance</span>
                    <span className="text-base sm:text-lg font-medium">2,847 CTX</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rewards Earned</span>
                    <span className="text-base sm:text-lg font-medium">+156 CTX</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">NFT Tier</span>
                    <span className="text-base sm:text-lg font-medium">Platinum</span>
                  </div>
                  <button className="w-full bg-gray-900 text-white py-2 rounded-md font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base">
                    Swap Tokens
                  </button>
                </div>
              </div>
            </div>
        </section>

        {/* Fractional Ownership */}
        <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="bg-white p-6 md:p-8 rounded-lg border border-gray-200">
              <h3 className="text-lg md:text-xl font-medium mb-6">Tokenized Companies</h3>
              <div className="space-y-4">
                {[
                  { company: 'Login to see project', ownership: '12.5%', value: '$2.4M' },
                  { company: 'Login to see project', ownership: '8.2%', value: '$1.8M' },
                  { company: 'Login to see project', ownership: '15.8%', value: '$3.2M' }
                ].map((investment, index) => (
                  <div key={index} className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 italic">{investment.company}</span>
                      <div className="flex gap-4">
                        <span className="text-sm text-gray-600">{investment.ownership}</span>
                        <span className="text-sm text-gray-600">{investment.value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleGetStarted}
                className="w-full bg-gray-900 text-white py-2 rounded-md font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base mt-4"
              >
                See All Ongoing Tokenized Projects
              </button>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-6">
                Fractional Ownership
                <br />
                <span className="text-gray-400">Jets, Helis, Limousines</span>
              </h2>
              <p className="text-gray-600 mb-8 text-sm md:text-base">
                Own a piece of tokenized transportation companies. Jets, helicopters, and luxury car firms have tokenized their businesses, making fractional ownership accessible through utility tokens.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Plane className="w-5 h-5 text-gray-700" />
                  <span className="text-sm md:text-base">Own shares in private jet companies</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-gray-700" />
                  <span className="text-sm md:text-base">Helicopter fleet participation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Car className="w-5 h-5 text-gray-700" />
                  <span className="text-sm md:text-base">Luxury limousine company stakes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Become a Partner Banner */}
        <section className="px-4 sm:px-8 py-12 max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl px-8 py-12 border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Left: Content */}
              <div className="flex-1">
                <div className="mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase">
                    Partner Program
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4 leading-tight">
                  Become a Partner
                  <br />
                  <span className="text-gray-400">Expand Your Business</span>
                </h2>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-xl mb-6">
                  List your services on our platform. Offer luxury cars, taxis, adventure packages, or limousine services to our global clientele. Receive location-based booking notifications and grow your revenue.
                </p>
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-700">Global Exposure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-700">Secure Payments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-700">Easy Management</span>
                  </div>
                </div>
              </div>

              {/* Right: CTA */}
              <div className="flex flex-col items-center md:items-end gap-4">
                <button
                  onClick={handleGetStarted}
                  className="bg-gray-900 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-black transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  Join as Partner
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-xs text-gray-500">Start listing your services today</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tokenize Your Travel Business & Ground Coordination */}
        <section className="px-4 sm:px-8 py-12 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Tokenize Your Travel Business Card */}
            <div
              onClick={handleGetStarted}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
                  <Coins className="w-6 h-6 text-gray-700" />
                </div>
                <h3 className="text-xl font-medium text-gray-900">Tokenize Your Travel Business</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Transform your travel company into a tokenized entity. Issue utility tokens, raise capital through fractional ownership, and unlock liquidity for your aviation or ground transportation business.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Fractional ownership & equity tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Smart contract governance & voting rights</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Secondary market liquidity for investors</span>
                </div>
              </div>
              <div className="mt-6 flex items-center text-gray-900 font-medium group-hover:gap-2 transition-all">
                <span className="text-sm">Learn More</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Ground Coordination Card */}
            <div
              onClick={handleGetStarted}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-gray-700" />
                </div>
                <h3 className="text-xl font-medium text-gray-900">Ground Coordination</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Complete end-to-end ground transportation services. Luxury cars, helicopters, and concierge support integrated directly into your flight booking experience.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Private chauffeur & limousine service</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Helicopter transfers to/from airport</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">24/7 concierge assistance</span>
                </div>
              </div>
              <div className="mt-6 flex items-center text-gray-900 font-medium group-hover:gap-2 transition-all">
                <span className="text-sm">Learn More</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>
        </section>

        {/* All-in-one Global Mobility Platform */}
        <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl px-8 py-12 border border-gray-200 shadow-sm">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4">
                All-in-one global mobility platform
              </h2>
              <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
                Experience seamless travel with blockchain-powered booking, tokenized assets, and premium services all in one platform.
              </p>
            </div>

            {/* Video content area - white space for video to be added */}
            <div className="min-h-96 bg-white rounded-lg">
              {/* Video will be added here */}
            </div>
          </div>
        </section>

        {/* Steps Section - Horizontal Timeline */}
        <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4">
              Simple Steps to
              <br />
              <span className="text-gray-400">Digital Asset Ownership</span>
            </h2>
          </div>

          {/* Timeline Container */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-200 hidden md:block"></div>

            {/* Timeline Steps */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
              {[
                {
                  number: 1,
                  title: "Browse DAOs & Available Assets",
                  description: "Explore our curated selection of tokenized jets, yachts, and premium assets available for fractional ownership."
                },
                {
                  number: 2,
                  title: "Buy Assets After Successful KYC/AML",
                  description: "Complete our secure verification process and purchase your desired asset tokens with full regulatory compliance."
                },
                {
                  number: 3,
                  title: "Own a Piece of Jet, Yacht & More",
                  description: "Hold fractional ownership of luxury assets through blockchain technology - fully digital, transparent, and tradeable."
                },
                {
                  number: 4,
                  title: "Get Your Utility Membership",
                  description: "Unlock exclusive benefits, priority booking, and special rates with your digital asset ownership membership."
                },
                {
                  number: 5,
                  title: "Request, Book, Pay & Enjoy",
                  description: "Experience seamless blockchain-powered booking for your flights, yacht charters, and luxury services with PrivateCharterX."
                }
              ].map((step, index) => (
                <div key={index} className="relative flex flex-col items-center text-center">
                  {/* Step Number Circle */}
                  <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mb-4 text-lg font-medium relative z-10">
                    {step.number}
                  </div>

                  {/* Step Content */}
                  <div className="max-w-xs">
                    <h3 className="text-base font-medium text-gray-900 mb-3 leading-tight">{step.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                  </div>

                  {/* Connection Line (mobile only) */}
                  {index < 4 && (
                    <div className="w-0.5 h-8 bg-gray-200 mt-6 md:hidden"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </section>

      {/* Added spacing between sections */}
      <div className="py-4"></div>

      <div className="max-w-7xl mx-auto bg-transparent rounded-2xl border border-gray-200 overflow-hidden">
        {/* DAO Section */}
        <section className="px-8 py-20 max-w-6xl mx-auto">
          {/* Header with title on left and description on right */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light leading-tight">
                What does digital
                <br />
                <span className="text-gray-400">ownership mean in Web3</span>
              </h2>
            </div>
            <div className="max-w-xs">
              <p className="text-gray-600 text-sm leading-relaxed">
                Powered by blockchain, every crypto asset and smart contract is secure, decentralized.
              </p>
            </div>
          </div>

          {/* 4 Cards in 2x2 Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Top Left - Own Your Identity */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 h-72">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>

              {/* Content */}
              <div className="relative h-full flex flex-col justify-end p-8">
                <div className="flex items-center mb-4">
                  <Users className="w-6 h-6 text-gray-700 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Own your identity</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  With decentralized identities, you control how and where your personal information is used—no more data harvesting.
                </p>
              </div>
            </div>

            {/* Top Right - Own Rare Digital Assets */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 h-72">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>

              {/* Content */}
              <div className="relative h-full flex flex-col justify-end p-8">
                <div className="flex items-center mb-4">
                  <Coins className="w-6 h-6 text-gray-700 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Own rare digital assets</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  From Bitcoin to altcoins, stablecoins to tokens—crypto makes financial ownership borderless and decentralized.
                </p>
              </div>
            </div>

            {/* Bottom Left - Own Your Financial Future */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 h-72">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-teal-50"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>

              {/* Content */}
              <div className="relative h-full flex flex-col justify-end p-8">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 mr-4">
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-gray-700">
                      <path d="M3 3L21 21M9 9L21 3L15 15L9 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Own your financial future</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  DeFi (Decentralized Finance) gives you access to borderless financial systems, from earning interest to lending assets—all powered by smart contracts.
                </p>
              </div>
            </div>

            {/* Bottom Right - Own Your Role in the New Web */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 h-72">
              {/* DAO badge */}
              <div className="absolute top-8 right-8 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium z-10">
                DAO
              </div>

              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-pink-50"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>

              {/* Content */}
              <div className="relative h-full flex flex-col justify-end p-8">
                <div className="flex items-center mb-4">
                  <Globe className="w-6 h-6 text-gray-700 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Own your role in the new web</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Participate in DAOs, support open protocols, and help build a transparent digital economy.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Added spacing between floating component and next section */}
      <div className="py-8"></div>


        {/* FAQ Section */}
        <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-2">Got Questions?</h2>
            <h3 className="text-xl font-light text-gray-500">We've got answers</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-8 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-medium text-gray-900">How does tokenized flight booking work?</h4>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="bg-gray-50 p-8 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-medium text-gray-900">What cryptocurrencies do you accept?</h4>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="bg-gray-50 p-8 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-medium text-gray-900">Is my flight data secure on the blockchain?</h4>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="bg-gray-50 p-8 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-medium text-gray-900">Can I trade my flight tokens with others?</h4>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-8 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-medium text-gray-900">How do NFT memberships work?</h4>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="bg-gray-50 p-8 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-medium text-gray-900">What are the benefits of fractional ownership?</h4>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="bg-gray-50 p-8 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-medium text-gray-900">How are asset valuations determined?</h4>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="bg-gray-50 p-8 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-medium text-gray-900">What happens if I want to sell my tokens?</h4>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-4">Can't find what you're searching for?</p>
              <button
                onClick={() => navigate('/services')}
                className="text-gray-900 font-medium hover:text-gray-700 transition-colors underline"
              >
                Check our Helpdesk
              </button>
            </div>
          </div>
        </section>


        {/* CTA Section */}
        <section className="bg-gray-50 px-8 py-20 text-center">
          <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-light text-gray-900 mb-4">Stay Ahead in Web3</h2>
          <p className="text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join the future of private aviation. Get early access to our blockchain platform
            and exclusive tokenized flight opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 text-sm flex-1"
            />
            <button
                onClick={handleGetStarted}
                className="bg-gray-900 text-white px-3 sm:px-5 py-2 rounded-md text-xs sm:text-sm hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
              Get Started
              </button>
          </div>
          </div>
        </section>

        {/* Divider Line */}
        <div className="border-t border-gray-200"></div>

        {/* Footer */}
        <footer className="bg-gray-50 px-4 sm:px-8 py-12 sm:py-16">
          <div className="max-w-6xl mx-auto">
            {/* Footer Content */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 mb-8 sm:mb-12">
              {/* Logo and Description */}
              <div className="col-span-2 sm:col-span-1 lg:col-span-1">
                <button onClick={() => navigate('/')} className="mb-4">
                  <img
                    src="https://i.ibb.co/DPF5g3Sk/iu42DU1.png"
                    alt="PrivateCharterX"
                    className="h-12 w-auto hover:opacity-80 transition-opacity"
                  />
                </button>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                  Blockchain-powered private aviation platform revolutionizing luxury travel.
                </p>
              </div>

              {/* Aviation Services */}
              <div>
                <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-3 sm:mb-4">Aviation Services</h4>
                <div className="space-y-2 sm:space-y-3">
                  <button
                    onClick={() => navigate('/services')}
                    className="block text-xs sm:text-sm text-gray-500 hover:text-gray-900 transition-colors text-left"
                  >
                    Private Jet Charter
                  </button>
                  <button
                    onClick={() => navigate('/services')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Group Charter
                  </button>
                  <button
                    onClick={() => navigate('/aviation')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Helicopter Charter
                  </button>
                  <button
                    onClick={() => navigate('/aviation')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    eVTOL Flights
                  </button>
                  <button
                    onClick={() => navigate('/services')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Adventure Packages
                  </button>
                  <button
                    onClick={() => navigate('/services')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Empty Legs
                  </button>
                </div>
              </div>

              {/* Web3 & Digital */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Web3 & Digital</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/tokenized')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Web3
                  </button>
                  <button
                    onClick={() => navigate('/tokenized')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    PVCX Token
                  </button>
                  <button
                    onClick={() => navigate('/tokenized')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    NFT Aviation
                  </button>
                  <button
                    onClick={() => navigate('/tokenized')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Asset Licensing
                  </button>
                  <button
                    onClick={() => navigate('/tokenized')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    JetCard Packages
                  </button>
                  <button
                    onClick={() => navigate('/tokenized')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    CO2 Certificates
                  </button>
                  <button
                    onClick={() => navigate('/tokenized')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Marketplace
                  </button>
                </div>
              </div>

              {/* Partners & Press */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Partners & Press</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/services')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Partner With Us
                  </button>
                  <button
                    onClick={() => navigate('/services')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Blog Posts
                  </button>
                  <button
                    onClick={() => navigate('/services')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Press Center
                  </button>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Quick Links</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Home
                  </button>
                  <button
                    onClick={() => navigate('/services')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    How It Works
                  </button>
                  <button
                    onClick={() => navigate('/charter-a-jet')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Charter a Jet
                  </button>
                  <button
                    onClick={() => navigate('/services')}
                    className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Helpdesk
                  </button>
                </div>
              </div>
            </div>
          </div>
        </footer>

    </div>
  );
}

export default Homepage;