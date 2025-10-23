import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Bell, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../../thefinalwebapplicationpcx-main/src/context/AuthContext';
import { useAccount } from 'wagmi';
import { web3Service } from '../../../thefinalwebapplicationpcx-main/src/lib/web3';
import UserMenu from '../UserMenu';
import WalletMenu from '../WalletMenu';
import LoginModal from '../LoginModalNew';
import RegisterModalNew from '../RegisterModalNew';
import ForgotPasswordModal from '../ForgotPasswordModal';
import UnifiedBookingFlow from '../../../thefinalwebapplicationpcx-main/src/components/UnifiedBookingFlow';
import DashboardOverviewNew from '../../../thefinalwebapplicationpcx-main/src/components/DashboardOverviewNew';

const TokenizedAssets = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, profile } = useAuth();
  const { isConnected, address } = useAccount();

  const [currentPage, setCurrentPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState('services');
  const [dashboardView, setDashboardView] = useState('overview');

  // Auth modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Search and UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: '1', text: 'New empty leg available: Zurich to London', time: '5m ago', unread: true },
    { id: '2', text: 'Your booking request was confirmed', time: '1h ago', unread: true },
    { id: '3', text: 'New adventure offer in Dubai', time: '2h ago', unread: false }
  ]);
  const [favorites, setFavorites] = useState([]);

  // Web3 / NFT states
  const [userNFTs, setUserNFTs] = useState([]);
  const [userCO2Certificates, setUserCO2Certificates] = useState([]);
  const [isLoadingWeb3, setIsLoadingWeb3] = useState(false);

  // Dashboard data states
  const [locationData, setLocationData] = useState({ city: 'Pakanbaru', country: 'Indonesia' });
  const [weatherData, setWeatherData] = useState({
    temperature: 32,
    condition: 'Mostly clear',
    high: 36,
    low: 24,
    windSpeed: 5,
    humidity: 74
  });
  const [recentRequests, setRecentRequests] = useState([
    { id: 1, type: 'jets', data: { from: 'London', to: 'Paris' }, created_at: new Date() },
    { id: 2, type: 'emptyleg', data: { from: 'Zurich', to: 'London' }, created_at: new Date() },
    { id: 3, type: 'helicopter', data: { from: 'Monaco', to: 'Nice' }, created_at: new Date() }
  ]);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
    }
  }, [isAuthenticated]);

  // Check for dashboard tab from user menu navigation
  useEffect(() => {
    const dashboardTab = sessionStorage.getItem('dashboardTab');
    if (dashboardTab) {
      setActiveCategory('dashboard');
      setDashboardView(dashboardTab);
      sessionStorage.removeItem('dashboardTab'); // Clear after using
    }
  }, []);

  // Load NFTs and CO2 certificates when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      loadWeb3Data();
    }
  }, [isConnected, address]);

  const loadWeb3Data = async () => {
    if (!address) return;

    setIsLoadingWeb3(true);
    try {
      const [nfts, co2Certs] = await Promise.all([
        web3Service.getUserNFTs(address),
        web3Service.getUserCO2Certificates(address)
      ]);
      setUserNFTs(nfts);
      setUserCO2Certificates(co2Certs);
    } catch (error) {
      console.error('Error loading Web3 data:', error);
    } finally {
      setIsLoadingWeb3(false);
    }
  };

  const handleLogout = useCallback(() => {
    console.log('User logged out');
  }, []);

  const handleShowDashboard = useCallback(() => {
    console.log('🚀 Opening dashboard...');
    window.location.href = '/dashboard';
  }, []);

  const handleWalletConnect = useCallback(() => {
    console.log('💳 Wallet connect requested');
  }, []);

  const handleChatSubmit = useCallback((message) => {
    console.log('Chat message submitted:', message);
    // Handle AI chat functionality here
  }, []);
  const [emptyLegsData, setEmptyLegsData] = useState([]);
  const [isLoadingEmptyLegs, setIsLoadingEmptyLegs] = useState(false);
  const [emptyLegsFilter, setEmptyLegsFilter] = useState('all'); // all, europe, usa, asia, etc.

  // Extended empty legs filters
  const [emptyLegsLocation, setEmptyLegsLocation] = useState('');
  const [emptyLegsDate, setEmptyLegsDate] = useState('');
  const [emptyLegsMaxPrice, setEmptyLegsMaxPrice] = useState('');

  // Adventures/Fixed Offers state
  const [adventuresData, setAdventuresData] = useState([]);
  const [isLoadingAdventures, setIsLoadingAdventures] = useState(false);
  const [adventuresFilter, setAdventuresFilter] = useState('all'); // all, europe, usa, asia, etc.
  const [adventuresSearch, setAdventuresSearch] = useState('');
  const [adventuresMaxPrice, setAdventuresMaxPrice] = useState('');

  // Luxury Cars state
  const [luxuryCarsData, setLuxuryCarsData] = useState([]);
  const [isLoadingLuxuryCars, setIsLoadingLuxuryCars] = useState(false);
  const [luxuryCarsFilter, setLuxuryCarsFilter] = useState('all'); // all, sedan, suv, sports, etc.
  const [luxuryCarsBrand, setLuxuryCarsBrand] = useState('');
  const [luxuryCarsLocation, setLuxuryCarsLocation] = useState('');
  const [luxuryCarsMaxPrice, setLuxuryCarsMaxPrice] = useState('');

  // Jets state
  const [jetsData, setJetsData] = useState([]);
  const [isLoadingJets, setIsLoadingJets] = useState(false);
  const [jetsFilter, setJetsFilter] = useState('all'); // all, light, midsize, heavy, ultra-long-range
  const [jetsSearch, setJetsSearch] = useState('');
  const [jetsMaxPrice, setJetsMaxPrice] = useState('');

  // Helicopters state
  const [helicoptersData, setHelicoptersData] = useState([]);
  const [isLoadingHelicopters, setIsLoadingHelicopters] = useState(false);
  const [helicoptersFilter, setHelicoptersFilter] = useState('all'); // all, twin-engine, luxury, etc.
  const [helicoptersSearch, setHelicoptersSearch] = useState('');
  const [helicoptersLocation, setHelicoptersLocation] = useState('');
  const [helicoptersMaxPrice, setHelicoptersMaxPrice] = useState('');

  // CO2/SAF state
  const [co2Data, setCO2Data] = useState([]);
  const [isLoadingCO2, setIsLoadingCO2] = useState(false);
  const [co2Filter, setCO2Filter] = useState('all'); // all, carbon-offset, saf, renewable
  const [co2Search, setCO2Search] = useState('');

  const assetsPerPage = 6;

  // Asset data for pagination
  const allAssets = [
    {
      id: 'gulfstream-g650',
      name: 'Gulfstream G650 Elite',
      location: 'Miami, FL',
      category: 'Aircraft',
      totalPrice: '12,500,000 USDT',
      yield: '8.5%',
      period: '2025-2030'
    },
    {
      id: 'luxury-resort-aspen',
      name: 'Luxury Resort Aspen',
      location: 'Aspen, CO',
      category: 'Resort',
      totalPrice: '5,200,000 USDT',
      vacationDays: '45 per year',
      period: '5 years'
    },
    {
      id: 'superyacht-azure',
      name: 'Superyacht Azure',
      location: 'Monaco',
      category: 'Yacht',
      totalPrice: '8,750,000 USDT',
      yield: '12.3%',
      period: '2024-2029'
    },
    {
      id: 'manhattan-penthouse',
      name: 'Manhattan Penthouse',
      location: 'New York, NY',
      category: 'Real Estate',
      totalPrice: '15,200,000 USDT',
      yield: '6.8%',
      period: '2025-2032'
    },
    {
      id: 'ferrari-collection',
      name: 'Ferrari Collection',
      location: 'Geneva, CH',
      category: 'Luxury Cars',
      totalPrice: '3,850,000 USDT',
      yield: '9.2%',
      period: '2024-2027'
    },
    {
      id: 'private-island-resort',
      name: 'Private Island Resort',
      location: 'Maldives',
      category: 'Resort',
      totalPrice: '25,600,000 USDT',
      yield: '11.7%',
      period: '2025-2035'
    }
  ];

  // Private Jet Charter data
  const privateJetAssets = [
    {
      id: 'gulfstream-g650-charter',
      name: 'Gulfstream G650 Charter',
      location: 'Global',
      category: 'Heavy Jet',
      totalPrice: '€14,000/hr',
      yield: '16 pax',
      period: 'On-demand'
    },
    {
      id: 'citation-excel',
      name: 'Citation Excel',
      location: 'Europe',
      category: 'Mid-Size',
      totalPrice: '€8,800/hr',
      yield: '8 pax',
      period: 'On-demand'
    },
    {
      id: 'phenom-300',
      name: 'Embraer Phenom 300',
      location: 'USA',
      category: 'Light Jet',
      totalPrice: '€5,100/hr',
      yield: '6 pax',
      period: 'On-demand'
    }
  ];

  // Helicopter Charter data
  const helicopterAssets = [
    {
      id: 'airbus-h135',
      name: 'Airbus H135',
      location: 'Monaco',
      category: 'Twin Engine',
      totalPrice: '€5,800/hr',
      capacity: '6 pax',
      availability: 'On-demand',
      image: 'https://images.unsplash.com/photo-1639089742630-ec968e4e8741?w=800',
      isHelicopter: true
    },
    {
      id: 'leonardo-aw109',
      name: 'Leonardo AW109',
      location: 'Switzerland',
      category: 'Luxury',
      totalPrice: '€7,200/hr',
      capacity: '7 pax',
      availability: 'On-demand',
      image: 'https://images.unsplash.com/photo-1583538921923-ce476c7f5e6f?w=800',
      isHelicopter: true
    }
  ];

  // CO2/SAF Certificates data - Real Projects from Marketplace
  const co2Assets = [
    {
      id: '10250',
      name: 'Solar Power Project',
      location: 'Anantapur, India',
      category: 'Renewable Energy',
      totalPrice: '$5/ton',
      emissions: '35,243 tons available',
      project: 'CDM Certified',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0001252_solar-power-project-by-narasimha-swamy-solar-generations-pvt-ltd_550.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMTI1Ml9zb2xhci1wb3dlci1wcm9qZWN0LWJ5LW5hcmFzaW1oYS1zd2FteS1zb2xhci1nZW5lcmF0aW9ucy1wdnQtbHRkXzU1MC5qcGVnIiwiaWF0IjoxNzU3NDMxMzQwLCJleHAiOjE3ODg5NjczNDB9.dV682u8dFfcEZAJb1qz-AfzT2cndmPuuJrkVzxkTEhU',
      isCO2: true,
      projectId: '10250',
      ngoName: 'Narasimha Swamy Solar Generations Pvt. Ltd.',
      pricePerTon: 5.00,
      availableTons: 35243
    },
    {
      id: '6573',
      name: 'Caixa Econômica Federal Waste Management',
      location: 'Rio de Janeiro, Brazil',
      category: 'Methane Capture',
      totalPrice: '$6/ton',
      emissions: '28,572 tons available',
      project: 'CDM Certified',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0001175_caixa-economica-federal-solid-waste-management-and-carbon-finance-project.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMTE3NV9jYWl4YS1lY29ub21pY2EtZmVkZXJhbC1zb2xpZC13YXN0ZS1tYW5hZ2VtZW50LWFuZC1jYXJib24tZmluYW5jZS1wcm9qZWN0LmpwZWciLCJpYXQiOjE3NTc0MzEzOTAsImV4cCI6MTc4ODk2NzM5MH0.HQq1YtvjjuBk0KgjXZqZUkXX2uhQ8a1vG2VwZbsVP14',
      isCO2: true,
      projectId: '6573',
      ngoName: 'Caixa Econômica Federal',
      pricePerTon: 6.00,
      availableTons: 28572
    },
    {
      id: '9165',
      name: 'Taebaek Wind Park',
      location: 'Gangwon-do, South Korea',
      category: 'Renewable Energy',
      totalPrice: '$7/ton',
      emissions: '33,678 tons available',
      project: 'CDM Certified',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0000941_taebaek-wind-park-hasami-samcheok-cdm-project.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMDk0MV90YWViYWVrLXdpbmQtcGFyay1oYXNhbWktc2FtY2hlb2stY2RtLXByb2plY3QuanBlZyIsImlhdCI6MTc1NzQzMTQ1NywiZXhwIjo0OTc2Njk3Mzg1N30.WYt0J3KKw0WuArm7nykOr3ttR60T0bfEIj8A80mDuDs',
      isCO2: true,
      projectId: '9165',
      ngoName: 'Taebaek Wind Park Co., Ltd',
      pricePerTon: 7.00,
      availableTons: 33678
    },
    {
      id: '10080',
      name: 'Rondinha Hydroelectric Power Plant',
      location: 'Santa Catarina, Brazil',
      category: 'Renewable Energy',
      totalPrice: '$3.20/ton',
      emissions: '16,357 tons available',
      project: 'CDM Certified',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0001123_rondinha-small-hydroelectric-power-plant.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMTEyM19yb25kaW5oYS1zbWFsbC1oeWRyb2VsZWN0cmljLXBvd2VyLXBsYW50LmpwZWciLCJpYXQiOjE3NTc0MzE2MzcsImV4cCI6NDk3NjY5NzQwMzd9.BS2P9jVuwNCu40lqE0sA3UjqJ0CdMFwDXB7G59R4moM',
      isCO2: true,
      projectId: '10080',
      ngoName: 'Rondinha Energetica S.A.',
      pricePerTon: 3.20,
      availableTons: 16357
    },
    {
      id: '9078',
      name: 'Solar PV by Tata Power',
      location: 'Gujarat, India',
      category: 'Renewable Energy',
      totalPrice: '$2.50/ton',
      emissions: '150,009 tons available',
      project: 'CDM Certified',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0001123_rondinha-small-hydroelectric-power-plant.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMTEyM19yb25kaW5oYS1zbWFsbC1oeWRyb2VsZWN0cmljLXBvd2VyLXBsYW50LmpwZWciLCJpYXQiOjE3NTc0MzE2MzcsImV4cCI6NDk3NjY5NzQwMzd9.BS2P9jVuwNCu40lqE0sA3UjqJ0CdMFwDXB7G59R4moM',
      isCO2: true,
      projectId: '9078',
      ngoName: 'Tata Power (MMPL)',
      pricePerTon: 2.50,
      availableTons: 150009
    },
    {
      id: '7980',
      name: 'Burgos Wind Project',
      location: 'Ilocos Norte, Philippines',
      category: 'Renewable Energy',
      totalPrice: '$5.50/ton',
      emissions: '12,585 tons available',
      project: 'CDM Certified',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0000616_burgos-wind-project.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMDYxNl9idXJnb3Mtd2luZC1wcm9qZWN0LmpwZWciLCJpYXQiOjE3NTc0MzE3MzMsImV4cCI6MTc4ODk2NzczM30.UjJLrQ9tpy0cj6bayjdyBstsEkDx6_Mldj1njlm18eo',
      isCO2: true,
      projectId: '7980',
      ngoName: 'EDC Burgos Wind Power Corporation',
      pricePerTon: 5.50,
      availableTons: 12585
    }
  ];

  // Empty Legs data
  const emptyLegsAssets = [
    {
      id: 'empty-leg-zurich-london',
      name: 'Zurich → London',
      location: 'Europe',
      category: 'Light Jet',
      totalPrice: '€4,500',
      yield: '50% off',
      period: 'Mar 15, 2025'
    },
    {
      id: 'empty-leg-miami-newyork',
      name: 'Miami → New York',
      location: 'USA',
      category: 'Mid-Size',
      totalPrice: '€6,200',
      yield: '45% off',
      period: 'Mar 18, 2025'
    }
  ];

  // Adventures data
  const adventureAssets = [
    {
      id: 'safari-kenya',
      name: 'Luxury Safari Kenya',
      location: 'Nairobi, Kenya',
      category: 'Adventure',
      totalPrice: '€25,000',
      yield: '7 days',
      period: 'Year-round'
    },
    {
      id: 'arctic-expedition',
      name: 'Arctic Expedition',
      location: 'Norway',
      category: 'Adventure',
      totalPrice: '€45,000',
      yield: '10 days',
      period: 'Dec-Feb'
    }
  ];

  // Luxury Cars data
  const luxuryCarsAssets = [
    {
      id: 'rolls-royce-phantom',
      name: 'Rolls-Royce Phantom',
      location: 'London',
      category: 'Ultra Luxury',
      totalPrice: '€1,200/day',
      yield: 'Chauffeur',
      period: 'Available'
    },
    {
      id: 'ferrari-sf90',
      name: 'Ferrari SF90 Stradale',
      location: 'Monaco',
      category: 'Supercar',
      totalPrice: '€2,500/day',
      yield: 'Self-drive',
      period: 'Available'
    }
  ];

  // Ground Transportation data
  const groundTransportAssets = [
    {
      id: 'mercedes-s-class',
      name: 'Mercedes S-Class',
      location: 'Global',
      category: 'Executive',
      totalPrice: '€150/hr',
      yield: '3 pax',
      period: 'On-demand'
    },
    {
      id: 'sprinter-van',
      name: 'Mercedes Sprinter VIP',
      location: 'Europe',
      category: 'Group',
      totalPrice: '€200/hr',
      yield: '12 pax',
      period: 'On-demand'
    }
  ];

  // Tailored Services data
  const tailoredServicesAssets = [
    {
      id: 'concierge-platinum',
      name: 'Platinum Concierge',
      location: 'Worldwide',
      category: 'VIP Service',
      totalPrice: '€5,000/month',
      yield: '24/7 Support',
      period: 'Subscription'
    },
    {
      id: 'event-planning',
      name: 'Luxury Event Planning',
      location: 'Global',
      category: 'Events',
      totalPrice: 'Custom',
      yield: 'Bespoke',
      period: 'On-request'
    }
  ];

  // NFT Memberships data
  const nftMembershipsAssets = [
    {
      id: 'elite-nft-gold',
      name: 'Elite Gold NFT',
      location: 'Digital',
      category: 'Membership',
      totalPrice: '5 ETH',
      yield: '15% discount',
      period: 'Lifetime'
    },
    {
      id: 'elite-nft-platinum',
      name: 'Elite Platinum NFT',
      location: 'Digital',
      category: 'Membership',
      totalPrice: '10 ETH',
      yield: '25% discount',
      period: 'Lifetime'
    }
  ];

  // Fetch real empty legs data from Supabase
  useEffect(() => {
    if (activeCategory === 'empty-legs') {
      fetchEmptyLegs();
    }
  }, [activeCategory, emptyLegsFilter, emptyLegsLocation, emptyLegsDate, emptyLegsMaxPrice]);

  // Fetch real adventures/fixed offers data from Supabase
  useEffect(() => {
    if (activeCategory === 'adventures') {
      fetchAdventures();
    }
  }, [activeCategory, adventuresFilter, adventuresSearch, adventuresMaxPrice]);

  // Fetch real luxury cars data from Supabase
  useEffect(() => {
    const loadLuxuryCars = async () => {
      if (activeCategory !== 'luxury-cars') return;

      setIsLoadingLuxuryCars(true);
      try {
        let query = supabase
          .from('luxury_cars')
          .select('*')
          .order('created_at', { ascending: false });

        if (luxuryCarsFilter !== 'all') {
          query = query.eq('type', luxuryCarsFilter);
        }

        if (luxuryCarsBrand) {
          query = query.ilike('brand', `%${luxuryCarsBrand}%`);
        }

        if (luxuryCarsLocation) {
          query = query.ilike('location', `%${luxuryCarsLocation}%`);
        }

        if (luxuryCarsMaxPrice) {
          query = query.lte('price_per_day', parseFloat(luxuryCarsMaxPrice));
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ Error:', error);
          setLuxuryCarsData([]);
        } else {
          console.log('🔍 RAW DATA FROM DB:', data);
          if (data && data.length > 0) {
            console.log('🔍 FIRST CAR EXAMPLE:', data[0]);
            console.log('🔍 image_url field:', data[0].image_url);
          }

          const transformedData = (data || []).map(car => {
            console.log(`🚗 Car: ${car.brand} ${car.model}`);
            console.log(`🖼️ Image URL:`, car.image_url);

            return {
              id: car.id,
              name: `${car.brand} ${car.model}`,
              location: car.location,
              category: car.type || 'Luxury Car',
              totalPrice: `€${car.price_per_day?.toLocaleString()}/day`,
              yield: `€${car.price_per_hour?.toLocaleString()}/hr`,
              period: car.price_per_week ? `€${car.price_per_week?.toLocaleString()}/wk` : 'TO BE DISCUSSED',
              image: car.image_url || 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800',
              isLuxuryCar: true,
              rawPrice: car.price_per_day,
              isFreeWithNFT: false,
              rawData: car
            };
          });

          setLuxuryCarsData(transformedData);
        }
      } catch (error) {
        setLuxuryCarsData([]);
      } finally {
        setIsLoadingLuxuryCars(false);
      }
    };

    loadLuxuryCars();
  }, [activeCategory, luxuryCarsFilter, luxuryCarsBrand, luxuryCarsMaxPrice]);

  // Fetch jets from Supabase
  useEffect(() => {
    const loadJets = async () => {
      if (activeCategory !== 'jets') return;

      setIsLoadingJets(true);
      try {
        let query = supabase
          .from('jets')
          .select('*')
          .order('aircraft_model', { ascending: true });

        // Apply category filter
        if (jetsFilter !== 'all') {
          query = query.eq('aircraft_category', jetsFilter);
        }

        // Apply search filter
        if (jetsSearch) {
          query = query.or(`aircraft_model.ilike.%${jetsSearch}%,manufacturer.ilike.%${jetsSearch}%`);
        }

        const { data, error } = await query;

        if (error) {
          setJetsData([]);
        } else {
          const transformedData = (data || []).map(jet => {
            // Get all available images
            const images = [];
            if (jet.image_url) images.push(jet.image_url);
            if (jet.image_url_1) images.push(jet.image_url_1);
            if (jet.image_url_2) images.push(jet.image_url_2);
            if (jet.image_url_3) images.push(jet.image_url_3);
            if (jet.image_url_4) images.push(jet.image_url_4);
            if (jet.image_url_5) images.push(jet.image_url_5);

            return {
              id: jet.id,
              name: jet.aircraft_model || jet.title,
              location: jet.manufacturer,
              category: jet.aircraft_category,
              totalPrice: jet.price_range || 'Request Quote',
              capacity: `${jet.capacity} pax`,
              range: jet.range,
              image: images[0] || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800',
              images: images,
              isJet: true,
              rawData: jet
            };
          });

          setJetsData(transformedData);
        }
      } catch (error) {
        setJetsData([]);
      } finally {
        setIsLoadingJets(false);
      }
    };

    loadJets();
  }, [activeCategory, jetsFilter, jetsSearch, jetsMaxPrice]);

  // Fetch helicopters from Supabase
  useEffect(() => {
    const loadHelicopters = async () => {
      if (activeCategory !== 'helicopter') return;

      setIsLoadingHelicopters(true);
      try {
        let query = supabase
          .from('helicopter_charters')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply category filter
        if (helicoptersFilter !== 'all') {
          query = query.eq('category', helicoptersFilter);
        }

        // Apply search filter
        if (helicoptersSearch) {
          query = query.or(`name.ilike.%${helicoptersSearch}%,type.ilike.%${helicoptersSearch}%`);
        }

        // Apply location filter
        if (helicoptersLocation) {
          query = query.ilike('location', `%${helicoptersLocation}%`);
        }

        // Apply price filter
        if (helicoptersMaxPrice) {
          query = query.lte('price', parseFloat(helicoptersMaxPrice));
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ Error fetching helicopters:', error);
          console.log('Using static helicopter data as fallback');
          setHelicoptersData([]);
        } else {
          console.log('✅ Helicopters fetched from database:', data);
          if (data && data.length > 0) {
            console.log('🔍 FIRST HELICOPTER EXAMPLE:', data[0]);
            console.log('🔍 Available fields:', Object.keys(data[0]));
          }
          const transformedData = (data || []).map(heli => {
            // Get all available images - check all possible field names
            const images = [];
            if (heli.image_url) images.push(heli.image_url);
            if (heli.image_url_main) images.push(heli.image_url_main);
            if (heli.image_url_secondary) images.push(heli.image_url_secondary);
            if (heli.image_url_1) images.push(heli.image_url_1);
            if (heli.image_url_2) images.push(heli.image_url_2);
            if (heli.image_url_3) images.push(heli.image_url_3);
            if (heli.image_url_4) images.push(heli.image_url_4);
            if (heli.image_url_5) images.push(heli.image_url_5);

            console.log(`🖼️ Helicopter "${heli.name}" images found:`, images);

            return {
              id: heli.id,
              name: heli.name || 'Helicopter',
              location: heli.location || 'Global',
              category: heli.type ? heli.type.substring(0, 50) + '...' : 'Helicopter Charter',
              totalPrice: heli.price ? `€${parseFloat(heli.price).toLocaleString()}/hr` : 'Request Quote',
              capacity: `${heli.capacity || 'N/A'} pax`,
              availability: heli.status === 'available' ? 'On-demand' : 'Contact us',
              image: images[0] || 'https://images.unsplash.com/photo-1639089742630-ec968e4e8741?w=800',
              images: images,
              isHelicopter: true,
              range: heli.range ? `${heli.range} km` : 'N/A',
              speed: heli.speed ? `${heli.speed} km/h` : 'N/A',
              rawData: heli
            };
          });

          console.log('✅ Transformed helicopter data:', transformedData);
          setHelicoptersData(transformedData);
        }
      } catch (error) {
        console.error('❌ Exception loading helicopters:', error);
        console.log('Using static helicopter data as fallback');
        setHelicoptersData([]);
      } finally {
        setIsLoadingHelicopters(false);
      }
    };

    loadHelicopters();
  }, [activeCategory, helicoptersFilter, helicoptersSearch, helicoptersLocation, helicoptersMaxPrice]);


  const fetchEmptyLegs = async () => {
    setIsLoadingEmptyLegs(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      let query = supabase
        .from('EmptyLegs_')
        .select('*')
        .gte('departure_date', emptyLegsDate || today)
        .order('departure_date', { ascending: true });

      // Apply region filter
      if (emptyLegsFilter !== 'all') {
        if (emptyLegsFilter === 'europe') {
          query = query.or('from_continent.eq.Europe,to_continent.eq.Europe');
        } else if (emptyLegsFilter === 'usa') {
          query = query.or('from_continent.eq.North America,to_continent.eq.North America');
        } else if (emptyLegsFilter === 'asia') {
          query = query.or('from_continent.eq.Asia,to_continent.eq.Asia');
        } else if (emptyLegsFilter === 'africa') {
          query = query.or('from_continent.eq.Africa,to_continent.eq.Africa');
        }
      }

      // Apply location filter (search in from/to cities and IATA codes)
      if (emptyLegsLocation) {
        const locationSearch = emptyLegsLocation.toUpperCase();
        query = query.or(`from_city.ilike.%${emptyLegsLocation}%,to_city.ilike.%${emptyLegsLocation}%,from_iata.ilike.%${locationSearch}%,to_iata.ilike.%${locationSearch}%`);
      }

      // Apply price filter
      if (emptyLegsMaxPrice) {
        query = query.lte('price', parseFloat(emptyLegsMaxPrice));
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching empty legs:', error);
        setEmptyLegsData([]);
      } else {
        // Transform data to match card format
        const transformedData = (data || []).map(leg => ({
          id: leg.id,
          name: `${leg.from_city || leg.from} → ${leg.to_city || leg.to}`,
          location: `${leg.from_iata} → ${leg.to_iata}`,
          category: leg.category || leg.aircraft_type,
          totalPrice: `€${leg.price?.toLocaleString() || 'N/A'}`,
          capacity: `${leg.capacity || leg.pax || 'N/A'} pax`,
          departureDate: new Date(leg.departure_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          image: leg.image_url || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800',
          isEmptyLeg: true,
          isFreeWithNFT: leg.price && leg.price <= 1500, // Mark as free for NFT holders
          rawPrice: leg.price, // Keep raw price for calculations
          // Additional data for detail view
          rawData: leg
        }));
        setEmptyLegsData(transformedData);
      }
    } catch (error) {
      console.error('Error fetching empty legs:', error);
      setEmptyLegsData([]);
    } finally {
      setIsLoadingEmptyLegs(false);
    }
  };

  const fetchAdventures = async () => {
    setIsLoadingAdventures(true);
    try {
      let query = supabase
        .from('fixed_offers')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply region filter
      if (adventuresFilter !== 'all') {
        if (adventuresFilter === 'europe') {
          query = query.or('destination_continent.eq.Europe,origin_continent.eq.Europe');
        } else if (adventuresFilter === 'usa') {
          query = query.or('destination_continent.eq.North America,origin_continent.eq.North America');
        } else if (adventuresFilter === 'asia') {
          query = query.or('destination_continent.eq.Asia,origin_continent.eq.Asia');
        } else if (adventuresFilter === 'africa') {
          query = query.or('destination_continent.eq.Africa,origin_continent.eq.Africa');
        }
      }

      // Apply search filter
      if (adventuresSearch) {
        query = query.or(`title.ilike.%${adventuresSearch}%,destination.ilike.%${adventuresSearch}%,origin.ilike.%${adventuresSearch}%,package_type.ilike.%${adventuresSearch}%`);
      }

      // Apply price filter
      if (adventuresMaxPrice) {
        query = query.lte('price', parseFloat(adventuresMaxPrice));
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching adventures:', error);
        setAdventuresData([]);
      } else {
        // Transform data to match card format
        const transformedData = (data || []).map(offer => ({
          id: offer.id,
          name: offer.title,
          location: offer.destination || offer.origin,
          category: offer.package_type || 'Adventure',
          totalPrice: offer.price_on_request ? 'On Request' : `€${offer.price?.toLocaleString() || 'N/A'}`,
          yield: offer.duration || 'Flexible',
          period: offer.difficulty_level || 'All levels',
          image: offer.image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
          isAdventure: true,
          rawPrice: offer.price,
          isFreeWithNFT: offer.price && offer.price <= 1500,
          rawData: offer
        }));
        setAdventuresData(transformedData);
      }
    } catch (error) {
      console.error('Error fetching adventures:', error);
      setAdventuresData([]);
    } finally {
      setIsLoadingAdventures(false);
    }
  };


  // Get current category assets
  const getCategoryAssets = () => {
    switch (activeCategory) {
      case 'luxury-assets': return allAssets;
      case 'private-jet': return privateJetAssets;
      case 'jets': return jetsData;
      case 'helicopter':
        // Use database data if loaded and has items, otherwise use static data
        return (!isLoadingHelicopters && helicoptersData.length > 0) ? helicoptersData : helicopterAssets;
      case 'empty-legs': return emptyLegsData;
      case 'adventures': return adventuresData;
      case 'luxury-cars': return luxuryCarsData;
      case 'ground-transport': return groundTransportAssets;
      case 'tailored-services': return tailoredServicesAssets;
      case 'co2-saf': return co2Assets;
      case 'nft-memberships': return nftMembershipsAssets;
      default: return allAssets;
    }
  };

  const categoryAssets = getCategoryAssets();
  const totalPages = Math.ceil(categoryAssets.length / assetsPerPage);
  const startIndex = (currentPage - 1) * assetsPerPage;
  const currentAssets = categoryAssets.slice(startIndex, startIndex + assetsPerPage);

  const handleCardClick = (projectId) => {
    if (activeCategory === 'empty-legs') {
      navigate(`/empty-leg/${projectId}`);
    } else if (activeCategory === 'adventures') {
      navigate(`/adventure/${projectId}`);
    } else if (activeCategory === 'luxury-cars') {
      navigate(`/luxury-car/${projectId}`);
    } else if (activeCategory === 'jets') {
      navigate(`/jet/${projectId}`);
    } else if (activeCategory === 'helicopter') {
      navigate(`/helicopter/${projectId}`);
    } else if (activeCategory === 'co2-saf') {
      navigate(`/co2-certificate/${projectId}`);
    } else {
      navigate(`/project/${projectId}`);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate smart pagination with ellipsis
  const getPaginationRange = () => {
    const delta = 2; // Number of pages to show around current page
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // Always show first page
        i === totalPages || // Always show last page
        (i >= currentPage - delta && i <= currentPage + delta) // Show pages around current
      ) {
        range.push(i);
      }
    }

    let prev = 0;
    for (const i of range) {
      if (prev && i - prev > 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      prev = i;
    }

    return rangeWithDots;
  };

  // If not authenticated, only show the modals
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 font-['DM_Sans'] flex items-center justify-center">
        {/* Login Modal */}
        {showLoginModal && (
          <LoginModal
            onClose={() => {
              // Redirect to homepage only if user closes without logging in
              navigate('/');
            }}
            onSwitchToRegister={() => {
              console.log('Switching to register modal');
              setShowLoginModal(false);
              setShowRegisterModal(true);
            }}
            onSwitchToForgotPassword={() => {
              console.log('Switching to forgot password modal');
              setShowLoginModal(false);
              setShowForgotPasswordModal(true);
            }}
            onSuccess={() => {
              // Keep modal closed and stay on page after successful login
              setShowLoginModal(false);
              // The page will re-render with isAuthenticated = true
            }}
          />
        )}

        {/* Register Modal */}
        {showRegisterModal && (
          <RegisterModalNew
            onClose={() => {
              // Redirect to homepage only if user closes without registering
              navigate('/');
            }}
            onSwitchToLogin={() => {
              console.log('Switching to login modal');
              setShowRegisterModal(false);
              setShowLoginModal(true);
            }}
            onSuccess={() => {
              // Keep modal closed and stay on page after successful registration
              setShowRegisterModal(false);
              // The page will re-render with isAuthenticated = true
            }}
          />
        )}

        {/* Forgot Password Modal */}
        {showForgotPasswordModal && (
          <ForgotPasswordModal
            onClose={() => {
              navigate('/');
            }}
            onBackToLogin={() => {
              console.log('Back to login modal');
              setShowForgotPasswordModal(false);
              setShowLoginModal(true);
            }}
          />
        )}
      </div>
    );
  }

  // Search suggestions based on available services
  const searchSuggestions = [
    { label: 'Private Jets', category: 'jets', keywords: ['jet', 'private', 'flight', 'aircraft'] },
    { label: 'Empty Legs', category: 'empty-legs', keywords: ['empty', 'leg', 'discount', 'deal'] },
    { label: 'Helicopters', category: 'helicopters', keywords: ['helicopter', 'heli', 'rotorcraft'] },
    { label: 'Luxury Cars', category: 'cars', keywords: ['car', 'luxury', 'vehicle', 'chauffeur'] },
    { label: 'Adventures', category: 'adventures', keywords: ['adventure', 'experience', 'fixed offer', 'package'] },
    { label: 'CO2 Certificates', category: 'co2', keywords: ['co2', 'carbon', 'offset', 'certificate', 'environment'] },
    { label: 'Wallet & NFTs', category: 'wallet', keywords: ['wallet', 'nft', 'token', 'crypto', 'blockchain'] }
  ];

  // Filter suggestions based on search query
  const filteredSuggestions = searchQuery.trim()
    ? searchSuggestions.filter(suggestion =>
        suggestion.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        suggestion.keywords.some(keyword => keyword.includes(searchQuery.toLowerCase()))
      )
    : searchSuggestions;

  // Handle search suggestion click
  const handleSuggestionClick = (category) => {
    setActiveCategory(category);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['DM_Sans']">
      {/* Header - Exact same style as SaasDashboard */}
      <header className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
                alt="PrivateCharterX"
                className="h-8 w-auto"
              />
            </div>

            <div className="flex items-center space-x-3">
              {/* Search Bar with Dropdown */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                  className="w-64 pl-10 pr-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 outline-none text-sm font-light placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all duration-200"
                />

                {/* Search Dropdown */}
                {showSearchDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-500 px-3 py-2">Suggestions</p>
                      {filteredSuggestions.length > 0 ? (
                        filteredSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.category}
                            onClick={() => handleSuggestionClick(suggestion.category)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-2"
                          >
                            <Search size={14} className="text-gray-400" />
                            {suggestion.label}
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-sm text-gray-500">No results found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Favorites Icon */}
              <button className="relative w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 border border-gray-200">
                <Heart size={16} />
                {favorites.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-white font-medium">{favorites.length}</span>
                  </div>
                )}
              </button>

              {/* Notifications Icon */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 border border-gray-200"
              >
                <Bell size={16} />
                {notifications.filter(n => n.unread).length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-white font-medium">{notifications.filter(n => n.unread).length}</span>
                  </div>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute top-16 right-24 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                          notif.unread ? 'bg-blue-50' : ''
                        }`}
                      >
                        <p className="text-xs text-gray-900">{notif.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verified Badge */}
              <button
                className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 border border-gray-200"
                title="Verified"
              >
                <Shield size={16} />
              </button>

              {/* User Menu with Dropdown and Dashboard Access */}
              <div className="relative">
                <UserMenu onLogout={handleLogout} onShowDashboard={handleShowDashboard} />
                {/* Green indicator when authenticated - positioned over the UserMenu */}
                {isAuthenticated && (
                  <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white pointer-events-none z-10"></div>
                )}
              </div>

              {/* Wallet Menu with Dropdown and Connection Status Lamp */}
              <div className="relative">
                <WalletMenu onConnect={handleWalletConnect} iconOnly={true} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container - Same style as SaasDashboard */}
      <div className="max-w-7xl mx-auto px-5 pb-6">
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
          <div className="p-6">
            {/* Navigation */}
            <nav className="border-b border-gray-200 mb-6">
              <div className="flex space-x-6 overflow-x-auto">
                <button
                  onClick={() => { setActiveCategory('services'); setCurrentPage(1); }}
                  className={`py-4 text-sm whitespace-nowrap border-b-2 transition-colors ${activeCategory === 'services' ? 'text-black border-black' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
                >
                  ● Services
                </button>
                <button
                  onClick={() => { setActiveCategory('luxury-assets'); setCurrentPage(1); }}
                  className={`py-4 text-sm whitespace-nowrap border-b-2 transition-colors ${activeCategory === 'luxury-assets' ? 'text-black border-black' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
                >
                  ◈ Luxury Assets
                </button>
                <button
                  onClick={() => { setActiveCategory('private-jet'); setCurrentPage(1); }}
                  className={`py-4 text-sm whitespace-nowrap border-b-2 transition-colors ${activeCategory === 'private-jet' ? 'text-black border-black' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
                >
                  ✈︎ Charter Now
                </button>
                <button
                  onClick={() => { setActiveCategory('jets'); setCurrentPage(1); }}
                  className={`py-4 text-sm whitespace-nowrap border-b-2 transition-colors ${activeCategory === 'jets' ? 'text-black border-black' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
                >
                  ✈ Jets
                </button>
                <button
                  onClick={() => { setActiveCategory('helicopter'); setCurrentPage(1); }}
                  className={`py-4 text-sm whitespace-nowrap border-b-2 transition-colors ${activeCategory === 'helicopter' ? 'text-black border-black' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
                >
                  ◐ Helis
                </button>
                <button
                  onClick={() => { setActiveCategory('empty-legs'); setCurrentPage(1); }}
                  className={`py-4 text-sm whitespace-nowrap border-b-2 transition-colors ${activeCategory === 'empty-legs' ? 'text-black border-black' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
                >
                  ◇ Empty Legs
                </button>
                <button
                  onClick={() => { setActiveCategory('adventures'); setCurrentPage(1); }}
                  className={`py-4 text-sm whitespace-nowrap border-b-2 transition-colors ${activeCategory === 'adventures' ? 'text-black border-black' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
                >
                  ▲ Adventures
                </button>
                <button
                  onClick={() => { setActiveCategory('luxury-cars'); setCurrentPage(1); }}
                  className={`py-4 text-sm whitespace-nowrap border-b-2 transition-colors ${activeCategory === 'luxury-cars' ? 'text-black border-black' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
                >
                  ◆ Luxury Cars
                </button>
                <button
                  onClick={() => { setActiveCategory('ground-transport'); setCurrentPage(1); }}
                  className={`py-4 text-sm whitespace-nowrap border-b-2 transition-colors ${activeCategory === 'ground-transport' ? 'text-black border-black' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
                >
                  ◯ Taxi/Concierge
                </button>
                <button
                  onClick={() => { setActiveCategory('tailored-services'); setCurrentPage(1); }}
                  className={`py-4 text-sm whitespace-nowrap border-b-2 transition-colors ${activeCategory === 'tailored-services' ? 'text-black border-black' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
                >
                  ◉ Tailored Services
                </button>
                <button
                  onClick={() => { setActiveCategory('co2-saf'); setCurrentPage(1); }}
                  className={`py-4 text-sm whitespace-nowrap border-b-2 transition-colors ${activeCategory === 'co2-saf' ? 'text-black border-black' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
                >
                  CO2/SAF
                </button>
                <button
                  onClick={() => { setActiveCategory('nft-memberships'); setCurrentPage(1); }}
                  className={`py-4 text-sm whitespace-nowrap border-b-2 transition-colors ${activeCategory === 'nft-memberships' ? 'text-black border-black' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
                >
                  ◊ NFTs
                </button>
              </div>
            </nav>

            {/* Dashboard Overview - Glassmorphic Design from tokenized-assets-glassmorphic */}
            {activeCategory === 'services' && (
              <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <button onClick={() => setActiveCategory('private-jet')} className="px-3 py-1.5 bg-white/20 hover:bg-white/25 border border-gray-600/40 rounded-full text-xs text-gray-700 transition-all flex items-center gap-1.5" style={{ backdropFilter: 'blur(15px) saturate(180%)' }}>
                    <span className="text-sm">✈︎</span>
                    Charter Now
                  </button>
                  <button onClick={() => setActiveCategory('empty-legs')} className="px-3 py-1.5 bg-white/20 hover:bg-white/25 border border-gray-600/40 rounded-full text-xs text-gray-700 transition-all flex items-center gap-1.5" style={{ backdropFilter: 'blur(15px) saturate(180%)' }}>
                    <span className="text-sm">◇</span>
                    Empty Legs
                  </button>
                  <button onClick={() => setActiveCategory('adventures')} className="px-3 py-1.5 bg-white/20 hover:bg-white/25 border border-gray-600/40 rounded-full text-xs text-gray-700 transition-all flex items-center gap-1.5" style={{ backdropFilter: 'blur(15px) saturate(180%)' }}>
                    <span className="text-sm">▲</span>
                    Adventures
                  </button>
                  <button onClick={() => setActiveCategory('luxury-cars')} className="px-3 py-1.5 bg-white/20 hover:bg-white/25 border border-gray-600/40 rounded-full text-xs text-gray-700 transition-all flex items-center gap-1.5" style={{ backdropFilter: 'blur(15px) saturate(180%)' }}>
                    <span className="text-sm">◆</span>
                    Luxury Cars
                  </button>
                  <button onClick={() => setActiveCategory('ground-transport')} className="px-3 py-1.5 bg-white/20 hover:bg-white/25 border border-gray-600/40 rounded-full text-xs text-gray-700 transition-all flex items-center gap-1.5" style={{ backdropFilter: 'blur(15px) saturate(180%)' }}>
                    <span className="text-sm">◯</span>
                    Concierge
                  </button>
                  <button onClick={() => setActiveCategory('tailored-services')} className="px-3 py-1.5 bg-white/20 hover:bg-white/25 border border-gray-600/40 rounded-full text-xs text-gray-700 transition-all flex items-center gap-1.5" style={{ backdropFilter: 'blur(15px) saturate(180%)' }}>
                    <span className="text-sm">◉</span>
                    Tailored Services
                  </button>
                  <button onClick={() => setActiveCategory('luxury-assets')} className="px-3 py-1.5 bg-white/20 hover:bg-white/25 border border-gray-600/40 rounded-full text-xs text-gray-700 transition-all flex items-center gap-1.5" style={{ backdropFilter: 'blur(15px) saturate(180%)' }}>
                    <span className="text-sm">◈</span>
                    Luxury Assets
                  </button>
                  <button onClick={() => setActiveCategory('co2-saf')} className="px-3 py-1.5 bg-white/20 hover:bg-white/25 border border-gray-600/40 rounded-full text-xs text-gray-700 transition-all flex items-center gap-1.5" style={{ backdropFilter: 'blur(15px) saturate(180%)' }}>
                    <span className="text-sm">🌱</span>
                    CO2/SAF
                  </button>
                  <button onClick={() => setActiveCategory('nft-memberships')} className="px-3 py-1.5 bg-white/20 hover:bg-white/25 border border-gray-600/40 rounded-full text-xs text-gray-700 transition-all flex items-center gap-1.5" style={{ backdropFilter: 'blur(15px) saturate(180%)' }}>
                    <span className="text-sm">◊</span>
                    NFT Memberships
                  </button>
                </div>

                {/* Your recent chats */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs">›</span>
                    <h3 className="text-xs font-medium text-gray-600">Your recent chats</h3>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <button className="bg-white/20 hover:bg-white/25 border border-gray-600/40 rounded-xl p-3 text-left transition-all group" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-sm text-gray-600 mt-0.5">✈</span>
                      </div>
                      <h4 className="text-xs font-medium text-gray-800 mb-0.5">Poem of the past</h4>
                      <p className="text-[10px] text-gray-600">23 hours</p>
                    </button>

                    <button className="bg-white/20 hover:bg-white/25 border border-gray-600/40 rounded-xl p-3 text-left transition-all group" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-sm text-gray-600 mt-0.5">✈</span>
                      </div>
                      <h4 className="text-xs font-medium text-gray-800 mb-0.5">Assistance request</h4>
                      <p className="text-[10px] text-gray-600">2 days ago</p>
                    </button>

                    <button className="bg-white/20 hover:bg-white/25 border border-gray-600/40 rounded-xl p-3 text-left transition-all group" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-sm text-gray-600 mt-0.5">✨</span>
                      </div>
                      <h4 className="text-xs font-medium text-gray-800 mb-0.5">Analytica ideas</h4>
                      <p className="text-[10px] text-gray-600">3 weeks ago</p>
                    </button>
                  </div>

                  {/* Weather & News Cards */}
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    {/* Weather Card */}
                    <div className="bg-white/20 border border-gray-600/40 rounded-xl p-4" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-gray-700">
                          <p className="text-xs text-gray-600 mb-0.5">{locationData.city}</p>
                          <p className="text-2xl font-semibold text-gray-800">{weatherData.temperature}°C</p>
                        </div>
                        <div className="text-3xl">🌤️</div>
                      </div>
                      <p className="text-[10px] text-gray-600">{weatherData.condition} H:{weatherData.high}° L:{weatherData.low}°</p>
                    </div>

                    {/* News Card */}
                    <div className="bg-white/20 hover:bg-white/25 border border-gray-600/40 rounded-xl p-4 transition-all cursor-pointer" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                      <div className="flex items-start gap-2 mb-2">
                        <div className="w-6 h-6 bg-white/25 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xs">✨</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-gray-800 mb-1 line-clamp-2">Latest from PrivateCharterX Blog</h4>
                          <p className="text-[10px] text-gray-600 line-clamp-2">Discover new sustainable aviation fuels and CO2 offset programs...</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Service Cards Grid - Hidden, keeping for reference */}
            {activeCategory === 'services_old' && (
              <div className="max-w-3xl mx-auto px-8 py-20">
                {/* Greeting Section */}
                <div className="mb-12">
                  <h1 className="text-3xl font-normal text-gray-900 mb-3">
                    Good evening, {user?.first_name || user?.name || 'Iqbal'}
                  </h1>
                  <p className="text-lg text-gray-500 font-light">How can I help you?</p>
                </div>

                {/* Service Cards Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveCategory('luxury-assets')}
                    className="flex items-center gap-4 bg-white hover:bg-gray-50 rounded-2xl p-5 border border-gray-200 transition-colors duration-150 text-left"
                  >
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xl font-light">◈</div>
                    <div className="min-w-0">
                      <h3 className="text-base font-medium text-gray-900">Luxury Assets</h3>
                      <p className="text-sm text-gray-500 truncate">Tokenized luxury assets</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveCategory('private-jet')}
                    className="flex items-center gap-4 bg-white hover:bg-gray-50 rounded-2xl p-5 border border-gray-200 transition-colors duration-150 text-left"
                  >
                    <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xl font-light">✈︎</div>
                    <div className="min-w-0">
                      <h3 className="text-base font-medium text-gray-900">Charter Now</h3>
                      <p className="text-sm text-gray-500 truncate">Book private jets</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveCategory('jets')}
                    className="flex items-center gap-4 bg-white hover:bg-gray-50 rounded-2xl p-5 border border-gray-200 transition-colors duration-150 text-left"
                  >
                    <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xl font-light">✈</div>
                    <div className="min-w-0">
                      <h3 className="text-base font-medium text-gray-900">Jets</h3>
                      <p className="text-sm text-gray-500 truncate">Browse private jets</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveCategory('helicopter')}
                    className="flex items-center gap-4 bg-white hover:bg-gray-50 rounded-2xl p-5 border border-gray-200 transition-colors duration-150 text-left"
                  >
                    <div className="w-11 h-11 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xl font-light">◐</div>
                    <div className="min-w-0">
                      <h3 className="text-base font-medium text-gray-900">Helicopters</h3>
                      <p className="text-sm text-gray-500 truncate">Helicopter charters</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveCategory('empty-legs')}
                    className="flex items-center gap-4 bg-white hover:bg-gray-50 rounded-2xl p-5 border border-gray-200 transition-colors duration-150 text-left"
                  >
                    <div className="w-11 h-11 bg-gradient-to-br from-rose-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xl font-light">◇</div>
                    <div className="min-w-0">
                      <h3 className="text-base font-medium text-gray-900">Empty Legs</h3>
                      <p className="text-sm text-gray-500 truncate">Discounted flights</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveCategory('adventures')}
                    className="flex items-center gap-4 bg-white hover:bg-gray-50 rounded-2xl p-5 border border-gray-200 transition-colors duration-150 text-left"
                  >
                    <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xl font-light">▲</div>
                    <div className="min-w-0">
                      <h3 className="text-base font-medium text-gray-900">Adventures</h3>
                      <p className="text-sm text-gray-500 truncate">Travel packages</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveCategory('luxury-cars')}
                    className="flex items-center gap-4 bg-white hover:bg-gray-50 rounded-2xl p-5 border border-gray-200 transition-colors duration-150 text-left"
                  >
                    <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xl font-light">◆</div>
                    <div className="min-w-0">
                      <h3 className="text-base font-medium text-gray-900">Luxury Cars</h3>
                      <p className="text-sm text-gray-500 truncate">Premium rentals</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveCategory('ground-transport')}
                    className="flex items-center gap-4 bg-white hover:bg-gray-50 rounded-2xl p-5 border border-gray-200 transition-colors duration-150 text-left"
                  >
                    <div className="w-11 h-11 bg-gradient-to-br from-yellow-500 to-lime-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xl font-light">◯</div>
                    <div className="min-w-0">
                      <h3 className="text-base font-medium text-gray-900">Taxi/Concierge</h3>
                      <p className="text-sm text-gray-500 truncate">Ground transport</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveCategory('tailored-services')}
                    className="flex items-center gap-4 bg-white hover:bg-gray-50 rounded-2xl p-5 border border-gray-200 transition-colors duration-150 text-left"
                  >
                    <div className="w-11 h-11 bg-gradient-to-br from-lime-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xl font-light">◉</div>
                    <div className="min-w-0">
                      <h3 className="text-base font-medium text-gray-900">Tailored Services</h3>
                      <p className="text-sm text-gray-500 truncate">VIP services</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveCategory('co2-saf')}
                    className="flex items-center gap-4 bg-white hover:bg-gray-50 rounded-2xl p-5 border border-gray-200 transition-colors duration-150 text-left"
                  >
                    <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-medium">CO₂</div>
                    <div className="min-w-0">
                      <h3 className="text-base font-medium text-gray-900">CO2/SAF</h3>
                      <p className="text-sm text-gray-500 truncate">Carbon offsets</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveCategory('nft-memberships')}
                    className="flex items-center gap-4 bg-white hover:bg-gray-50 rounded-2xl p-5 border border-gray-200 transition-colors duration-150 text-left"
                  >
                    <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xl font-light">◊</div>
                    <div className="min-w-0">
                      <h3 className="text-base font-medium text-gray-900">NFT Memberships</h3>
                      <p className="text-sm text-gray-500 truncate">Exclusive benefits</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Empty Legs Filters */}
            {/* Charter Now - UnifiedBookingFlow */}
            {activeCategory === 'private-jet' && (
              <div className="min-h-[600px] flex items-center justify-center py-12">
                <div className="w-full max-w-6xl">
                  <UnifiedBookingFlow />
                </div>
              </div>
            )}

            {activeCategory === 'empty-legs' && (
              <div className="mb-8">
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Region</label>
                    <select
                      value={emptyLegsFilter}
                      onChange={(e) => setEmptyLegsFilter(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    >
                      <option value="all">All Regions</option>
                      <option value="europe">Europe</option>
                      <option value="usa">North America</option>
                      <option value="asia">Asia</option>
                      <option value="africa">Africa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Location (City/IATA)</label>
                    <input
                      type="text"
                      placeholder="e.g. London, LHR"
                      value={emptyLegsLocation}
                      onChange={(e) => setEmptyLegsLocation(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">From Date</label>
                    <input
                      type="date"
                      value={emptyLegsDate}
                      onChange={(e) => setEmptyLegsDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Max Price (€)</label>
                    <input
                      type="number"
                      placeholder="e.g. 10000"
                      value={emptyLegsMaxPrice}
                      onChange={(e) => setEmptyLegsMaxPrice(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setEmptyLegsLocation('');
                        setEmptyLegsDate('');
                        setEmptyLegsMaxPrice('');
                        setEmptyLegsFilter('all');
                      }}
                      className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition-all"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Adventures Filters */}
            {activeCategory === 'adventures' && (
              <div className="mb-8">
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Region</label>
                    <select
                      value={adventuresFilter}
                      onChange={(e) => setAdventuresFilter(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    >
                      <option value="all">All Regions</option>
                      <option value="europe">Europe</option>
                      <option value="usa">North America</option>
                      <option value="asia">Asia</option>
                      <option value="africa">Africa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Package Type</label>
                    <input
                      type="text"
                      placeholder="e.g. Safari, Yacht"
                      value={adventuresSearch}
                      onChange={(e) => setAdventuresSearch(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Destination</label>
                    <input
                      type="text"
                      placeholder="e.g. Dubai, Paris"
                      value={adventuresSearch}
                      onChange={(e) => setAdventuresSearch(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Max Price (€)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50000"
                      value={adventuresMaxPrice}
                      onChange={(e) => setAdventuresMaxPrice(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setAdventuresSearch('');
                        setAdventuresMaxPrice('');
                        setAdventuresFilter('all');
                      }}
                      className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition-all"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Luxury Cars Filters */}
            {activeCategory === 'luxury-cars' && (
              <div className="mb-8">
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Car Type</label>
                    <select
                      value={luxuryCarsFilter}
                      onChange={(e) => setLuxuryCarsFilter(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    >
                      <option value="all">All Types</option>
                      <option value="Supercar">Supercar</option>
                      <option value="SUV">SUV</option>
                      <option value="Convertible">Convertible</option>
                      <option value="Luxury Coupe">Luxury Coupe</option>
                      <option value="supercar">supercar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Brand</label>
                    <input
                      type="text"
                      placeholder="e.g. Mercedes, BMW"
                      value={luxuryCarsBrand}
                      onChange={(e) => setLuxuryCarsBrand(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Monaco, Dubai"
                      value={luxuryCarsLocation}
                      onChange={(e) => setLuxuryCarsLocation(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Max Price/Day (€)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1000"
                      value={luxuryCarsMaxPrice}
                      onChange={(e) => setLuxuryCarsMaxPrice(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setLuxuryCarsBrand('');
                        setLuxuryCarsLocation('');
                        setLuxuryCarsMaxPrice('');
                        setLuxuryCarsFilter('all');
                      }}
                      className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition-all"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Jets Filters */}
            {activeCategory === 'jets' && (
              <div className="mb-8">
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Aircraft Category</label>
                    <select
                      value={jetsFilter}
                      onChange={(e) => setJetsFilter(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    >
                      <option value="all">All Categories</option>
                      <option value="Light Jet">Light Jet</option>
                      <option value="Midsize Jet">Midsize Jet</option>
                      <option value="Heavy Jet">Heavy Jet</option>
                      <option value="Ultra Long Range">Ultra Long Range</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Manufacturer</label>
                    <input
                      type="text"
                      placeholder="e.g. Gulfstream, Bombardier"
                      value={jetsSearch}
                      onChange={(e) => setJetsSearch(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Model</label>
                    <input
                      type="text"
                      placeholder="e.g. G650, Global 7500"
                      value={jetsSearch}
                      onChange={(e) => setJetsSearch(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Max Price</label>
                    <input
                      type="text"
                      placeholder="e.g. €50,000/hr"
                      value={jetsMaxPrice}
                      onChange={(e) => setJetsMaxPrice(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setJetsSearch('');
                        setJetsMaxPrice('');
                        setJetsFilter('all');
                      }}
                      className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition-all"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Helicopters Filters */}
            {activeCategory === 'helicopter' && (
              <div className="mb-8">
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Category</label>
                    <select
                      value={helicoptersFilter}
                      onChange={(e) => setHelicoptersFilter(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    >
                      <option value="all">All Categories</option>
                      <option value="Twin Engine">Twin Engine</option>
                      <option value="Luxury">Luxury</option>
                      <option value="Light">Light</option>
                      <option value="Medium">Medium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Model/Manufacturer</label>
                    <input
                      type="text"
                      placeholder="e.g. Airbus H135, AW109"
                      value={helicoptersSearch}
                      onChange={(e) => setHelicoptersSearch(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Monaco, Switzerland"
                      value={helicoptersLocation}
                      onChange={(e) => setHelicoptersLocation(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Max Price/Hour (€)</label>
                    <input
                      type="number"
                      placeholder="e.g. 8000"
                      value={helicoptersMaxPrice}
                      onChange={(e) => setHelicoptersMaxPrice(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setHelicoptersSearch('');
                        setHelicoptersLocation('');
                        setHelicoptersMaxPrice('');
                        setHelicoptersFilter('all');
                      }}
                      className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition-all"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Filters for other categories */}
            {activeCategory !== 'empty-legs' && activeCategory !== 'adventures' && activeCategory !== 'luxury-cars' && activeCategory !== 'jets' && activeCategory !== 'helicopter' && activeCategory !== 'dashboard' && activeCategory !== 'private-jet' && (
              <div className="mb-8">
                <div className="grid grid-cols-4 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Location</label>
                    <select className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200">
                      <option>All locations</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Asset type</label>
                    <select className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200">
                      <option>All assets</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Yield</label>
                    <div className="flex items-center space-x-3 px-3 py-2.5 border border-gray-300 rounded-xl bg-white">
                      <span className="text-sm text-black min-w-max">0 %</span>
                      <div className="flex-1 h-1 bg-gray-300 rounded relative">
                        <div className="absolute left-0 top-0 w-1/3 h-full bg-black rounded"></div>
                      </div>
                      <span className="text-sm text-black min-w-max">30 %</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-2">Token price</label>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-2">
                        <button className="px-4 py-2.5 border border-black bg-gray-100 rounded-xl text-sm transition-all duration-200 hover:bg-gray-200">0 USDT</button>
                        <button className="px-4 py-2.5 border border-gray-300 bg-white rounded-xl text-sm transition-all duration-200 hover:bg-gray-50">5000 USDT</button>
                      </div>
                      <div className="flex space-x-1 ml-3">
                        <button className="w-8 h-8 border border-black bg-gray-100 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-gray-200">▦</button>
                        <button className="w-8 h-8 border border-gray-300 bg-white rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-gray-50">☰</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State for Empty Legs */}
            {activeCategory === 'empty-legs' && isLoadingEmptyLegs && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading available empty legs...</p>
                </div>
              </div>
            )}

            {/* Loading State for Adventures */}
            {activeCategory === 'adventures' && isLoadingAdventures && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading adventure packages...</p>
                </div>
              </div>
            )}

            {/* Loading State for Luxury Cars */}
            {activeCategory === 'luxury-cars' && isLoadingLuxuryCars && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading luxury cars...</p>
                </div>
              </div>
            )}

            {/* Loading State for Jets */}
            {activeCategory === 'jets' && isLoadingJets && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading jets...</p>
                </div>
              </div>
            )}

            {/* Loading State for Helicopters */}
            {activeCategory === 'helicopter' && isLoadingHelicopters && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading helicopters...</p>
                </div>
              </div>
            )}

            {/* Properties Grid */}
            {activeCategory !== 'private-jet' &&
             !(activeCategory === 'empty-legs' && isLoadingEmptyLegs) &&
             !(activeCategory === 'adventures' && isLoadingAdventures) &&
             !(activeCategory === 'luxury-cars' && isLoadingLuxuryCars) &&
             !(activeCategory === 'jets' && isLoadingJets) &&
             !(activeCategory === 'helicopter' && isLoadingHelicopters) && (
            <div className="grid grid-cols-2 gap-5">
          {currentAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => handleCardClick(asset.id)}
              className={`bg-white rounded-lg flex h-64 hover:shadow-lg transition-all cursor-pointer ${
                asset.isFreeWithNFT
                  ? 'border-2 border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.5)]'
                  : 'border border-gray-300'
              }`}
            >
              <div className="w-2/5 bg-gray-100 relative flex-shrink-0">
                {asset.image && (
                  <img
                    src={asset.image}
                    alt={asset.name}
                    className="w-full h-64 object-cover"
                  />
                )}
                <div className="absolute top-3 left-3 flex flex-col space-y-1.5">
                  <div className="flex space-x-1.5">
                    <div className="bg-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                      <span>{asset.location}</span>
                    </div>
                    <div className="bg-white px-2 py-1 rounded text-xs font-medium">⌂ {asset.category}</div>
                  </div>
                  {asset.isFreeWithNFT && (
                    <div className="bg-green-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow-lg animate-pulse">
                      FREE with NFT
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX</span>
                  <div className="flex space-x-2">
                    <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">⎘</button>
                    <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">◉</button>
                  </div>
                </div>
                <h3 className="text-base font-semibold mb-4 line-clamp-2 overflow-hidden">{asset.name}</h3>
                <div className="flex space-x-6 border-b border-gray-300 mb-5">
                  <button className="pb-3 text-xs relative text-black">
                    Properties
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
                  </button>
                  <button className="pb-3 text-xs text-gray-600">Description</button>
                </div>

                {/* Conditional rendering based on asset type */}
                {asset.isEmptyLeg ? (
                  // Empty Leg specific fields
                  <div className="flex justify-between mt-auto mb-5">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Price</span>
                      <span className="text-sm font-semibold text-black">{asset.totalPrice}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Capacity</span>
                      <span className="text-sm font-semibold text-black">{asset.capacity}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Departure</span>
                      <span className="text-sm font-semibold text-black">{asset.departureDate}</span>
                    </div>
                  </div>
                ) : asset.isAdventure ? (
                  // Adventure specific fields
                  <div className="flex justify-between mt-auto mb-5">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Price</span>
                      <span className="text-sm font-semibold text-black">{asset.totalPrice}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Duration</span>
                      <span className="text-sm font-semibold text-black">{asset.yield}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Difficulty</span>
                      <span className="text-sm font-semibold text-black">{asset.period}</span>
                    </div>
                  </div>
                ) : asset.isLuxuryCar ? (
                  // Luxury Car specific fields
                  <div className="flex justify-between mt-auto mb-5">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Per Day</span>
                      <span className="text-sm font-semibold text-black">{asset.totalPrice}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Per Hour</span>
                      <span className="text-sm font-semibold text-black">{asset.yield}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Per Week</span>
                      <span className="text-sm font-semibold text-black">{asset.period}</span>
                    </div>
                  </div>
                ) : asset.isJet ? (
                  // Jet specific fields
                  <div className="flex justify-between mt-auto mb-5">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Price Range</span>
                      <span className="text-sm font-semibold text-black">{asset.totalPrice}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Capacity</span>
                      <span className="text-sm font-semibold text-black">{asset.capacity}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Range</span>
                      <span className="text-sm font-semibold text-black">{asset.range}</span>
                    </div>
                  </div>
                ) : asset.isHelicopter ? (
                  // Helicopter specific fields
                  <div className="flex justify-between mt-auto mb-5">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Hourly Rate</span>
                      <span className="text-sm font-semibold text-black">{asset.totalPrice}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Capacity</span>
                      <span className="text-sm font-semibold text-black">{asset.capacity}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Availability</span>
                      <span className="text-sm font-semibold text-black">{asset.availability}</span>
                    </div>
                  </div>
                ) : asset.isCO2 ? (
                  // CO2/SAF Certificate specific fields
                  <div className="flex justify-between mt-auto mb-5">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Price</span>
                      <span className="text-sm font-semibold text-black">{asset.totalPrice}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Emissions</span>
                      <span className="text-sm font-semibold text-black">{asset.emissions}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Project</span>
                      <span className="text-sm font-semibold text-black">{asset.project}</span>
                    </div>
                  </div>
                ) : (
                  // Regular asset fields
                  <div className="flex justify-between mt-auto mb-5">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Total token price</span>
                      <span className="text-sm font-semibold text-black">{asset.totalPrice}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">{asset.yield ? 'Gross yield avg.' : 'Benefits'}</span>
                      <span className="text-sm font-semibold text-black">{asset.yield || asset.vacationDays}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Period</span>
                      <span className="text-sm font-semibold text-black">{asset.period}</span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4 pt-4 border-t border-gray-100 text-xs">
                  {asset.isEmptyLeg || asset.isAdventure || asset.isLuxuryCar || asset.isJet || asset.isHelicopter || asset.isCO2 ? (
                    <>
                      <a href="#" className="text-gray-600 hover:text-black">See details ↗</a>
                      <a href="#" className="text-gray-600 hover:text-black">
                        {asset.isEmptyLeg ? 'Operator info' : asset.isAdventure ? 'Package info' : asset.isLuxuryCar ? 'Car details' : asset.isHelicopter ? 'Aircraft specs' : asset.isCO2 ? 'Certificate info' : 'Aircraft specs'} ⚖
                      </a>
                    </>
                  ) : (
                    <>
                      <a href="#" className="text-gray-600 hover:text-black">View on polygonscan ↗</a>
                      <a href="#" className="text-gray-600 hover:text-black">Legal statement ⚖</a>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    ←
                  </button>

                  {/* Page Numbers with Ellipsis */}
                  {getPaginationRange().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                          currentPage === page
                            ? 'bg-black text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
                  src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
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
                  onClick={() => navigate('/tokenized-assets')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Tokenized Assets
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
};

export default TokenizedAssets;