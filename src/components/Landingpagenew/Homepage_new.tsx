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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 px-4 py-4 overflow-x-hidden">
      <LandingHeader onGetStarted={handleGetStarted} />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto rounded-2xl overflow-visible relative backdrop-blur-3xl bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 min-h-[600px]">
        {/* Frosted Glass Texture Overlay */}
        <div className="absolute inset-0 pointer-events-none z-[1]" style={{
          backgroundImage: `
            url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E"),
            repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 2px),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 2px),
            radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.3), transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(200,200,200,0.2), transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.15), transparent 70%)
          `,
          backgroundSize: '200px 200px, 2px 2px, 2px 2px, 100% 100%, 100% 100%, 100% 100%',
          filter: 'blur(0.3px)'
        }}></div>

        {/* Background Globe - Full Color - Centered */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <div className="w-full h-full">
            <Globe3D />
          </div>
          {/* Grey Overlay */}
          <div className="absolute inset-0 bg-gray-100/40 pointer-events-none"></div>
        </div>

        {/* Content overlay - Centered Floating Search Modal */}
        <section className="absolute inset-0 z-20 flex items-center justify-center px-8">
          <FloatingSearchModal />
        </section>
      </div>

        {/* Philosophy Text Section */}
        <section className="px-4 sm:px-8 py-12 sm:py-16 max-w-4xl mx-auto">
          <p className="text-center text-base sm:text-lg text-gray-800 leading-relaxed">
            At PrivateCharterX, we believe in <span className="bg-gray-200 px-2 py-1 rounded">democratizing luxury travel</span> through blockchain technology.
            Our platform combines <span className="bg-gray-200 px-2 py-1 rounded">transparency</span> with <span className="bg-gray-200 px-2 py-1 rounded">fractional ownership</span>,
            enabling everyone to access premium aviation services. We're not just chartering flights—we're creating
            a <span className="bg-gray-200 px-2 py-1 rounded">decentralized ecosystem</span> where trust is built into every transaction.
            Through <span className="bg-gray-200 px-2 py-1 rounded">smart contracts</span> and <span className="bg-gray-200 px-2 py-1 rounded">tokenization</span>,
            we eliminate intermediaries and reduce costs while maintaining the highest standards of safety and service.
          </p>
        </section>

        {/* Service Cards - 4 Cards in Single Row */}
        <section className="px-4 sm:px-8 py-12 sm:py-16 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Global Fleet */}
            <div
              onClick={handleGetStarted}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
            >
              {/* Header Image/Video Space */}
              <div className="w-full h-32 bg-gray-100 border-b border-gray-200">
                {/* Space for image/video - to be added manually */}
              </div>
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
              {/* Header Image/Video Space */}
              <div className="w-full h-32 bg-gray-100 border-b border-gray-200">
                {/* Space for image/video - to be added manually */}
              </div>
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
              {/* Header Image/Video Space */}
              <div className="w-full h-32 bg-gray-100 border-b border-gray-200">
                {/* Space for image/video - to be added manually */}
              </div>
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

            {/* Licensed Partners */}
            <div
              onClick={handleGetStarted}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
            >
              {/* Header Image/Video Space */}
              <div className="w-full h-32 bg-gray-100 border-b border-gray-200">
                {/* Space for image/video - to be added manually */}
              </div>
              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                  Licensed Partners
                  <br />
                  <span className="text-gray-400 text-sm">Verified Network</span>
                </h3>
                <p className="text-gray-600 text-sm leading-snug mb-3">Verified operators and premium service providers worldwide.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Verified</span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Premium</span>
                </div>
                <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
                  +
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tokenize Your Business Section */}
        <section className="px-4 sm:px-8 py-12 sm:py-16 max-w-6xl mx-auto">
          <div className="space-y-4 sm:space-y-6">
            {/* Ground Transport - Large Card */}
            <div
              onClick={handleGetStarted}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
            >
              {/* Header Image */}
              <div
                className="w-full h-48 bg-gray-100 border-b border-gray-200 bg-cover bg-center"
                style={{ backgroundImage: 'url(https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/Privatecharterx,map.png)' }}
              >
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-light text-gray-900 mb-2 leading-tight">
                  Ground Transport
                  <br />
                  <span className="text-gray-400 text-base">Move Smarter</span>
                </h3>
                <p className="text-gray-600 text-base leading-relaxed mb-4 max-w-2xl">
                  Complete end-to-end ground transportation services. Luxury cars, helicopters, and concierge support
                  integrated directly into your flight booking experience.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-700">Luxury Cars</span>
                  <span className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-700">Helicopters</span>
                  <span className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-700">Concierge</span>
                  <span className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-700">24/7 Support</span>
                </div>
                <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
                  +
                </div>
              </div>
            </div>

            {/* Two Cards Below */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Tokenize Your Business */}
              <div
                onClick={handleGetStarted}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
              >
                {/* Header Image/Video Space */}
                <div
                  className="w-full h-32 bg-gray-100 border-b border-gray-200 bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: 'url(https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/ethereum-logoprivatecharterx-dots.svg)', backgroundSize: '60%' }}
                >
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                    Tokenize Your Business
                    <br />
                    <span className="text-gray-400 text-sm">Get Instant Liquidity</span>
                  </h3>
                  <p className="text-gray-600 text-sm leading-snug mb-3">Transform your company into a tokenized entity with fractional ownership and equity tokens.</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Fractional Ownership</span>
                    <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Smart Contracts</span>
                    <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Liquidity</span>
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
                    +
                  </div>
                </div>
              </div>

              {/* Become a Partner */}
              <div
                onClick={handleGetStarted}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
              >
                {/* Header Image */}
                <div
                  className="w-full h-32 bg-gray-100 border-b border-gray-200 bg-cover bg-center"
                  style={{ backgroundImage: 'url(https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/privatecharterxbannergrey.png)' }}
                >
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                    Become a Partner
                    <br />
                    <span className="text-gray-400 text-sm">Expand Your Business</span>
                  </h3>
                  <p className="text-gray-600 text-sm leading-snug mb-3">
                    List your services on our platform. Offer luxury cars, taxis, adventure packages, or limousine services to our global clientele.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Global Exposure</span>
                    <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Secure Payments</span>
                    <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Easy Management</span>
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
                    +
                  </div>
                </div>
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
                <p className="text-gray-600 mb-6 text-sm md:text-base leading-relaxed">
                  Our native token powers the entire ecosystem. Earn rewards from bookings, swap tokens seamlessly, and unlock exclusive benefits.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="bg-gray-200 px-3 py-1.5 rounded-full text-xs text-gray-700">5% Rewards</span>
                  <span className="bg-gray-200 px-3 py-1.5 rounded-full text-xs text-gray-700">Zero Fees</span>
                  <span className="bg-gray-200 px-3 py-1.5 rounded-full text-xs text-gray-700">NFT Benefits</span>
                </div>
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600 font-light">CharterToken (CTX)</span>
                    <span className="text-base sm:text-lg font-light">$12.47</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-light">Your Balance</span>
                    <span className="text-base sm:text-lg font-light">2,847 CTX</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-light">Rewards Earned</span>
                    <span className="text-base sm:text-lg font-light text-green-600">+156 CTX</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-light">NFT Tier</span>
                    <span className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-700">Platinum</span>
                  </div>
                  <button className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-light hover:bg-gray-800 transition-colors text-sm sm:text-base mt-4">
                    Swap Tokens
                  </button>
                </div>
              </div>
            </div>
        </section>

        {/* Fractional Ownership */}
        <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg md:text-xl font-light mb-6">Tokenized Companies</h3>
              <div className="space-y-4">
                {[
                  { company: 'Login to see project', ownership: '12.5%', value: '$2.4M' },
                  { company: 'Login to see project', ownership: '8.2%', value: '$1.8M' },
                  { company: 'Login to see project', ownership: '15.8%', value: '$3.2M' }
                ].map((investment, index) => (
                  <div key={index} className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 italic font-light">{investment.company}</span>
                      <div className="flex gap-4">
                        <span className="text-sm text-gray-600 font-light">{investment.ownership}</span>
                        <span className="text-sm text-gray-600 font-light">{investment.value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleGetStarted}
                className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-light hover:bg-gray-800 transition-colors text-sm sm:text-base mt-4"
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
              <p className="text-gray-600 mb-6 text-sm md:text-base leading-relaxed">
                Own a piece of tokenized transportation companies. Jets, helicopters, and luxury car firms have tokenized their businesses, making fractional ownership accessible through utility tokens.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-200 px-3 py-1.5 rounded-full text-xs text-gray-700">Private Jets</span>
                <span className="bg-gray-200 px-3 py-1.5 rounded-full text-xs text-gray-700">Helicopters</span>
                <span className="bg-gray-200 px-3 py-1.5 rounded-full text-xs text-gray-700">Limousines</span>
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
                  description: "Explore our curated selection of tokenized jets, yachts, and premium assets available for fractional ownership.",
                  tags: ["DAOs", "Assets"]
                },
                {
                  number: 2,
                  title: "Buy Assets After Successful KYC/AML",
                  description: "Complete our secure verification process and purchase your desired asset tokens with full regulatory compliance.",
                  tags: ["KYC/AML", "Secure"]
                },
                {
                  number: 3,
                  title: "Own a Piece of Jet, Yacht & More",
                  description: "Hold fractional ownership of luxury assets through blockchain technology - fully digital, transparent, and tradeable.",
                  tags: ["Fractional", "Blockchain"]
                },
                {
                  number: 4,
                  title: "Get Your Utility Membership",
                  description: "Unlock exclusive benefits, priority booking, and special rates with your digital asset ownership membership.",
                  tags: ["Benefits", "Priority"]
                },
                {
                  number: 5,
                  title: "Request, Book, Pay & Enjoy",
                  description: "Experience seamless blockchain-powered booking for your flights, yacht charters, and luxury services.",
                  tags: ["Book", "Enjoy"]
                }
              ].map((step, index) => (
                <div key={index} className="relative flex flex-col items-center text-center">
                  {/* Step Number Circle */}
                  <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mb-4 text-lg font-light relative z-10">
                    {step.number}
                  </div>

                  {/* Step Content Card */}
                  <div className="max-w-xs bg-white border border-gray-100 rounded-2xl p-6 shadow-sm h-64 flex flex-col">
                    <h3 className="text-base font-light text-gray-900 mb-3 leading-tight">{step.title}</h3>
                    <p className="text-sm text-gray-600 font-light leading-relaxed mb-4 flex-1">{step.description}</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {step.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">{tag}</span>
                      ))}
                    </div>
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
              <p className="text-gray-600 text-sm font-light leading-relaxed">
                Powered by blockchain, every crypto asset and smart contract is secure, decentralized.
              </p>
            </div>
          </div>

          {/* 4 Cards in 2x2 Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Top Left - Own Your Identity */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 h-72">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>

              {/* Content */}
              <div className="relative h-full flex flex-col justify-end p-8">
                <h3 className="text-lg font-light text-gray-900 mb-3">Own your identity</h3>
                <p className="text-sm text-gray-600 font-light leading-relaxed mb-3">
                  With decentralized identities, you control how and where your personal information is used—no more data harvesting.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Decentralized</span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Privacy</span>
                </div>
              </div>
            </div>

            {/* Top Right - Own Rare Digital Assets */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 h-72">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>

              {/* Content */}
              <div className="relative h-full flex flex-col justify-end p-8">
                <h3 className="text-lg font-light text-gray-900 mb-3">Own rare digital assets</h3>
                <p className="text-sm text-gray-600 font-light leading-relaxed mb-3">
                  From Bitcoin to altcoins, stablecoins to tokens—crypto makes financial ownership borderless and decentralized.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Crypto</span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Borderless</span>
                </div>
              </div>
            </div>

            {/* Bottom Left - Own Your Financial Future */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 h-72">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-teal-50"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>

              {/* Content */}
              <div className="relative h-full flex flex-col justify-end p-8">
                <h3 className="text-lg font-light text-gray-900 mb-3">Own your financial future</h3>
                <p className="text-sm text-gray-600 font-light leading-relaxed mb-3">
                  DeFi (Decentralized Finance) gives you access to borderless financial systems, from earning interest to lending assets—all powered by smart contracts.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">DeFi</span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Smart Contracts</span>
                </div>
              </div>
            </div>

            {/* Bottom Right - Own Your Role in the New Web */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 h-72">
              {/* DAO badge */}
              <div className="absolute top-8 right-8 bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs z-10">
                DAO
              </div>

              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-pink-50"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>

              {/* Content */}
              <div className="relative h-full flex flex-col justify-end p-8">
                <h3 className="text-lg font-light text-gray-900 mb-3">Own your role in the new web</h3>
                <p className="text-sm text-gray-600 font-light leading-relaxed mb-3">
                  Participate in DAOs, support open protocols, and help build a transparent digital economy.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">DAOs</span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Transparent</span>
                </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  question: "How does tokenized flight booking work?",
                  answer: "Every flight booking is converted into a digital token on the blockchain. This token represents your booking rights and can be securely transferred, traded, or redeemed. Smart contracts automatically handle payment processing, verification, and fulfillment."
                },
                {
                  question: "What cryptocurrencies do you accept?",
                  answer: "We accept major cryptocurrencies including ETH, BTC, USDC, USDT, and our native CharterToken (PVCX). All payments are processed securely through our blockchain infrastructure with instant confirmation and transparent transaction records."
                },
                {
                  question: "Is my flight data secure on the blockchain?",
                  answer: "Absolutely. All sensitive data is encrypted and stored using advanced cryptographic methods. Only essential booking information is recorded on-chain, while personal details remain private and protected in compliance with global data protection regulations."
                },
                {
                  question: "Can I trade my flight tokens with others?",
                  answer: "Yes. Flight tokens are fully transferable on our secondary marketplace. You can list your booking for sale, transfer it to another wallet, or trade it peer-to-peer. All transfers are validated by smart contracts to ensure security and authenticity."
                },
                {
                  question: "How do NFT memberships work?",
                  answer: "NFT memberships grant you exclusive access to premium benefits, priority bookings, and special rates. Each membership tier (Bronze, Silver, Gold, Platinum) is represented by a unique NFT that proves ownership and unlocks specific perks within the ecosystem."
                },
                {
                  question: "What are the benefits of fractional ownership?",
                  answer: "Fractional ownership allows you to invest in high-value aviation assets with lower capital requirements. You receive proportional returns, voting rights in asset decisions, and can trade your shares on the secondary market for liquidity."
                },
                {
                  question: "How are asset valuations determined?",
                  answer: "Asset valuations are conducted by certified third-party appraisers using industry-standard methodologies. Factors include aircraft age, condition, market demand, maintenance history, and comparable sales data. Valuations are updated quarterly and published transparently."
                },
                {
                  question: "What happens if I want to sell my tokens?",
                  answer: "You can list your tokens on our integrated marketplace or transfer them to any compatible Web3 wallet. Liquidity is enhanced through our automated market maker (AMM) pools, and all transactions are settled instantly on-chain with minimal fees."
                }
              ].map((faq, index) => (
                <FAQCard key={index} question={faq.question} answer={faq.answer} />
              ))}
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
          <div className="max-w-md mx-auto">
            <NewsletterForm
              compact
              source="web"
              placeholder="Enter your email address"
              buttonText="Subscribe"
            />
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