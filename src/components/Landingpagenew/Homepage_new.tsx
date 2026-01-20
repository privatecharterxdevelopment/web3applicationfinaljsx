import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FloatingSearchModal from './FloatingSearchModal';
import AnimatedSection from '../AnimatedSection';
import LandingHeader from './LandingHeader';
import { supabase } from '../../lib/supabase';
import { LiveSupportWidget } from '../LiveSupportChat';
import Globe3D from '../Globe3D';
import { fetchFixedOffers, FixedOffer } from '../../services/fixedOffersService';
import NewsletterForm from '../NewsletterForm';
import Footer from './Footer';
import {
  Plane,
  Shield,
  Coins,
  Clock,
  Globe,
  Bitcoin,
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
  Car,
  Search
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

// City images mapping
const cityImages: { [key: string]: string } = {
  'LAX': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=400&q=80', // Los Angeles
  'MIA': 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=400&q=80', // Miami
  'CHI': 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=400&q=80', // Chicago
  'PAR': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80', // Paris
  'ROM': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80', // Rome
  'BCN': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80', // Barcelona
  'SIN': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80', // Singapore
  'BKK': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80', // Bangkok
  'HKG': 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=400&q=80', // Hong Kong
  'TYO': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80', // Tokyo
  'SYD': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80', // Sydney
  'HNL': 'https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=400&q=80', // Honolulu
  'MIL': 'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=400&q=80', // Milan
  'AMS': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&q=80', // Amsterdam
  'BER': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&q=80', // Berlin
  'CUN': 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=400&q=80', // Cancun
  'NAS': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&q=80', // Nassau
  'SJU': 'https://images.unsplash.com/photo-1579687196544-08ae57ab5960?w=400&q=80', // San Juan
  'SEA': 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=400&q=80', // Seattle
  'LAS': 'https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=400&q=80', // Las Vegas
  'DEN': 'https://images.unsplash.com/photo-1619856699906-09e1f58c98b1?w=400&q=80', // Denver
  'ATL': 'https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=400&q=80', // Atlanta
  'DFW': 'https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=400&q=80', // Dallas
  'BOS': 'https://images.unsplash.com/photo-1501979376754-2ff867a4f659?w=400&q=80', // Boston
};

// City full names
const cityNames: { [key: string]: string } = {
  'LAX': 'Los Angeles', 'MIA': 'Miami', 'CHI': 'Chicago', 'PAR': 'Paris',
  'ROM': 'Rome', 'BCN': 'Barcelona', 'SIN': 'Singapore', 'BKK': 'Bangkok',
  'HKG': 'Hong Kong', 'TYO': 'Tokyo', 'SYD': 'Sydney', 'HNL': 'Honolulu',
  'MIL': 'Milan', 'AMS': 'Amsterdam', 'BER': 'Berlin', 'CUN': 'Cancun',
  'NAS': 'Nassau', 'SJU': 'San Juan', 'SEA': 'Seattle', 'LAS': 'Las Vegas',
  'DEN': 'Denver', 'ATL': 'Atlanta', 'DFW': 'Dallas', 'BOS': 'Boston',
  'NYC': 'New York', 'LON': 'London', 'DXB': 'Dubai', 'SFO': 'San Francisco'
};

// Flight offers data for animated cards (from-to format with original prices)
const flightOffersData = [
  [
    { from: 'NYC', to: 'LAX', price: 269, originalPrice: 299 },
    { from: 'NYC', to: 'MIA', price: 224, originalPrice: 249 },
    { from: 'NYC', to: 'CHI', price: 179, originalPrice: 199 },
  ],
  [
    { from: 'LON', to: 'PAR', price: 134, originalPrice: 149 },
    { from: 'LON', to: 'ROM', price: 161, originalPrice: 179 },
    { from: 'LON', to: 'BCN', price: 116, originalPrice: 129 },
  ],
  [
    { from: 'DXB', to: 'SIN', price: 404, originalPrice: 449 },
    { from: 'DXB', to: 'BKK', price: 359, originalPrice: 399 },
    { from: 'DXB', to: 'HKG', price: 431, originalPrice: 479 },
  ],
  [
    { from: 'LAX', to: 'TYO', price: 629, originalPrice: 699 },
    { from: 'LAX', to: 'SYD', price: 719, originalPrice: 799 },
    { from: 'LAX', to: 'HNL', price: 314, originalPrice: 349 },
  ],
  [
    { from: 'PAR', to: 'MIL', price: 89, originalPrice: 99 },
    { from: 'PAR', to: 'AMS', price: 80, originalPrice: 89 },
    { from: 'PAR', to: 'BER', price: 98, originalPrice: 109 },
  ],
  [
    { from: 'MIA', to: 'CUN', price: 179, originalPrice: 199 },
    { from: 'MIA', to: 'NAS', price: 134, originalPrice: 149 },
    { from: 'MIA', to: 'SJU', price: 161, originalPrice: 179 },
  ],
  [
    { from: 'SFO', to: 'SEA', price: 116, originalPrice: 129 },
    { from: 'SFO', to: 'LAS', price: 80, originalPrice: 89 },
    { from: 'SFO', to: 'DEN', price: 134, originalPrice: 149 },
  ],
  [
    { from: 'CHI', to: 'ATL', price: 125, originalPrice: 139 },
    { from: 'CHI', to: 'DFW', price: 143, originalPrice: 159 },
    { from: 'CHI', to: 'BOS', price: 161, originalPrice: 179 },
  ],
];

function Homepage() {
  const navigate = useNavigate();
  const [jets, setJets] = useState<Jet[]>([]);
  const [cardImageIndexes, setCardImageIndexes] = useState<{[key: string]: number}>({});
  const [showPromoBanner, setShowPromoBanner] = useState(true);
  const [showLiveSupportChat, setShowLiveSupportChat] = useState(false);
  const [flightOfferIndexes, setFlightOfferIndexes] = useState([0, 0, 0, 0, 0, 0, 0, 0]);
  const [adventurePackages, setAdventurePackages] = useState<FixedOffer[]>([]);
  const [flightSearch, setFlightSearch] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    journeyType: 'return' as 'one-way' | 'return' | 'multi-city'
  });

  // Handle flight search - save to localStorage and navigate
  const handleFlightSearch = () => {
    if (!flightSearch.origin || !flightSearch.destination || !flightSearch.departureDate) return;

    // Save search to localStorage
    localStorage.setItem('flightSearchParams', JSON.stringify({
      ...flightSearch,
      timestamp: Date.now()
    }));

    // Navigate to flights page with search params
    const params = new URLSearchParams({
      origin: flightSearch.origin,
      destination: flightSearch.destination,
      date: flightSearch.departureDate,
      passengers: flightSearch.passengers.toString(),
      journeyType: flightSearch.journeyType
    });
    if (flightSearch.returnDate && flightSearch.journeyType !== 'one-way') {
      params.set('returnDate', flightSearch.returnDate);
    }
    navigate(`/flights?${params.toString()}`);
  };

  // Animated flight offers - each card switches at different intervals (slower)
  useEffect(() => {
    const intervals = [12000, 15000, 13000, 14000, 11000, 16000, 12500, 14500]; // Slower intervals for each card
    const timers = intervals.map((interval, cardIndex) => {
      return setInterval(() => {
        setFlightOfferIndexes(prev => {
          const newIndexes = [...prev];
          newIndexes[cardIndex] = (newIndexes[cardIndex] + 1) % flightOffersData[cardIndex].length;
          return newIndexes;
        });
      }, interval);
    });

    return () => timers.forEach(timer => clearInterval(timer));
  }, []);

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

  // Fetch adventure packages from database
  useEffect(() => {
    const fetchAdventurePackages = async () => {
      try {
        const result = await fetchFixedOffers({ limit: 8 });
        setAdventurePackages(result.data);
      } catch (error) {
        console.error('Error fetching adventure packages:', error);
      }
    };
    fetchAdventurePackages();
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

      {/* Hero Section - Title Based Design */}
      <div className="max-w-7xl mx-auto rounded-2xl overflow-hidden min-h-[calc(100vh-120px)] flex flex-col items-center justify-center px-4 py-12">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100/60 backdrop-blur-sm rounded-full border border-gray-300/30 mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] text-gray-600 font-medium tracking-wide uppercase">web3 and ai powered multi charter</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl md:text-5xl font-light text-gray-900 text-center mb-10 tracking-tighter">
          AI Luxury Travel Agent
        </h1>

        {/* Subtitle */}
        <p className="text-gray-500 text-sm sm:text-base font-light text-center mb-8 max-w-2xl">
          Book commercial flights, private jets, helicopters & yachts - all in one platform.<br />
          Instant quotes, custom routes, crypto payments accepted - manually or by AI chat.
        </p>

        {/* Floating Search Modal */}
        <div className="w-full max-w-2xl">
          <FloatingSearchModal />
        </div>

        {/* Stats row below search */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-6 sm:gap-8 text-sm text-gray-400">
          {/* Trustpilot Badge */}
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#00B67A"/>
            </svg>
            <span className="text-gray-600 font-medium">Trustpilot</span>
            <div className="flex gap-0.5">
              {[1,2,3,4].map(i => (
                <svg key={i} className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#00B67A">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
              ))}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#DDD">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <span className="text-xs text-gray-500">Great</span>
          </div>
          <div className="w-px h-4 bg-gray-300 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Bitcoin className="w-4 h-4" />
            <span>Crypto Accepted</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>24/7 Support</span>
          </div>
        </div>

      </div>

      {/* Airline Partners Carousel - Duffel CDN Logos */}
      <div className="mt-8 px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

          <style>{`
            @keyframes scrollAirlines {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .airline-carousel {
              animation: scrollAirlines 60s linear infinite;
            }
          `}</style>
          <div className="airline-carousel flex items-center gap-12 w-max py-3">
            {[...Array(2)].map((_, setIndex) => (
              <div key={setIndex} className="flex items-center gap-10">
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/LX.svg" alt="Swiss" className="h-5 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/EK.svg" alt="Emirates" className="h-5 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/LH.svg" alt="Lufthansa" className="h-5 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/BA.svg" alt="British Airways" className="h-5 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/AF.svg" alt="Air France" className="h-3 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/KL.svg" alt="KLM" className="h-5 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/SQ.svg" alt="Singapore Airlines" className="h-5 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/TK.svg" alt="Turkish Airlines" className="h-5 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/EY.svg" alt="Etihad" className="h-5 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/UA.svg" alt="United" className="h-5 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/AA.svg" alt="American Airlines" className="h-5 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/DL.svg" alt="Delta" className="h-5 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/CX.svg" alt="Cathay Pacific" className="h-5 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/JL.svg" alt="Japan Airlines" className="h-5 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/NH.svg" alt="ANA" className="h-5 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/QF.svg" alt="Qantas" className="h-5 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/QR.svg" alt="Qatar Airways" className="h-5 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/IB.svg" alt="Iberia" className="h-5 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/WK.svg" alt="Edelweiss" className="h-5 opacity-20 grayscale" />
                <img src="https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/AY.svg" alt="Finnair" className="h-3 opacity-20 grayscale" />
              </div>
            ))}
          </div>
        </div>
      </div>


        {/* Featured Banner + Cards Section */}
        <section className="px-4 sm:px-8 pt-8 sm:pt-12 pb-2 sm:pb-3 max-w-6xl mx-auto">
          {/* Banner - Book a Private Jet */}
          <div
            className="group relative rounded-2xl overflow-hidden mb-4 border border-gray-200"
            style={{ minHeight: '280px', backgroundColor: '#fafafa' }}
          >
            {/* Jet image - mirrored, positioned right */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_2bf440d9864c127ab3e44c5f05646454eg.png)',
                backgroundPosition: '-20% center',
                backgroundSize: '55%',
                backgroundRepeat: 'no-repeat',
                transform: 'scaleX(-1)'
              }}
            />
            {/* Text - bottom left, no card bg */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-8 sm:p-12">
              <h3 className="text-2xl sm:text-3xl font-light mb-4 tracking-tight">
                <span className="text-gray-900">Book a</span> <span className="text-gray-500">Private Jet</span>
              </h3>
              <div className="flex gap-2">
                <a
                  href="mailto:bookings@privatecharterx.com?subject=Private Jet Quote Request"
                  className="px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full text-xs text-gray-700 hover:bg-white transition-colors"
                >
                  Get a Quote
                </a>
                <button
                  onClick={() => navigate('/chat?query=I%20want%20to%20book%20a%20private%20jet')}
                  className="px-3 py-1.5 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors"
                >
                  Book by AI
                </button>
              </div>
            </div>
          </div>

          {/* 2 Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1 - Book a Helicopter */}
            <div
              className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200"
              style={{ minHeight: '320px' }}
            >
              {/* Helicopter image - normal size */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_bf9f83710232184b8f94a95270a5a4beeg.png)',
                  backgroundPosition: 'center',
                  backgroundSize: 'cover'
                }}
              />
              {/* Text - bottom left */}
              <div className="absolute bottom-0 left-0 z-20 p-8 sm:p-12">
                <h3 className="text-2xl sm:text-3xl font-light mb-4 tracking-tight">
                  <span className="text-gray-900">Book a</span> <span className="text-gray-500">Helicopter</span>
                </h3>
                <div className="flex gap-2">
                  <a
                    href="mailto:bookings@privatecharterx.com?subject=Helicopter Quote Request"
                    className="px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full text-xs text-gray-700 hover:bg-white transition-colors"
                  >
                    Get a Quote
                  </a>
                  <button
                    onClick={() => navigate('/chat?query=I%20want%20to%20book%20a%20helicopter')}
                    className="px-3 py-1.5 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors"
                  >
                    Book by AI
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2 - Book a Yacht or Boat */}
            <div
              onClick={() => navigate('/chat?query=I%20want%20to%20book%20a%20yacht')}
              className="group relative bg-white rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-200"
              style={{ minHeight: '320px' }}
            >
              {/* Yacht video background */}
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src="https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/4920651-uhd_4096_2160_25fps.mp4" type="video/mp4" />
              </video>
              {/* Badges only - bottom left, no card bg */}
              <div className="absolute bottom-0 left-0 z-20 p-6">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-gray-700 border border-gray-200">Motor Yachts</span>
                  <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-gray-700 border border-gray-200">Sailing</span>
                  <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-gray-700 border border-gray-200">Superyachts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Big Card - Commercial Tickets */}
          <div
            className="group relative bg-white rounded-2xl overflow-hidden mt-4 border border-gray-200"
            style={{ minHeight: '640px' }}
          >
            {/* Content container - no airplane bg */}
            <div className="relative z-20 p-8 sm:p-12 flex flex-col justify-between h-full">
              {/* Title - no card bg */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-2xl sm:text-3xl font-light tracking-tight">
                    <span className="text-gray-900">Commercial</span> <span className="text-gray-500">Tickets</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/chat?query=I%20want%20to%20book%20a%20commercial%20flight')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
                    >
                      <Sparkles size={14} />
                      Book by AI
                    </button>
                    <button
                      onClick={() => navigate('/flights')}
                      className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <ArrowRight size={18} className="text-gray-600" />
                    </button>
                  </div>
                </div>
                {/* Journey Type Pills */}
                <div className="flex gap-2 mb-4">
                  {(['one-way', 'return', 'multi-city'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFlightSearch({ ...flightSearch, journeyType: type });
                      }}
                      className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                        flightSearch.journeyType === type
                          ? 'bg-gray-900 text-white'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {type === 'one-way' ? 'One-way' : type === 'return' ? 'Return' : 'Multi-city'}
                    </button>
                  ))}
                </div>

                {/* Flight Search Bar */}
                <div
                  className="bg-gray-50 rounded-xl border border-gray-200 p-1.5 mb-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col sm:flex-row gap-1">
                    {/* Origin */}
                    <div className="flex-1 px-3 py-2 bg-white rounded-lg border border-gray-100">
                      <label className="block text-[10px] font-medium text-gray-500 mb-0.5">From</label>
                      <input
                        type="text"
                        placeholder="City or airport"
                        value={flightSearch.origin}
                        onChange={(e) => setFlightSearch({ ...flightSearch, origin: e.target.value })}
                        className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
                      />
                    </div>

                    {/* Destination */}
                    <div className="flex-1 px-3 py-2 bg-white rounded-lg border border-gray-100">
                      <label className="block text-[10px] font-medium text-gray-500 mb-0.5">To</label>
                      <input
                        type="text"
                        placeholder="City or airport"
                        value={flightSearch.destination}
                        onChange={(e) => setFlightSearch({ ...flightSearch, destination: e.target.value })}
                        className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
                      />
                    </div>

                    {/* Departure Date */}
                    <div className="flex-1 px-3 py-2 bg-white rounded-lg border border-gray-100">
                      <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Departure</label>
                      <input
                        type="date"
                        value={flightSearch.departureDate}
                        onChange={(e) => setFlightSearch({ ...flightSearch, departureDate: e.target.value })}
                        className="w-full text-sm text-gray-900 bg-transparent outline-none"
                      />
                    </div>

                    {/* Return Date - only show for return/multi-city */}
                    {flightSearch.journeyType !== 'one-way' && (
                      <div className="flex-1 px-3 py-2 bg-white rounded-lg border border-gray-100">
                        <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Return</label>
                        <input
                          type="date"
                          value={flightSearch.returnDate}
                          onChange={(e) => setFlightSearch({ ...flightSearch, returnDate: e.target.value })}
                          className="w-full text-sm text-gray-900 bg-transparent outline-none"
                        />
                      </div>
                    )}

                    {/* Passengers */}
                    <div className="hidden sm:block w-24 px-3 py-2 bg-white rounded-lg border border-gray-100">
                      <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Passengers</label>
                      <select
                        value={flightSearch.passengers}
                        onChange={(e) => setFlightSearch({ ...flightSearch, passengers: parseInt(e.target.value) })}
                        className="w-full text-sm text-gray-900 bg-transparent outline-none cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>

                    {/* Search Button */}
                    <button
                      onClick={handleFlightSearch}
                      disabled={!flightSearch.origin || !flightSearch.destination || !flightSearch.departureDate}
                      className="px-6 py-2 bg-gray-900 rounded-lg text-sm text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Search size={16} />
                      <span className="hidden sm:inline">Search</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Animated Flight Offers Grid - 2 rows of 4 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {flightOffersData.map((offers, cardIndex) => {
                  const currentOffer = offers[flightOfferIndexes[cardIndex]];
                  const cityImage = cityImages[currentOffer.to] || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80';
                  const cityName = cityNames[currentOffer.to] || currentOffer.to;
                  return (
                    <div
                      key={cardIndex}
                      onClick={() => navigate(`/flights?from=${encodeURIComponent(currentOffer.from)}&to=${encodeURIComponent(currentOffer.to)}`)}
                      className="group rounded-xl overflow-hidden transition-all duration-700 hover:scale-105 cursor-pointer bg-gray-100 border border-gray-200"
                    >
                      {/* City Image Header */}
                      <div className="relative h-[80px] overflow-hidden">
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          style={{ backgroundImage: `url(${cityImage})` }}
                        />
                      </div>

                      {/* Content - Blurred grey background */}
                      <div className="p-3 bg-gray-100">
                        <div className="flex items-center gap-1 text-gray-900 text-xs mb-1">
                          <span className="font-medium">{currentOffer.from}</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium">{currentOffer.to}</span>
                        </div>
                        <p className="text-gray-500 text-[10px] mb-1">{cityName}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-medium text-sm">${currentOffer.price}</span>
                          <span className="text-gray-400 text-xs line-through">${currentOffer.originalPrice}</span>
                          <span className="bg-green-500 text-white px-1.5 py-0.5 rounded text-[8px] font-medium">
                            -{Math.round((1 - currentOffer.price / currentOffer.originalPrice) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* View all link */}
              <div className="text-center mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/flights');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors underline"
                >
                  View all flights →
                </button>
              </div>
            </div>
          </div>

          {/* 3 Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {/* Card 1 - Empty Legs */}
            <div
              onClick={() => navigate('/empty-legs')}
              className="group relative bg-white rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-200"
              style={{ minHeight: '280px' }}
            >
              {/* Background image */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_8eaf61762669635badd48e59c304b6c3eg.png)',
                  backgroundPosition: 'center',
                  backgroundSize: 'cover'
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
                <div className="bg-white/70 backdrop-blur-md rounded-xl p-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-medium text-gray-900 tracking-tight whitespace-nowrap">
                    Empty Legs
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">Up to 75% Off</span>
                    <span className="bg-gray-200/80 px-2 py-1 rounded-full text-xs text-gray-700">Last Minute</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 - Ground Transport */}
            <div
              onClick={handleGetStarted}
              className="group relative bg-white rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-200"
              style={{ minHeight: '280px' }}
            >
              {/* Background image */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_60417b0dd969afb83c44f8733d7156eaeg.png)',
                  backgroundPosition: 'center -80px',
                  backgroundSize: '120%'
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
                <div className="bg-white/70 backdrop-blur-md rounded-xl p-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-medium text-gray-900 tracking-tight whitespace-nowrap">
                    Ground Transport
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-gray-200/80 px-2 py-1 rounded-full text-xs text-gray-700">24/7</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 - Group Charter */}
            <div
              onClick={handleGetStarted}
              className="group relative bg-white rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-200"
              style={{ minHeight: '280px' }}
            >
              {/* Background image */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_fb14380acaf092090044512c11a681a1eg.png)',
                  backgroundPosition: 'center',
                  backgroundSize: 'cover'
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
                <div className="bg-white/70 backdrop-blur-md rounded-xl p-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-medium text-gray-900 tracking-tight whitespace-nowrap">
                    Group Charter
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-gray-200/80 px-2 py-1 rounded-full text-xs text-gray-700">Corporate</span>
                    <span className="bg-gray-200/80 px-2 py-1 rounded-full text-xs text-gray-700">Events</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Extra Large Card - Globally Covered */}
          <div
            className="group relative bg-white rounded-2xl overflow-hidden mt-4 border border-gray-200"
            style={{ minHeight: '640px' }}
          >
            {/* Title - upper centered */}
            <div className="absolute top-0 left-0 right-0 z-20 p-8 sm:p-12 text-center">
              <h3 className="text-2xl sm:text-3xl font-light text-gray-900 mb-3 tracking-tight">
                Globally Covered
              </h3>
              <p className="text-gray-600 text-sm mb-4 max-w-lg mx-auto">
                From New York to Tokyo, London to Cape Town, Zurich to Dubai - PrivateCharterX connects you to premium charter services worldwide. One platform, unlimited destinations.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-700">Europe</span>
                <span className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-700">USA</span>
                <span className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-700">Asia</span>
                <span className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-700">Africa</span>
                <span className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-700">Switzerland</span>
              </div>
            </div>
            {/* Globe - half cut from bottom, centered */}
            <div
              className="absolute bottom-0 left-0 right-0 flex justify-center"
              style={{ height: '900px', marginBottom: '-450px' }}
            >
              <div style={{ width: '900px', height: '900px' }}>
                <Globe3D />
              </div>
            </div>
          </div>
        </section>

        {/* CharterToken Ecosystem - HIDDEN */}
        {/* Section removed as per request */}

        {/* Fractional Ownership - HIDDEN */}
        {/* Section removed as per request */}

        {/* Philosophy Text Section */}
        <AnimatedSection animation="fade-in" delay={100}>
          <section className="px-4 sm:px-8 py-12 sm:py-16 max-w-4xl mx-auto">
            <p className="text-center text-base sm:text-lg text-gray-800 leading-relaxed">
              PrivateCharterX is the world's first <span className="bg-gray-200 px-2 py-1 rounded">Web3 and AI-powered</span> luxury travel platform. Jets, helicopters, empty legs, luxury rentals, transfers, curated adventures—searchable by AI, bookable 24/7 with <span className="bg-gray-200 px-2 py-1 rounded">70+ cryptocurrencies</span> via CoinGate. Human support standing by. Our <span className="bg-gray-200 px-2 py-1 rounded">tokenization services</span> transforms aircraft, hangars, and airfields into income-generating digital assets while staying operational. NFT holders unlock <span className="bg-gray-200 px-2 py-1 rounded">free empty legs</span>, 10% discounts, and priority access.
            </p>
          </section>
        </AnimatedSection>

        {/* All-in-one Global Mobility Platform - ChatGPT Style */}
        <AnimatedSection animation="slide-up" delay={150}>
          <section className="px-4 sm:px-8 py-8 sm:py-12 max-w-6xl mx-auto">
            {/* Container */}
            <div
              className="relative rounded-3xl overflow-hidden"
              style={{
                minHeight: '500px'
              }}
            >
              {/* Content */}
              <div className="relative px-6 sm:px-12 py-8 sm:py-12">
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
                          privatecharterx.com/chat
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
                        window.location.href = '/chat';
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

        {/* Adventure Packages - 8 Cards */}
        <section className="px-4 sm:px-8 py-8 sm:py-12 max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2 tracking-tight">Adventure Packages</h2>
            <p className="text-gray-500 text-sm">Curated experiences ready to book</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {adventurePackages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => navigate('/adventures')}
                className="group rounded-xl overflow-hidden transition-all duration-700 hover:scale-105 cursor-pointer bg-gray-100 border border-gray-200"
              >
                {/* Image Header */}
                <div className="relative h-[100px] overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{
                      backgroundImage: `url(${pkg.image_url || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80'})`
                    }}
                  />
                </div>

                {/* Content */}
                <div className="p-3 bg-gray-100">
                  <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                    {pkg.title}
                  </h3>
                  <p className="text-gray-500 text-[10px] mb-2 line-clamp-1">
                    {pkg.origin} → {pkg.destination || 'Multi-stop'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-medium text-sm">
                      {pkg.currency === 'EUR' ? '€' : '$'}{pkg.price?.toLocaleString() || 'On request'}
                    </span>
                    {pkg.aircraft_type && (
                      <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-[8px]">
                        {pkg.aircraft_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* View all link */}
          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/adventures')}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors underline"
            >
              View all adventure packages →
            </button>
          </div>
        </section>

        {/* Tokenization & Web3 Section */}
        <section className="px-4 sm:px-8 py-8 sm:py-12 max-w-6xl mx-auto">
          {/* Centered Title & Description */}
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight mb-3">
              <span className="text-gray-900">RWA</span> <span className="text-gray-500">Tokenization</span>
            </h3>
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto mb-4">
              Transform your real-world assets into income-generating digital investments. Hotels listed for bookings, jets operated by our network, travel businesses integrated for global reach.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-5">
              <span className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-700">Hotels & Resorts</span>
              <span className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-700">Private Jets</span>
              <span className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-700">Travel Businesses</span>
              <span className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-700">Hangars & Airfields</span>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate('/chat?query=Calculate%20revenue%20APY%20for%20tokenizing%20my%20asset&newChat=true')}
                className="px-5 py-2.5 bg-gray-900 rounded-lg text-sm font-medium text-white hover:bg-gray-800 transition-colors"
              >
                Calculate Revenue APY
              </button>
              <button
                onClick={() => navigate('/tokenized')}
                className="px-5 py-2.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Two Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* NFT Membership Card */}
            <div
              onClick={() => navigate('/rwa-nft')}
              className="group relative rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-200"
              style={{ minHeight: '260px' }}
            >
              {/* Video Background */}
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src="https://auth.privatecharterx.com/storage/v1/object/public/logos/PrivateCharterX_transparent%20(2).mp4" type="video/mp4" />
              </video>
              {/* Content at bottom */}
              <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
                <div className="bg-white/70 backdrop-blur-md rounded-xl p-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-medium text-gray-900 tracking-tight whitespace-nowrap">
                    NFT Membership
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-gray-200/80 px-2 py-1 rounded-full text-xs text-gray-700">10% Off</span>
                    <span className="bg-gray-200/80 px-2 py-1 rounded-full text-xs text-gray-700">Free Empty Leg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PVCX Token Card */}
            <div
              onClick={() => navigate('/rws/pvcx-token')}
              className="group relative rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-200"
              style={{ minHeight: '260px' }}
            >
              {/* Background */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/logos/Whisk_iwzzu2nzizyzmmn50szjzgotutn1qtllfwnh1so.png)',
                  backgroundPosition: 'center',
                  backgroundSize: 'cover'
                }}
              />
              {/* Content at bottom */}
              <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
                <div className="bg-white/70 backdrop-blur-md rounded-xl p-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-medium text-gray-900 tracking-tight whitespace-nowrap">
                    $PVCX Token
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-gray-200/80 px-2 py-1 rounded-full text-xs text-gray-700">Utility Token</span>
                    <span className="bg-gray-200/80 px-2 py-1 rounded-full text-xs text-gray-700">Staking Rewards</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <AnimatedSection animation="slide-up" delay={100}>
          <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-gray-900 mb-2 tracking-tight">Got Questions?</h2>
              <h3 className="text-xl font-light text-gray-500 tracking-tight">We've got answers</h3>
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
                  answer: "Our NFT Membership (1.0 ETH) gives you 10% off all bookings, one free empty leg per year, priority access to deals, and exclusive VIP experiences. Benefits are verifiable on-chain and transferable."
                },
                {
                  question: "What subscription plans are available?",
                  answer: "Explorer ($99/mo), Traveller ($199/mo), and Elite ($999/mo with unlimited AI chats). Each tier unlocks commission discounts on bookings. Annual plans available."
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

          </div>
          </section>
        </AnimatedSection>

        {/* Bottom CTA */}
        <section className="px-4 sm:px-8 py-16 sm:py-24 max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-4 tracking-tighter">
            Ready to elevate your travel experience?
          </h2>
          <p className="text-gray-500 text-lg mb-8 max-w-2xl mx-auto">
            Book your next journey with AI-powered precision, crypto payments, and 24/7 concierge support.
          </p>
          <button
            onClick={() => navigate('/chat?newChat=true')}
            className="bg-gray-900 text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Start Planning Now
          </button>
        </section>

        {/* Footer */}
        <Footer />

        {/* "Need support?" Banner - Bottom Right - Glassmorphic */}
        {showPromoBanner && !showLiveSupportChat && (
          <div className="fixed bottom-6 right-6 z-50">
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{
                width: '260px',
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setShowPromoBanner(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="p-5">
                <p className="text-sm text-gray-700 leading-relaxed mb-4 pr-4">
                  Need support?
                </p>

                {/* CTA Button */}
                <button
                  onClick={() => setShowLiveSupportChat(true)}
                  className="w-full py-2.5 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    color: '#374151'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                  }}
                >
                  <span>Chat with us</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* Contact link */}
                <p className="text-[11px] text-gray-500 text-center mt-3">
                  Or email us at{' '}
                  <a
                    href="mailto:bookings@privatecharterx.com"
                    className="text-gray-700 hover:text-gray-900 underline"
                  >
                    bookings@privatecharterx.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Live Support Chat Window */}
      <LiveSupportWidget isOpen={showLiveSupportChat} onClose={() => setShowLiveSupportChat(false)} />
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