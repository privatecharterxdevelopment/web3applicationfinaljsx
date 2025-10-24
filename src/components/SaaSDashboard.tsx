import React, { useState, useEffect, useRef } from 'react';
import { bookingService } from '../services/bookingService';
import { BookingRequest } from '../types/booking';
import EmptyLegModal from './modals/EmptyLegModal';
import FixedOfferModal from './modals/FixedOfferModal';
import LuxuryCarModal from './modals/LuxuryCarModal';
import { airportsStaticService } from '../services/airportsStaticService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useAccount, useConnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import WalletConnect from './WalletConnect';
import { web3Service } from '../lib/web3.ts';
import { fetchEmptyLegs } from '../services/emptyLegsService';
import type { BookingFormData } from '../types/booking';
import type { AirportSearchResult } from '../services/airportsStaticService';
import FlightDetailsStep from './booking-steps/FlightDetailsStep';
import AircraftSelectionStep from './booking-steps/AircraftSelectionStep';
import ServicesStep from './booking-steps/ServicesStep';
import CarbonOffsetStep from './booking-steps/CarbonOffsetStep';
import BookingSummaryStep from './booking-steps/BookingSummaryStep';
import BookingProgress from './booking-steps/BookingProgress';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
  History,
  Settings,
  Wallet,
  LogOut,
  CheckCircle,
  AlertCircle,
  X,
  ExternalLink,
  Home,
  FileText,
  RefreshCw,
  Loader2,
  Globe,
  User,
  Shield,
  Copy,
  Check,
  Link,
  Download,
  Plane,
  Zap,
  Car,
  Eye,
  Upload,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  CreditCard,
  FileCheck,
  Coins,
  Award,
  Leaf,
  Percent,
  Star,
  Gift,
  Wifi,
  WifiOff,
  Plus,
  Filter,
  Search,
  Grid,
  List,
  TrendingUp,
  Send,
  Sparkles,
  Fuel,
  ToggleLeft,
  ChevronLeft,
  Building2,
  Bitcoin,
  ArrowUpDown,
  Briefcase,
  Dog,
  Anchor,
  Flower,
  HeartHandshake,
  Wine,
  Music,
  Luggage,
  Utensils,
  Heart,
  Accessibility,
  UserCheck,
  Coffee,
  Stethoscope,
  ToggleRight,
  Mountain,
  Ship,
  MessageSquare,
  HeaterIcon as Helicopter,
  TreePine,
  Menu,
  ChevronRight,
  ShoppingBag,
  DollarSign,
  Image,
  TrendingDown,
  Network,
  Key,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Building,
  Vote,
  Users
} from 'lucide-react';
import ProfileSettings from './ProfileSettings';
import TokenSwap from './Landingpagenew/TokenSwap.tsx';
import DashboardMap from './DashboardMap';
import WalletMenu from './WalletMenu';

// Types for the old Dashboard functionality
interface LocationData {
  city: string;
  country: string;
  ip: string;
}

interface UnifiedRequest {
  id: string;
  type: string;
  route?: string;
  amount?: string;
  status: string;
  date: string;
  time: string;
  icon: string;
  details?: any;
  created_at?: string;
  updated_at?: string;
}

interface UserCO2Stats {
  total_requests: number;
  completed_certificates: number;
  pending_requests: number;
  total_emissions_kg: number;
  total_cost: number;
}

// CO2 Certificate Project Interface
interface CO2Project {
  id: string;
  projectId: string;
  name: string;
  description: string;
  location: string;
  country: string;
  continent: string;
  category: 'reforestation' | 'renewable-energy' | 'methane-capture' | 'clean-water' | 'sustainable-agriculture' | 'blue-carbon' | 'direct-air-capture' | 'biochar';
  ngoName: string;
  verified: boolean;
  certificationStandard: string;
  pricePerTon: number;
  minPurchase: number;
  maxPurchase: number;
  availableTons: number;
  totalOffset: number;
  image: string;
  benefits: string[];
  methodology: string;
  projectStart: string;
  projectEnd: string;
  additionalInfo: {
    sdgGoals: number[];
    biodiversityImpact: string;
    communityBenefit: string;
    technologyUsed: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface WalletAssets {
  nfts: Array<{
    id: string;
    name: string;
    tier: string;
    benefits: string[];
    rarity: string;
    image: string;
  }>;
  walletCertificates: any[];
  balance: number;
}

interface DAO {
  id: string;
  name: string;
  description: string;
  creator: string;
  creatorWallet: string;
  imageUrl: string;
  category: string;
  tokenSymbol: string;
  totalSupply: string;
  votingPower: string;
  treasuryValue: string;
  membersCount: number;
  proposalsCount: number;
  createdAt: Date;
  status: 'active' | 'inactive' | 'pending';
  website?: string;
  socialLinks?: {
    twitter?: string;
    discord?: string;
    telegram?: string;
  };
}

interface Proposal {
  id: string;
  daoId: string;
  daoName: string;
  title: string;
  description: string;
  type: 'funding' | 'governance' | 'upgrade' | 'membership';
  proposer: string;
  proposerWallet: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotes: number;
  quorumRequired: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'passed' | 'failed' | 'pending';
  executionStatus?: 'pending' | 'executed' | 'failed';
}

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();

  // Global wallet state from Wagmi - synced with header
  const { address, isConnected, chain } = useAccount();
  const { open } = useAppKit();

  // Global wallet connection handler - uses custom white modal
  const handleWalletConnect = () => {
    if (!isConnected) {
      setShowWalletModal(true);
    }
  };

  // Handle wallet connection success
  const handleWalletConnected = (address: string) => {
    console.log('Wallet connected:', address);
    setShowWalletModal(false);
  };

  // Removed connection status panel - using visual indicators instead

  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('jets');
  const [showSAF, setShowSAF] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [kycStatus, setKycStatus] = useState<'not_started' | 'pending' | 'verified'>('not_started');
  // Wallet state is managed by Wagmi hooks - removed local state
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      type: 'ai',
      message: 'Hello! I\'m your AI Travel Designer. I can help you plan the perfect charter experience. What kind of trip are you looking for?',
      time: '2:30 PM'
    }
  ]);

  // Removed duplicate user destructuring - already declared above
  const [currentView, setCurrentView] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [showKycForm, setShowKycForm] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // Basket state management
  const [showBasket, setShowBasket] = useState(false);
  const [basketItems, setBasketItems] = useState<any[]>([]);

  // Services tree expansion state
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [fundsExpanded, setFundsExpanded] = useState(false);
  const [tokenizationExpanded, setTokenizationExpanded] = useState(false);
  const [marketplaceExpanded, setMarketplaceExpanded] = useState(false);

  // Tokenization page state
  const [tokenizationActiveTab, setTokenizationActiveTab] = useState('overview');
  const [tokenizationSelectedAsset, setTokenizationSelectedAsset] = useState('');
  const [tokenizationTokenAmount, setTokenizationTokenAmount] = useState('');
  const [tokenizationIsProcessing, setTokenizationIsProcessing] = useState(false);
  const [tokenizationShowCreateModal, setTokenizationShowCreateModal] = useState(false);

  // NFT page state
  const [nfts, setNfts] = useState([]);
  const [nftLoading, setNftLoading] = useState(true);
  const [nftActiveTab, setNftActiveTab] = useState('owned');
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [showListModal, setShowListModal] = useState(false);
  const [listPrice, setListPrice] = useState('');
  const [showBuyModal, setShowBuyModal] = useState(false);

  // Carbon marketplace state
  const [carbonActiveTab, setCarbonActiveTab] = useState('marketplace');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseStep, setPurchaseStep] = useState(1);
  const [purchaseTons, setPurchaseTons] = useState(1);
  const [customTonsInput, setCustomTonsInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);

  // Basket management functions
  const addToBasket = (item: any) => {
    const newItem = {
      id: Date.now() + Math.random(),
      ...item,
      dateAdded: new Date().toISOString(),
      quantity: 1
    };
    setBasketItems(prev => [...prev, newItem]);
  };

  const removeFromBasket = (itemId: string | number) => {
    setBasketItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearBasket = () => {
    setBasketItems([]);
  };

  // Location and IP tracking
  const [locationData, setLocationData] = useState<LocationData>({
    city: '',
    country: '',
    ip: ''
  });

  // Requests and stats
  const [dashboardUserRequests, setDashboardUserRequests] = useState<UnifiedRequest[]>([]);
  const [co2CertificateRequests, setCo2CertificateRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [co2Stats, setCo2Stats] = useState<UserCO2Stats | null>(null);
  const [walletAssets, setWalletAssets] = useState<WalletAssets>({
    nfts: [],
    walletCertificates: [],
    balance: 0
  });

  // DAO Governance State with sample data
  const [daos, setDaos] = useState<DAO[]>([
    {
      id: 'dao-sample-1',
      name: 'GreenFly DAO',
      description: 'A community-driven DAO focused on sustainable aviation and carbon-neutral private jet travel. We aim to revolutionize the aviation industry through innovative eco-friendly solutions.',
      creator: 'john.doe@example.com',
      creatorWallet: '0x742d35Cc6874Bc4C4e2B9D8b42F6d17E2A4C5c5e',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
      category: 'Environmental',
      tokenSymbol: 'GFLY',
      totalSupply: '10000000',
      votingPower: '25000',
      treasuryValue: '250000',
      membersCount: 247,
      proposalsCount: 8,
      createdAt: new Date('2024-01-15'),
      status: 'active' as const,
      website: 'https://greenflyodao.com',
      socialLinks: {
        twitter: '@GreenFlyDAO',
        discord: 'https://discord.gg/greenfly',
        telegram: 'https://t.me/greenfly'
      }
    },
    {
      id: 'dao-sample-2',
      name: 'Charter Collective',
      description: 'Democratizing private aviation through collective ownership and shared governance. Members vote on fleet acquisitions, routes, and service improvements.',
      creator: 'sarah.smith@example.com',
      creatorWallet: '0x8ba1f109551bD432803012645Hac136c',
      imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop',
      category: 'Investment',
      tokenSymbol: 'CHART',
      totalSupply: '5000000',
      votingPower: '12500',
      treasuryValue: '1200000',
      membersCount: 156,
      proposalsCount: 12,
      createdAt: new Date('2024-02-20'),
      status: 'active' as const,
      website: 'https://chartercollective.io',
      socialLinks: {
        twitter: '@CharterDAO',
        discord: 'https://discord.gg/charter'
      }
    }
  ]);
  const [daoLoading, setDaoLoading] = useState(false);

  // Sample Proposals
  const [proposals] = useState<Proposal[]>([
    {
      id: 'prop-1',
      daoId: 'dao-sample-1',
      daoName: 'GreenFly DAO',
      title: 'Fund Sustainable Aviation Fuel Research',
      description: 'Allocate 50,000 GFLY tokens from treasury to fund research into next-generation sustainable aviation fuels. This will help reduce carbon emissions by 80% compared to traditional jet fuel.',
      type: 'funding',
      proposer: 'john.doe@example.com',
      proposerWallet: '0x742d35Cc6874Bc4C4e2B9D8b42F6d17E2A4C5c5e',
      votesFor: 186,
      votesAgainst: 34,
      votesAbstain: 12,
      totalVotes: 232,
      quorumRequired: 200,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-08'),
      status: 'active',
      executionStatus: 'pending'
    },
    {
      id: 'prop-2',
      daoId: 'dao-sample-2',
      daoName: 'Charter Collective',
      title: 'Add New Route: Miami to Bahamas',
      description: 'Proposal to add a new charter route from Miami to Nassau, Bahamas. Market research indicates high demand and potential revenue of $2M annually.',
      type: 'governance',
      proposer: 'sarah.smith@example.com',
      proposerWallet: '0x8ba1f109551bD432803012645Hac136c',
      votesFor: 89,
      votesAgainst: 23,
      votesAbstain: 8,
      totalVotes: 120,
      quorumRequired: 100,
      startDate: new Date('2024-02-25'),
      endDate: new Date('2024-03-05'),
      status: 'active',
      executionStatus: 'pending'
    }
  ]);

  const [userStats, setUserStats] = useState({
    totalRequests: 0,
    totalSpent: 0,
    co2Requests: 0,
    memberSince: 'Jul 2025'
  });

  const [selectedRequest, setSelectedRequest] = useState<UnifiedRequest | null>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [requestFilter, setRequestFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Empty Legs state
  const [emptyLegOffers, setEmptyLegOffers] = useState<any[]>([]);
  const [loadingEmptyLegs, setLoadingEmptyLegs] = useState(false);
  const [emptyLegsView, setEmptyLegsView] = useState<'grid' | 'list'>('grid');
  const [emptyLegsCategory, setEmptyLegsCategory] = useState<string>('all');
  const [selectedEmptyLeg, setSelectedEmptyLeg] = useState<any | null>(null);
  const [showEmptyLegModal, setShowEmptyLegModal] = useState(false);

  // Adventure Packages state
  const [adventurePackages, setAdventurePackages] = useState<any[]>([]);
  const [loadingAdventures, setLoadingAdventures] = useState(false);
  const [adventuresView, setAdventuresView] = useState<'grid' | 'list'>('grid');
  const [selectedAdventure, setSelectedAdventure] = useState<any | null>(null);
  const [showFixedOfferModal, setShowFixedOfferModal] = useState(false);

  // Luxury Cars state
  const [luxuryCars, setLuxuryCars] = useState<any[]>([]);
  const [carsLoading, setCarsLoading] = useState(false);
  const [carsView, setCarsView] = useState<'grid' | 'list'>('grid');
  const [selectedCar, setSelectedCar] = useState<any | null>(null);
  const [showLuxuryCarModal, setShowLuxuryCarModal] = useState(false);


  // Data loading functions
  const loadEmptyLegOffers = async (category?: string) => {
    setLoadingEmptyLegs(true);
    try {
      const params = {
        limit: 20,
        category: category && category !== 'all' ? category : undefined
      };

      const result = await fetchEmptyLegs(params);
      setEmptyLegOffers(result.data || []);
      console.log(`Loaded ${result.data?.length || 0} empty leg offers from database`);
    } catch (error) {
      console.error('Error loading empty leg offers:', error);
      setEmptyLegOffers([]);
    } finally {
      setLoadingEmptyLegs(false);
    }
  };

  const loadAdventurePackages = async () => {
    console.log('Loading adventure packages...');
    setLoadingAdventures(true);
    try {
      // First try to fetch from Supabase database
      const { data, error } = await supabase
        .from('fixed_offers')
        .select('*')
        .eq('category', 'adventure')
        .eq('available', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading adventure packages:', error);
        throw error; // Force fallback to mock data
      } else {
        console.log('Loaded adventure packages from database:', data);
        setAdventurePackages(data || []);
      }
    } catch (error) {
      console.error('Error loading adventure packages, using fallback mock data:', error);
      // Enhanced adventure packages with comprehensive data matching luxury cars structure
      const mockAdventures = [
        {
          id: 1,
          title: 'Alpine Skiing Experience',
          description: 'Luxury ski weekend in the Swiss Alps with private jet transport and five-star accommodation',
          destination: 'St. Moritz, Switzerland',
          duration: '7 days',
          price_per_person: 15000,
          max_guests: 8,
          includes: 'Private Jet + 5-Star Hotel + Ski Pass + Equipment + All Meals + Spa Access',
          category: 'Winter Sports',
          difficulty: 'Intermediate',
          difficulty_level: 'Intermediate',
          season: 'December - March',
          aircraft_type: 'Gulfstream G650',
          accommodation: 'Kulm Hotel St. Moritz',
          activities: ['Skiing', 'Snowboarding', 'Helicopter Tours', 'Spa & Wellness', 'Fine Dining'],
          features: ['Professional Ski Guide', 'Equipment Included', 'VIP Lift Access', 'Photography Service', 'Helicopter Tours', 'Gourmet Dining'],
          detailed_description: 'Experience the ultimate luxury ski adventure in St. Moritz with private jet transport, five-star accommodation, and exclusive access to the finest slopes in the Swiss Alps.',
          highlights: [
            'Private jet transport from major European cities',
            'Exclusive access to Corviglia ski area',
            'Professional ski instructor included',
            'Helicopter scenic tours over the Alps',
            'Michelin-starred dining experiences'
          ],
          group_size: '2-8 guests',
          departure_locations: ['London', 'Paris', 'Geneva', 'Zurich'],
          what_to_expect: [
            'Private jet pickup from your preferred location',
            'Transfer to luxury accommodation',
            'Daily guided skiing with expert instructors',
            'Gourmet meals at Michelin-starred restaurants',
            'Spa and wellness treatments',
            'Optional helicopter scenic tours'
          ],
          itinerary: [
            { day: 1, title: 'Arrival', description: 'Private jet arrival, hotel check-in, welcome dinner' },
            { day: 2, title: 'First Slopes', description: 'Equipment fitting, guided skiing, mountain lunch' },
            { day: 3, title: 'Advanced Terrain', description: 'Off-piste skiing, helicopter tour option' },
            { day: 4, title: 'Spa Day', description: 'Morning skiing, afternoon spa treatments' },
            { day: 5, title: 'Cultural Experience', description: 'Visit local attractions, shopping, fine dining' },
            { day: 6, title: 'Final Runs', description: 'Last day skiing, farewell dinner' },
            { day: 7, title: 'Departure', description: 'Private jet return journey' }
          ],
          terms_conditions: 'Standard booking terms apply. 50% deposit required.',
          cancellation_policy: 'Free cancellation up to 30 days before departure',
          image: 'https://images.unsplash.com/photo-1551524164-6cf2ac2a8d4c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80',
          gallery: [
            'https://images.unsplash.com/photo-1551524164-6cf2ac2a8d4c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1565992441121-4367c2967103?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
          ],
          available: true,
          featured: true,
          next_departure: '2024-02-15',
          rating: 4.9,
          booking_type: 'quote_required',
          location: 'St. Moritz, Switzerland',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Maldivian Paradise Retreat',
          description: 'Escape to a private tropical paradise with overwater villa accommodation and world-class diving',
          destination: 'Maldives',
          duration: '10 days',
          price_per_person: 25000,
          max_guests: 4,
          includes: 'Private Jet + Overwater Villa + All Meals + Spa + Water Activities',
          category: 'Tropical Paradise',
          difficulty: 'Relaxing',
          difficulty_level: 'Relaxing',
          season: 'Year-round',
          aircraft_type: 'Bombardier Global 7500',
          accommodation: 'Four Seasons Resort Maldives',
          activities: ['Snorkeling', 'Diving', 'Spa treatments', 'Sunset cruises', 'Private dining'],
          features: ['Overwater Villa', 'Private Beach', 'Personal Butler', 'Water Sports', 'World-class Spa'],
          detailed_description: 'Escape to a private tropical paradise with overwater villa accommodation, world-class diving, and unparalleled luxury service in the heart of the Indian Ocean.',
          highlights: [
            'Private overwater villa with infinity pool',
            'World-class diving and snorkeling',
            'Personal butler service',
            'Unlimited water activities',
            'Seaplane transfers'
          ],
          group_size: '2-4 guests',
          departure_locations: ['London', 'Dubai', 'Singapore', 'Mumbai'],
          what_to_expect: [
            'Private jet flight with full service',
            'Seaplane transfer to resort',
            'Overwater villa with infinity pool',
            'Personal butler service',
            'Unlimited water activities',
            'World-class spa treatments'
          ],
          itinerary: [
            { day: 1, title: 'Arrival', description: 'Private jet arrival, seaplane transfer, villa setup' },
            { day: 2, title: 'Ocean Discovery', description: 'Snorkeling, diving experience, beach relaxation' },
            { day: 3, title: 'Island Exploration', description: 'Explore local islands, cultural experiences' },
            { day: 4, title: 'Wellness Day', description: 'Spa treatments, yoga, healthy dining' },
            { day: 5, title: 'Adventure', description: 'Deep sea fishing, sunset cruise' },
            { day: 6, title: 'Cultural Immersion', description: 'Local island visits, traditional experiences' },
            { day: 7, title: 'Relaxation', description: 'Villa day, spa treatments, private dining' },
            { day: 8, title: 'Water Adventures', description: 'Jet skiing, parasailing, dolphin watching' },
            { day: 9, title: 'Farewell', description: 'Last activities, sunset dinner, preparations' },
            { day: 10, title: 'Departure', description: 'Seaplane transfer, private jet return' }
          ],
          terms_conditions: 'Weather dependent activities. Insurance included.',
          cancellation_policy: 'Free cancellation up to 14 days before departure',
          image: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80',
          gallery: [
            'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1562004760-aceed3c2b855?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
          ],
          available: true,
          featured: true,
          next_departure: '2024-03-01',
          rating: 5.0,
          booking_type: 'quote_required',
          location: 'Maldives',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          title: 'African Safari Adventure',
          description: 'Witness the great migration and encounter the Big Five on this exclusive safari adventure',
          destination: 'Serengeti, Tanzania',
          duration: '8 days',
          price_per_person: 18000,
          max_guests: 6,
          includes: 'Private Charter + Safari Lodge + Game Drives + Hot Air Balloon + Cultural Visits',
          category: 'Wildlife Safari',
          difficulty: 'Moderate',
          difficulty_level: 'Moderate',
          season: 'June - October',
          aircraft_type: 'Citation X+',
          accommodation: 'Four Seasons Safari Lodge Serengeti',
          activities: ['Game drives', 'Hot air balloon safari', 'Cultural visits', 'Conservation activities'],
          features: ['Luxury Safari Lodge', 'Expert Guides', 'Conservation Experience', 'Photography Equipment'],
          detailed_description: 'Witness the great migration and encounter the Big Five on this exclusive safari adventure with luxury accommodation and expert wildlife guides.',
          highlights: [
            'Big Five viewing guaranteed',
            'Great migration experience',
            'Hot air balloon safari at sunrise',
            'Cultural interactions with Maasai communities',
            'Conservation project visits'
          ],
          group_size: '2-6 guests',
          departure_locations: ['London', 'Paris', 'Dubai', 'Nairobi'],
          what_to_expect: [
            'Private charter flight to Tanzania',
            'Luxury safari lodge accommodation',
            'Daily game drives with expert guides',
            'Hot air balloon safari experience',
            'Cultural interactions with Maasai communities',
            'Conservation project visits'
          ],
          itinerary: [
            { day: 1, title: 'Arrival', description: 'Charter flight arrival, lodge transfer, orientation' },
            { day: 2, title: 'First Safari', description: 'Morning and afternoon game drives' },
            { day: 3, title: 'Balloon Safari', description: 'Hot air balloon ride, champagne breakfast' },
            { day: 4, title: 'Cultural Day', description: 'Maasai village visit, traditional experiences' },
            { day: 5, title: 'Conservation', description: 'Visit conservation projects, wildlife research' },
            { day: 6, title: 'Big Five Hunt', description: 'Full day safari tracking the Big Five' },
            { day: 7, title: 'Final Safari', description: 'Last game drive, farewell dinner' },
            { day: 8, title: 'Departure', description: 'Return flight journey' }
          ],
          terms_conditions: 'Weather and wildlife sightings not guaranteed.',
          cancellation_policy: 'Flexible cancellation with travel insurance',
          image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80',
          gallery: [
            'https://images.unsplash.com/photo-1516426122078-c23e76319801?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
          ],
          available: true,
          featured: false,
          next_departure: '2024-07-20',
          rating: 4.8,
          booking_type: 'quote_required',
          location: 'Serengeti, Tanzania',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 4,
          title: 'Japanese Cultural Immersion',
          description: 'Immerse yourself in Japanese culture with traditional accommodations and authentic experiences',
          destination: 'Kyoto & Tokyo, Japan',
          duration: '12 days',
          price_per_person: 22000,
          max_guests: 6,
          includes: 'Private Jet + Ryokan & Hotels + Cultural Experiences + All Transportation + Traditional Meals',
          category: 'Cultural Experience',
          difficulty: 'Cultural',
          difficulty_level: 'Cultural',
          season: 'March - May, September - November',
          aircraft_type: 'Falcon 8X',
          accommodation: 'Luxury Ryokans and Hotels',
          activities: ['Tea ceremonies', 'Temple visits', 'Sushi making', 'Sake tastings', 'Garden tours'],
          features: ['Traditional Ryokan', 'Cultural Workshops', 'Private Guide', 'Authentic Cuisine'],
          detailed_description: 'Immerse yourself in Japanese culture with traditional accommodations, authentic experiences, and expert cultural guides in Kyoto and Tokyo.',
          highlights: [
            'Cherry blossom season experience',
            'Traditional tea ceremony workshops',
            'Authentic sushi masterclasses',
            'Ancient temple visits',
            'Cultural immersion activities'
          ],
          group_size: '2-6 guests',
          departure_locations: ['London', 'New York', 'Los Angeles', 'Hong Kong'],
          what_to_expect: [
            'Private jet flight to Japan',
            'Traditional ryokan accommodations',
            'Expert cultural guide throughout',
            'Authentic Japanese dining experiences',
            'Private temple and garden tours',
            'Hands-on cultural workshops'
          ],
          itinerary: [
            { day: 1, title: 'Tokyo Arrival', description: 'Private jet arrival, hotel check-in, city orientation' },
            { day: 2, title: 'Modern Tokyo', description: 'City tour, modern districts, technology centers' },
            { day: 3, title: 'Traditional Tokyo', description: 'Historic temples, traditional markets, sumo experience' },
            { day: 4, title: 'Travel to Kyoto', description: 'Bullet train journey, ryokan check-in' },
            { day: 5, title: 'Temple Hopping', description: 'Golden Pavilion, Bamboo Forest, Zen meditation' },
            { day: 6, title: 'Cultural Immersion', description: 'Tea ceremony, traditional crafts, sake tasting' },
            { day: 7, title: 'Artisan Workshops', description: 'Pottery making, calligraphy, traditional painting' },
            { day: 8, title: 'Culinary Journey', description: 'Sushi masterclass, kaiseki dinner, market tour' },
            { day: 9, title: 'Garden Day', description: 'Private garden tours, meditation, photography' },
            { day: 10, title: 'Final Experiences', description: 'Last cultural activities, souvenir shopping' },
            { day: 11, title: 'Tokyo Return', description: 'Return to Tokyo, modern art museums, farewell dinner' },
            { day: 12, title: 'Departure', description: 'Private jet departure' }
          ],
          terms_conditions: 'Seasonal activities subject to availability.',
          cancellation_policy: 'Standard terms with seasonal considerations',
          image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80',
          gallery: [
            'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1528164344705-47542687000d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
          ],
          available: true,
          featured: false,
          next_departure: '2024-04-10',
          rating: 4.7,
          booking_type: 'quote_required',
          location: 'Kyoto & Tokyo, Japan',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      console.log('Setting enhanced adventure packages:', mockAdventures);
      setAdventurePackages(mockAdventures);
    } finally {
      setLoadingAdventures(false);
    }
  };

  const loadLuxuryCars = async () => {
    console.log('Loading luxury cars...');
    setCarsLoading(true);
    try {
      // This would typically fetch from your Supabase database or API
      const { data, error } = await supabase
        .from('luxury_cars')
        .select('*')
        .eq('available', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading luxury cars:', error);
        throw error; // Force fallback to mock data
      } else {
        console.log('Loaded luxury cars from database:', data);
        setLuxuryCars(data || []);
      }
    } catch (error) {
      console.error('Error loading luxury cars, using fallback mock data:', error);
      // Fallback to mock data - Enhanced luxury car collection
      const mockCars = [
        {
          id: 1,
          brand: 'Rolls-Royce',
          model: 'Phantom',
          year: 2024,
          category: 'Ultra Luxury',
          passengers: 4,
          price_per_hour: 350,
          price_per_day: 2800,
          location: 'London, Paris, Monaco',
          features: ['Professional Chauffeur', 'Starlight Ceiling', 'Premium Bar', 'WiFi', 'Massage Seats'],
          description: 'The pinnacle of luxury motoring with unparalleled comfort and prestige.',
          available: true,
          transmission: 'Automatic',
          fuel_type: 'Petrol',
          image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&h=600&fit=crop&crop=center'
        },
        {
          id: 2,
          brand: 'Mercedes-Benz',
          model: 'S-Class Maybach',
          year: 2024,
          category: 'Executive Luxury',
          passengers: 4,
          price_per_hour: 280,
          price_per_day: 2200,
          location: 'Major European Cities',
          features: ['Executive Rear Seats', 'Champagne Cooler', 'Privacy Glass', 'Premium Sound'],
          description: 'Ultimate executive transportation with first-class rear seating experience.',
          available: true,
          transmission: 'Automatic',
          fuel_type: 'Hybrid',
          image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop&crop=center'
        },
        {
          id: 3,
          brand: 'Bentley',
          model: 'Flying Spur',
          year: 2024,
          category: 'Luxury Performance',
          passengers: 4,
          price_per_hour: 320,
          price_per_day: 2500,
          location: 'London, Geneva, Milan',
          features: ['Handcrafted Interior', 'Diamond Quilted Seats', 'Naim Audio', 'City Safeguarding'],
          description: 'Exceptional blend of performance and luxury craftsmanship.',
          available: true,
          transmission: 'Automatic',
          fuel_type: 'Petrol',
          image: 'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=800&h=600&fit=crop&crop=center'
        },
        {
          id: 4,
          brand: 'Aston Martin',
          model: 'DBX',
          year: 2024,
          category: 'Luxury SUV',
          passengers: 5,
          price_per_hour: 290,
          price_per_day: 2300,
          location: 'Alpine Resorts, Coastal Cities',
          features: ['Sport Seats', 'Terrain Response', 'Bang & Olufsen Audio', 'Panoramic Roof'],
          description: 'Luxury SUV combining British elegance with all-terrain capability.',
          available: true,
          transmission: 'Automatic',
          fuel_type: 'Petrol',
          image: 'https://images.unsplash.com/photo-1611016186353-9af58c69a533?w=800&h=600&fit=crop&crop=center'
        },
        {
          id: 5,
          brand: 'Porsche',
          model: 'Panamera Turbo',
          year: 2024,
          category: 'Performance Luxury',
          passengers: 4,
          price_per_hour: 260,
          price_per_day: 2000,
          location: 'Frankfurt, Munich, Zurich',
          features: ['Sport Chrono', 'Adaptive Air Suspension', 'Burmester Audio', 'LED Matrix'],
          description: 'Perfect fusion of sports car performance and luxury sedan comfort.',
          available: true,
          transmission: 'PDK Automatic',
          fuel_type: 'Hybrid',
          image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop&crop=center'
        },
        {
          id: 6,
          brand: 'BMW',
          model: 'i7 xDrive60',
          year: 2024,
          category: 'Electric Luxury',
          passengers: 4,
          price_per_hour: 240,
          price_per_day: 1900,
          location: 'Berlin, Amsterdam, Copenhagen',
          features: ['Electric Drive', 'Massage Seats', '31-inch Theatre Screen', 'Sustainable Materials'],
          description: 'Revolutionary electric luxury sedan with zero emissions and maximum comfort.',
          available: true,
          transmission: 'Single-Speed Automatic',
          fuel_type: 'Electric',
          image: 'https://images.unsplash.com/photo-1618976863038-4d178a68d21d?w=800&h=600&fit=crop&crop=center'
        },
        {
          id: 7,
          brand: 'Range Rover',
          model: 'Autobiography',
          year: 2024,
          category: 'Luxury SUV',
          passengers: 5,
          price_per_hour: 270,
          price_per_day: 2100,
          location: 'Scottish Highlands, Swiss Alps',
          features: ['Terrain Response 2', 'Executive Class Seating', 'Meridian Sound', 'Air Suspension'],
          description: 'The ultimate luxury SUV for any terrain with uncompromised comfort.',
          available: true,
          transmission: 'Automatic',
          fuel_type: 'Hybrid',
          image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop&crop=center'
        },
        {
          id: 8,
          brand: 'Maserati',
          model: 'Quattroporte',
          year: 2024,
          category: 'Italian Luxury',
          passengers: 4,
          price_per_hour: 250,
          price_per_day: 1950,
          location: 'Rome, Florence, French Riviera',
          features: ['Harman Kardon Audio', 'Leather Interior', 'Sport Mode', 'Skyhook Suspension'],
          description: 'Italian elegance meets performance in this prestigious luxury sedan.',
          available: true,
          transmission: 'Automatic',
          fuel_type: 'Petrol',
          image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop&crop=center'
        }
      ];
      console.log('Setting mock cars:', mockCars);
      setLuxuryCars(mockCars);
    } finally {
      setCarsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadEmptyLegOffers();
    loadAdventurePackages();
    loadLuxuryCars();
  }, []);

  // Load empty legs when category changes
  useEffect(() => {
    loadEmptyLegOffers(emptyLegsCategory);
  }, [emptyLegsCategory]);

  // Load NFTs on component mount
  useEffect(() => {
    const fetchNFTs = async () => {
      setNftLoading(true);
      try {
        // Sample NFT data (in production, this would come from OpenSea API)
        const sampleNFTs = [
          // User's owned NFTs
          {
            id: '1',
            name: 'PrivateCharterX Genesis #001',
            image: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Jwo44qtAW_mqXD4M6xP6qr4Q2_1cCgmZN8_v2K4Msd7ofw?auto=format&dpr=1&w=256',
            price: '2.5 ETH',
            lastSale: '2.1 ETH',
            collection: 'PrivateCharterX',
            tokenId: '001',
            owner: user?.email?.split('@')[0] || 'You',
            listed: false,
            floorPrice: '1.8 ETH',
            traits: [
              { trait_type: 'Aircraft Type', value: 'Gulfstream G650' },
              { trait_type: 'Rarity', value: 'Legendary' },
              { trait_type: 'Route Access', value: 'Global' }
            ]
          },
          {
            id: '2',
            name: 'Luxury Fleet Token #245',
            image: 'https://i.seadn.io/gae/YEyPq5jzxJVZwKx1hOFYoU5lvV_2HYY8cB5u6qmOQsKr6QnG3xJqV2Gk8ZqF5P1JvL6YM3Q8K9L_P2A?auto=format&dpr=1&w=256',
            price: '1.2 ETH',
            lastSale: '0.9 ETH',
            collection: 'Luxury Fleet Access',
            tokenId: '245',
            owner: user?.email?.split('@')[0] || 'You',
            listed: true,
            floorPrice: '0.8 ETH',
            traits: [
              { trait_type: 'Fleet Size', value: 'Premium' },
              { trait_type: 'Helicopter Access', value: 'Included' },
              { trait_type: 'Yacht Charter', value: 'Elite' }
            ]
          },
          // Marketplace NFTs for minting
          {
            id: '3',
            name: 'PrivateCharterX Elite #456',
            image: 'https://i.seadn.io/gae/R3vyGP1qQj5pKKx9cG8fFq1KN8RzP9X2V4X6H?auto=format&dpr=1&w=256',
            price: '0.8 ETH',
            lastSale: null,
            collection: 'PrivateCharterX Elite',
            tokenId: '456',
            owner: 'PrivateCharterX',
            listed: false,
            forSale: true,
            floorPrice: '0.5 ETH',
            traits: [
              { trait_type: 'Aircraft Type', value: 'Citation CJ4' },
              { trait_type: 'Rarity', value: 'Rare' },
              { trait_type: 'Route Access', value: 'Regional' }
            ]
          },
          {
            id: '4',
            name: 'Carbon Credit NFT #789',
            image: 'https://i.seadn.io/gae/3vyGP1qQj5pKKx9cG8fFq1KN8RzP9X2V4L7Mh6TjQ9R2K8B5Y3M1C9P7F4X6H?auto=format&dpr=1&w=256',
            price: '0.3 ETH',
            lastSale: null,
            collection: 'Green Travel Certificates',
            tokenId: '789',
            owner: 'PrivateCharterX',
            listed: false,
            forSale: true,
            floorPrice: '0.2 ETH',
            traits: [
              { trait_type: 'CO2 Offset', value: '5 Tons' },
              { trait_type: 'Verification', value: 'VCS' },
              { trait_type: 'Project Type', value: 'Forest Conservation' }
            ]
          },
          {
            id: '5',
            name: 'Helicopter Access Pass #102',
            image: 'https://i.seadn.io/gae/K8vyGP1qQj5pKKx9cG8fFq1KN8RzP9X2V4L7Mh6TjQ9R2K8B5Y3M1C9P7F4X6H?auto=format&dpr=1&w=256',
            price: '1.5 ETH',
            lastSale: null,
            collection: 'Helicopter Fleet',
            tokenId: '102',
            owner: 'PrivateCharterX',
            listed: false,
            forSale: true,
            floorPrice: '1.0 ETH',
            traits: [
              { trait_type: 'Aircraft Type', value: 'Bell 429' },
              { trait_type: 'Rarity', value: 'Epic' },
              { trait_type: 'Flight Hours', value: 'Unlimited' }
            ]
          },
          {
            id: '6',
            name: 'Yacht Charter Token #334',
            image: 'https://i.seadn.io/gae/M9vyGP1qQj5pKKx9cG8fFq1KN8RzP9X2V4L7Mh6TjQ9R2K8B5Y3M1C9P7F4X6H?auto=format&dpr=1&w=256',
            price: '2.2 ETH',
            lastSale: null,
            collection: 'Luxury Yacht Access',
            tokenId: '334',
            owner: 'PrivateCharterX',
            listed: false,
            forSale: true,
            floorPrice: '1.8 ETH',
            traits: [
              { trait_type: 'Yacht Size', value: '150ft+' },
              { trait_type: 'Rarity', value: 'Legendary' },
              { trait_type: 'Ocean Access', value: 'Global' }
            ]
          }
        ];

        // In production, this would be:
        // const response = await fetch(`${OPENSEA_BASE_URL}/assets`, {
        //   headers: { 'X-API-KEY': OPENSEA_API_KEY }
        // });
        // const data = await response.json();
        // setNfts(data.assets);

        // For now, using sample data
        await new Promise(resolve => setTimeout(resolve, 1000));
        setNfts(sampleNFTs);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
      } finally {
        setNftLoading(false);
      }
    };

    fetchNFTs();
  }, [user]);

  // Real CO2 Projects from Marketplace.tsx
  const realCO2Projects: CO2Project[] = [
    {
      id: '10250',
      projectId: '10250',
      name: 'Solar Power Project',
      description: 'This Clean Development Mechanism (CDM) project involves the installation of a 5.2 MWp solar power plant in Anantapur, Andhra Pradesh, generating clean renewable electricity from solar energy, displacing approximately 8,253 MWh of electricity annually.',
      location: 'Anantapur, Andhra Pradesh',
      country: 'India',
      continent: 'Asia',
      category: 'renewable-energy',
      ngoName: 'Narasimha Swamy Solar Generations Pvt. Ltd.',
      verified: true,
      certificationStandard: 'CDM',
      pricePerTon: 5.00,
      minPurchase: 1,
      maxPurchase: 1000,
      availableTons: 35243,
      totalOffset: 35243,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0001252_solar-power-project-by-narasimha-swamy-solar-generations-pvt-ltd_550.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMTI1Ml9zb2xhci1wb3dlci1wcm9qZWN0LWJ5LW5hcmFzaW1oYS1zd2FteS1zb2xhci1nZW5lcmF0aW9ucy1wdnQtbHRkXzU1MC5qcGVnIiwiaWF0IjoxNzU3NDMxMzQwLCJleHAiOjE3ODg5NjczNDB9.dV682u8dFfcEZAJb1qz-AfzT2cndmPuuJrkVzxkTEhU',
      benefits: ['Clean Energy Generation', 'Employment Creation', 'Grid Frequency Improvement', 'Technology Transfer'],
      methodology: 'Solar Photovoltaic Power Generation',
      projectStart: '2013-01-01',
      projectEnd: '2030-12-31',
      additionalInfo: {
        sdgGoals: [7, 13, 8, 9],
        biodiversityImpact: 'Minimal land use impact with clean energy generation',
        communityBenefit: 'Creates employment opportunities during construction and operation',
        technologyUsed: 'Advanced photovoltaic systems'
      },
      coordinates: { lat: 14.6819, lng: 77.6006 }
    },
    {
      id: '6573',
      projectId: '6573',
      name: 'Caixa Econômica Federal Solid Waste Management and Carbon Finance Project',
      description: 'The project aims to reduce methane emissions from municipal landfills in Brazil, capturing 450,000 cubic meters of greenhouse gases daily. This landfill gas would otherwise be released into the atmosphere, but is captured, converted into electricity, and distributed as biogas.',
      location: 'Seropédica, Rio de Janeiro',
      country: 'Brazil',
      continent: 'South America',
      category: 'methane-capture',
      ngoName: 'Caixa Econômica Federal',
      verified: true,
      certificationStandard: 'CDM',
      pricePerTon: 6.00,
      minPurchase: 1,
      maxPurchase: 800,
      availableTons: 28572,
      totalOffset: 28572,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0001175_caixa-economica-federal-solid-waste-management-and-carbon-finance-project.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMTE3NV9jYWl4YS1lY29ub21pY2EtZmVkZXJhbC1zb2xpZC13YXN0ZS1tYW5hZ2VtZW50LWFuZC1jYXJib24tZmluYW5jZS1wcm9qZWN0LmpwZWciLCJpYXQiOjE3NTc0MzEzOTAsImV4cCI6MTc4ODk2NzM5MH0.HQq1YtvjjuBk0KgjXZqZUkXX2uhQ8a1vG2VwZbsVP14',
      benefits: ['Methane Capture', 'Waste Management', 'Biogas Generation', 'Environmental Recovery'],
      methodology: 'Landfill Gas Capture and Utilization',
      projectStart: '2010-01-01',
      projectEnd: '2028-12-31',
      additionalInfo: {
        sdgGoals: [12, 13, 11, 15],
        biodiversityImpact: 'Reduces environmental pollution and land degradation',
        communityBenefit: 'Improves local air quality and waste management',
        technologyUsed: 'Landfill gas capture and biogas conversion systems'
      },
      coordinates: { lat: -22.7461, lng: -43.7017 }
    },
    {
      id: '9165',
      projectId: '9165',
      name: 'Taebaek Wind Park (Hasami Samcheok) CDM Project',
      description: 'Located in Gangwon-do, Republic of Korea, this 18MW wind farm generates electricity from renewable wind energy with 9 turbines of 2MW each. The project produces about 44,568 MWh per year and achieves an average annual emission reduction of 302,570 tCO2 over ten years.',
      location: 'Gangwon-do, South Korea',
      country: 'South Korea',
      continent: 'Asia',
      category: 'renewable-energy',
      ngoName: 'Taebaek Wind Park Co., Ltd',
      verified: true,
      certificationStandard: 'CDM',
      pricePerTon: 7.00,
      minPurchase: 1,
      maxPurchase: 500,
      availableTons: 33678,
      totalOffset: 33678,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0000941_taebaek-wind-park-hasami-samcheok-cdm-project.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMDk0MV90YWViYWVrLXdpbmQtcGFyay1oYXNhbWktc2FtY2hlb2stY2RtLXByb2plY3QuanBlZyIsImlhdCI6MTc1NzQzMTQ1NywiZXhwIjo0OTc2Njk3Mzg1N30.WYt0J3KKw0WuArm7nykOr3ttR60T0bfEIj8A80mDuDs',
      benefits: ['Clean Energy Generation', 'Tourism Development', 'Technology Advancement', 'Energy Independence'],
      methodology: 'Wind Power Generation',
      projectStart: '2012-01-01',
      projectEnd: '2025-12-31',
      additionalInfo: {
        sdgGoals: [7, 13, 9, 8],
        biodiversityImpact: 'Minimal environmental impact with clean energy production',
        communityBenefit: 'Creates jobs and attracts tourism to the region',
        technologyUsed: '2MW wind turbine generators'
      },
      coordinates: { lat: 37.1640, lng: 128.9856 }
    },
    {
      id: '10080',
      projectId: '10080',
      name: 'Rondinha Small Hydroelectric Power Plant',
      description: 'Located on the Chapecó River in Santa Catarina, Brazil, this 9.6 MW hydroelectric plant serves approximately 18,500 consumer units, benefiting around 70,000 inhabitants. The run-of-river operation uses minimal flooded area, significantly reducing environmental impacts.',
      location: 'Passos Maia, Santa Catarina',
      country: 'Brazil',
      continent: 'South America',
      category: 'renewable-energy',
      ngoName: 'Rondinha Energetica S.A.',
      verified: true,
      certificationStandard: 'CDM',
      pricePerTon: 3.20,
      minPurchase: 0.5,
      maxPurchase: 400,
      availableTons: 16357,
      totalOffset: 16357,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0001123_rondinha-small-hydroelectric-power-plant.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMTEyM19yb25kaW5oYS1zbWFsbC1oeWRyb2VsZWN0cmljLXBvd2VyLXBsYW50LmpwZWciLCJpYXQiOjE3NTc0MzE2MzcsImV4cCI6NDk3NjY5NzQwMzd9.BS2P9jVuwNCu40lqE0sA3UjqJ0CdMFwDXB7G59R4moM',
      benefits: ['Clean Energy Generation', 'Ecosystem Preservation', 'Job Creation', 'Environmental Education'],
      methodology: 'Small Hydro Power Generation',
      projectStart: '2014-01-01',
      projectEnd: '2035-12-31',
      additionalInfo: {
        sdgGoals: [7, 13, 15, 6],
        biodiversityImpact: 'Preserves aquatic and terrestrial ecosystems',
        communityBenefit: 'Benefits around 70,000 inhabitants with clean energy',
        technologyUsed: 'Run-of-river hydroelectric technology'
      },
      coordinates: { lat: -26.7734, lng: -52.0567 }
    },
    {
      id: '9078',
      projectId: '9078',
      name: 'Solar PV Power Project by MMPL in Fatepur, Gujarat',
      description: 'Tata Power\'s solar PV project in Gujarat represents a transformation in sustainability with advanced photovoltaic technology. The project has resulted in infrastructure development and stimulated business growth by enhancing electricity generation capacity.',
      location: 'Fatepur, Gujarat',
      country: 'India',
      continent: 'Asia',
      category: 'renewable-energy',
      ngoName: 'Tata Power (MMPL)',
      verified: true,
      certificationStandard: 'CDM',
      pricePerTon: 2.50,
      minPurchase: 1,
      maxPurchase: 2000,
      availableTons: 150009,
      totalOffset: 150009,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0001123_rondinha-small-hydroelectric-power-plant.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMTEyM19yb25kaW5oYS1zbWFsbC1oeWRyb2VsZWN0cmljLXBvd2VyLXBsYW50LmpwZWciLCJpYXQiOjE3NTc0MzE2MzcsImV4cCI6NDk3NjY5NzQwMzd9.BS2P9jVuwNCu40lqE0sA3UjqJ0CdMFwDXB7G59R4moM',
      benefits: ['Clean Energy Access', 'Infrastructure Development', 'GHG Reduction', 'Grid Enhancement'],
      methodology: 'Solar Photovoltaic Power Generation',
      projectStart: '2012-01-01',
      projectEnd: '2030-12-31',
      additionalInfo: {
        sdgGoals: [7, 13, 9, 11],
        biodiversityImpact: 'Minimal land impact with significant GHG reduction',
        communityBenefit: 'Infrastructure development and business growth',
        technologyUsed: 'Advanced photovoltaic systems with grid integration'
      },
      coordinates: { lat: 23.0225, lng: 72.5714 }
    },
    {
      id: '7980',
      projectId: '7980',
      name: 'Burgos Wind Project',
      description: 'The largest wind farm in the Philippines with 150-MW capacity, featuring fifty Vestas V90 wind turbines in one of the country\'s best wind areas. The project complies with all local and national environmental policies and produces clean energy.',
      location: 'Burgos, Ilocos Norte',
      country: 'Philippines',
      continent: 'Asia',
      category: 'renewable-energy',
      ngoName: 'EDC Burgos Wind Power Corporation',
      verified: true,
      certificationStandard: 'CDM',
      pricePerTon: 5.50,
      minPurchase: 1,
      maxPurchase: 300,
      availableTons: 12585,
      totalOffset: 12585,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0000616_burgos-wind-project.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMDYxNl9idXJnb3Mtd2luZC1wcm9qZWN0LmpwZWciLCJpYXQiOjE3NTc0MzE3MzMsImV4cCI6MTc4ODk2NzczM30.UjJLrQ9tpy0cj6bayjdyBstsEkDx6_Mldj1njlm18eo',
      benefits: ['Clean Energy Generation', 'Job Creation', 'Environmental Protection', 'Community Development'],
      methodology: 'Wind Power Generation',
      projectStart: '2014-01-01',
      projectEnd: '2030-12-31',
      additionalInfo: {
        sdgGoals: [7, 13, 8, 4],
        biodiversityImpact: 'Produces clean energy while maintaining environmental standards',
        communityBenefit: 'Generates jobs and supports local government initiatives',
        technologyUsed: 'Vestas V90 wind turbines (50 units of 3MW each)'
      },
      coordinates: { lat: 18.5311, lng: 120.6511 }
    },
    {
      id: '10360',
      projectId: '10360',
      name: '5 MW Solar Power Project by Baba Group',
      description: 'The project utilizes renewable solar energy for generation of electricity in Madhya Pradesh, India. The project contributes towards reduction in demand-supply gap and increases the share of renewable energy in the grid mix.',
      location: 'Sehore, Madhya Pradesh',
      country: 'India',
      continent: 'Asia',
      category: 'renewable-energy',
      ngoName: 'Dharampal Premchand Ltd. (Baba Group)',
      verified: true,
      certificationStandard: 'CDM',
      pricePerTon: 16.00,
      minPurchase: 1,
      maxPurchase: 100,
      availableTons: 619,
      totalOffset: 619,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0000537_5-mw-solar-power-project-by-baba-group.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMDUzN181LW13LXNvbGFyLXBvd2VyLXByb2plY3QtYnktYmFiYS1ncm91cC5qcGVnIiwiaWF0IjoxNzU3NDMxNzg4LCJleHAiOjQ4MTc2Njk3NDE4OH0.bCQlbE56XEVsHrQVdoQUXImd2bQtFJVc1kTATnMBC6o',
      benefits: ['Clean Energy Generation', 'Employment Creation', 'Technology Advancement', 'Rural Development'],
      methodology: 'Solar Photovoltaic Power Generation',
      projectStart: '2019-01-01',
      projectEnd: '2030-12-31',
      additionalInfo: {
        sdgGoals: [7, 13, 8, 9],
        biodiversityImpact: 'Minimal environmental impact with clean energy production',
        communityBenefit: 'Provides job opportunities to local population',
        technologyUsed: 'Advanced photovoltaic systems'
      },
      coordinates: { lat: 23.2030, lng: 77.4832 }
    },
    {
      id: '6315',
      projectId: '6315',
      name: 'Biomass based power project by Harinagar Sugar Mills Ltd',
      description: 'This project generates electricity by combustion of bagasse, a carbon neutral fuel. A part of the generated electricity is used in the adjacent sugar plant while surplus electricity is exported to the Bihar State Electricity Board.',
      location: 'Harinagar, West Champaran, Bihar',
      country: 'India',
      continent: 'Asia',
      category: 'sustainable-agriculture',
      ngoName: 'Harinagar Sugar Mills Ltd.',
      verified: true,
      certificationStandard: 'CDM',
      pricePerTon: 4.50,
      minPurchase: 1,
      maxPurchase: 500,
      availableTons: 8652,
      totalOffset: 8652,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0000574_biomass-based-power-project-by-harinagar-sugar-mills-ltd.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMDU3NF9iaW9tYXNzLWJhc2VkLXBvd2VyLXByb2plY3QtYnktaGFyaW5hZ2FyLXN1Z2FyLW1pbGxzLWx0ZC5qcGVnIiwiaWF0IjoxNzU3NDMxODUyLCJleHAiOjE3ODg5Njc4NTJ9.mtc87hA6kxJnODWMY7pXTc7b7UNsTUzvZ0OYuBQyAVU',
      benefits: ['Renewable Energy Generation', 'Waste Utilization', 'Job Creation', 'Rural Development'],
      methodology: 'Bagasse Combustion for Power Generation',
      projectStart: '2019-01-01',
      projectEnd: '2029-12-31',
      additionalInfo: {
        sdgGoals: [7, 13, 12, 8],
        biodiversityImpact: 'Utilizes agricultural waste reducing emission of greenhouse gases',
        communityBenefit: 'Employs skilled and unskilled personnel for operation and maintenance',
        technologyUsed: 'Bagasse-fired power generation technology'
      },
      coordinates: { lat: 26.5499, lng: 84.1358 }
    }
  ];

  const navItems = [
    { icon: Home, id: 'dashboard', label: 'Home' },
    { icon: User, id: 'profile', label: 'Profile' },
    {
      icon: Briefcase,
      id: 'services',
      label: 'Services',
      expandable: true,
      children: [
        { icon: Plane, id: 'jets', label: 'Private Jets' },
        { icon: Helicopter, id: 'helicopters', label: 'Helicopters' },
        { icon: Car, id: 'cars', label: 'Luxury Cars' },
        { icon: Ship, id: 'yachts', label: 'Yachts' },
        { icon: Mountain, id: 'adventures', label: 'Adventures' }
      ]
    },
    {
      icon: DollarSign,
      id: 'funds',
      label: 'My Funds',
      expandable: true,
      children: [
        { icon: CreditCard, id: 'accounts', label: 'Accounts' },
        { icon: TrendingUp, id: 'assets', label: 'Assets' },
        { icon: Image, id: 'nfts', label: 'NFTs' },
        { icon: TrendingDown, id: 'staking', label: 'Staking' }
      ]
    },
    {
      icon: Coins,
      id: 'tokenization',
      label: 'Tokenization',
      expandable: true,
      children: [
        { icon: Network, id: 'network', label: 'Network' },
        { icon: UserCheck, id: 'whitelist', label: 'Whitelisted Addresses' },
        { icon: Key, id: 'web3-access', label: 'Web3 Access' },
        { icon: History, id: 'transaction-history', label: 'Transaction History' }
      ]
    },
    {
      icon: ShoppingBag,
      id: 'marketplace',
      label: 'Marketplace',
      expandable: true,
      children: [
        { icon: Image, id: 'nft-marketplace', label: 'NFT Marketplace' },
        { icon: Leaf, id: 'carbon-marketplace', label: 'Carbon Marketplace' }
      ]
    },
    { icon: Leaf, id: 'certificates', label: 'Certificates' },
    { icon: Wallet, id: 'wallet', label: 'Wallet' },
    { icon: Vote, id: 'dao-governance', label: 'DAO Governance' },
    { icon: Plus, id: 'create-dao', label: '+ Create DAO' },
    { icon: Users, id: 'active-dao', label: 'Active DAO' },
    { icon: MapPin, id: 'map', label: 'Map' },
    { icon: MessageSquare, id: 'ai-designer', label: 'AI Designer' },
  ];

  const getPageTitle = () => {
    const titleMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'profile': 'Profile',
      'jets': 'Private Jets',
      'helicopters': 'Helicopter Charter',
      'charter': 'Charter / Private Jets',
      'cars': 'Luxury Cars',
      'yachts': 'Yachts & Boats',
      'adventures': 'Adventure Packages',
      'services': 'Services',
      'funds': 'My Funds',
      'accounts': 'Accounts',
      'assets': 'Assets',
      'nfts': 'NFTs',
      'staking': 'Staking',
      'tokenization': 'Tokenization',
      'network': 'Network',
      'whitelist': 'Whitelisted Addresses',
      'web3-access': 'Web3 Access',
      'transaction-history': 'Transaction History',
      'marketplace': 'Marketplace',
      'nft-marketplace': 'NFT Marketplace',
      'carbon-marketplace': 'Carbon Marketplace',
      'certificates': 'CO2 Certificates',
      'kyc': 'KYC Verification',
      'web3': 'Web3 / Tokenization',
      'map': 'Map & Location',
      'ai-designer': 'AI Travel Designer',
      'settings': 'Settings'
    };
    return titleMap[activeSection] || 'Dashboard';
  };

  const jets = [
    {
      name: 'Gulfstream G650',
      type: 'Heavy Jet',
      passengers: '14-19',
      range: '7,000 nm',
      price: '$8,500',
      image: 'https://images.pexels.com/photos/358319/pexels-photo-358319.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Citation X+',
      type: 'Super Mid',
      passengers: '8-12',
      range: '3,460 nm',
      price: '$4,200',
      image: 'https://images.pexels.com/photos/912050/pexels-photo-912050.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Phenom 300E',
      type: 'Light Jet',
      passengers: '6-9',
      range: '2,010 nm',
      price: '$2,800',
      image: 'https://images.pexels.com/photos/2026324/pexels-photo-2026324.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const helicopters = [
    {
      name: 'AW139',
      type: 'Twin Engine',
      passengers: '8-15',
      range: '573 nm',
      price: '$3,200',
      image: 'https://images.pexels.com/photos/87009/pexels-photo-87009.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Bell 407',
      type: 'Single Engine',
      passengers: '6',
      range: '374 nm',
      price: '$1,800',
      image: 'https://images.pexels.com/photos/2026324/pexels-photo-2026324.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];


  const co2Certificates = [
    {
      id: 'CO2-001',
      project: 'Amazon Rainforest Conservation',
      tons: '25.5',
      price: '$1,275',
      status: 'Active',
      expiry: 'Dec 2025'
    },
    {
      id: 'CO2-002',
      project: 'Wind Farm Development',
      tons: '18.2',
      price: '$910',
      status: 'Active',
      expiry: 'Jan 2026'
    },
    {
      id: 'CO2-003',
      project: 'Reforestation Initiative',
      tons: '32.1',
      price: '$1,605',
      status: 'Pending',
      expiry: 'Mar 2026'
    }
  ];

  const safCertificates = [
    {
      id: 'SAF-001',
      supplier: 'Neste Renewable Diesel',
      gallons: '1,250',
      price: '$6,875',
      status: 'Active',
      expiry: 'Nov 2025'
    },
    {
      id: 'SAF-002',
      supplier: 'BP Sustainable Aviation',
      gallons: '890',
      price: '$4,895',
      status: 'Active',
      expiry: 'Dec 2025'
    }
  ];

  const adventures = [
    {
      name: 'Alpine Ski Experience',
      location: 'Swiss Alps',
      duration: '5 days',
      price: '$12,500',
      image: 'https://images.pexels.com/photos/551524/pexels-photo-551524.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Safari Adventure',
      location: 'Kenya',
      duration: '7 days',
      price: '$18,900',
      image: 'https://images.pexels.com/photos/631317/pexels-photo-631317.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Island Hopping',
      location: 'Maldives',
      duration: '4 days',
      price: '$9,800',
      image: 'https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const yachts = [
    {
      name: 'Ocean Majesty',
      type: 'Super Yacht',
      length: '180 ft',
      guests: '12',
      price: '$25,000',
      image: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Sea Breeze',
      type: 'Motor Yacht',
      length: '120 ft',
      guests: '8',
      price: '$15,000',
      image: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const cars = [
    {
      name: 'Rolls Royce Phantom',
      type: 'Luxury Sedan',
      seats: '4',
      price: '$800',
      image: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Lamborghini Huracán',
      type: 'Sports Car',
      seats: '2',
      price: '$1,200',
      image: 'https://images.pexels.com/photos/544542/pexels-photo-544542.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const transactions = [
    {
      time: '3m ago',
      type: 'Charter',
      send: '2,500 USDT',
      receive: '0.00847 CTK',
      hash: '0xa1b2c3d4...890'
    },
    {
      time: '1h ago',
      type: 'Stake',
      send: '1,000 CTK',
      receive: '12.34% APY',
      hash: '0xe5f6g7h8...123'
    },
    {
      time: '2h ago',
      type: 'CO2 Cert',
      send: '750 USDT',
      receive: '5.2 tons CO2',
      hash: '0xi9j0k1l2...456'
    }
  ];


  const nftBenefits = [
    {
      id: 'NFT-001',
      name: 'Platinum Member',
      image: 'https://images.pexels.com/photos/844297/pexels-photo-844297.jpeg?auto=compress&cs=tinysrgb&w=400',
      benefits: ['Priority Booking', '15% Discount', 'Concierge Service'],
      rarity: 'Legendary'
    },
    {
      id: 'NFT-002',
      name: 'Carbon Neutral Badge',
      image: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=400',
      benefits: ['CO2 Offset Credits', 'Green Flight Priority'],
      rarity: 'Rare'
    }
  ];

  const web3Transactions = [
    {
      hash: '0xa1b2c3d4...890',
      type: 'Token Purchase',
      amount: '1,000 CTK',
      value: '$2,500',
      status: 'Confirmed',
      time: '2 hours ago'
    },
    {
      hash: '0xe5f6g7h8...123',
      type: 'NFT Mint',
      amount: '1 NFT',
      value: '$500',
      status: 'Confirmed',
      time: '1 day ago'
    },
    {
      hash: '0xi9j0k1l2...456',
      type: 'Staking Reward',
      amount: '50 CTK',
      value: '$125',
      status: 'Confirmed',
      time: '3 days ago'
    }
  ];

  const quickSuggestions = [
    'Looking for the most luxurious experience?',
    'Plan a trip to Aspen?',
    'Need the latest SAF?',
    'Want everything planned seamlessly?'
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      setChatHistory([...chatHistory, {
        type: 'user',
        message: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setMessage('');
      
      setTimeout(() => {
        setChatHistory(prev => [...prev, {
          type: 'ai',
          message: 'I\'d be happy to help you with that! Let me suggest some options based on your preferences.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 1000);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-white border border-gray-100 p-8 min-h-[180px] flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extralight text-black mb-2">Global Mobility</h1>
          <p className="text-lg font-light text-gray-600">Web3.0 powered transportation solutions</p>
        </div>
        <div className="text-right">
          <div className="w-16 h-16 bg-black flex items-center justify-center">
            <div className="w-8 h-8 bg-white"></div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          {/* Portfolio Card */}
          <div className="bg-white border border-gray-100 p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-gray-600 text-sm font-light mb-1">Charter Portfolio</h2>
              <div className="flex items-baseline">
                <span className="text-2xl font-light text-gray-900">2,847,392</span>
                <span className="text-lg font-light text-gray-400 ml-2">.45 USD</span>
              </div>
              <div className="flex items-center mt-1">
                <span className="text-sm text-black font-light">+ 4,284.73 USD</span>
                <span className="text-sm text-black font-light ml-2">+ 1.87% ↗</span>
              </div>
            </div>
            
            <button className="px-6 py-3 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors duration-200">
              Book Flight
            </button>
          </div>

          <div className="h-24 mb-4 relative">
            <svg className="w-full h-full" viewBox="0 0 400 96" preserveAspectRatio="none">
              <path
                d="M0,72 Q50,60 100,66 T200,54 T300,42 T400,36"
                stroke="#000"
                strokeWidth="2"
                fill="none"
                className="opacity-80"
              />
              <circle cx="350" cy="39" r="2" fill="#000" />
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center mr-2">
                  <div className="w-2 h-2 bg-white rounded-sm"></div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Charter Tokens</div>
                  <div className="text-xs text-gray-500">847,293.31 CTK</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white text-xs font-bold">$</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">USD Balance</div>
                  <div className="text-xs text-gray-500">1,999,846.28 USD</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-lg font-light text-gray-900 mb-4">Transactions</h3>
          
          <div className="overflow-hidden">
            <div className="grid grid-cols-5 gap-4 pb-3 text-xs font-medium text-gray-500 border-b border-gray-100">
              <div>Time</div>
              <div>Type</div>
              <div>Send</div>
              <div>Receive</div>
              <div>Tx Hash</div>
            </div>
            
            <div className="space-y-3 mt-3">
              {transactions.map((tx, index) => (
                <div key={index} className="grid grid-cols-5 gap-4 items-center py-2">
                  <div className="text-sm text-gray-600">{tx.time}</div>
                  <div className="text-sm font-medium text-gray-900">{tx.type}</div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    {tx.send}
                  </div>
                  <div className="flex items-center text-sm">
                    <span>→</span>
                    <div className="w-2 h-2 bg-orange-500 rounded-full mx-2"></div>
                    {tx.receive}
                  </div>
                  <div className="text-sm text-gray-400 font-mono">
                    {tx.hash}
                    <button className="ml-2 text-gray-600 hover:text-gray-900">↗</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="col-span-4 space-y-3">
        {/* Side Stats */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-light text-gray-600">Active Flights</span>
              <TrendingUp size={14} className="text-green-500" />
            </div>
            <div className="text-xl font-light text-gray-900">12</div>
            <div className="text-xs text-green-600 font-light">+3 this week</div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-light text-gray-600">Empty Legs</span>
              <Plane size={14} className="text-blue-500" />
            </div>
            <div className="text-xl font-light text-gray-900">8</div>
            <div className="text-xs text-blue-600 font-light">Available now</div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-light text-gray-600">CO2 Offset</span>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-xl font-light text-gray-900">247.8</div>
            <div className="text-xs text-green-600 font-light">tons this month</div>
          </div>
        </div>

        {/* Stake Card */}
        <div className="bg-gray-900 rounded-xl p-4 text-white mt-auto">
          <div className="mb-3">
            <h3 className="text-lg font-light mb-1">Stake DAO</h3>
            <p className="text-sm text-gray-400 font-light">Up to 12.34% APY</p>
          </div>
          
          <button className="w-full bg-white text-black py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors duration-200">
            Get started
          </button>
        </div>
      </div>
      </div>

      {/* Recent DAOs Section */}
      {daos.length > 0 && (
        <div className="bg-white border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-light text-gray-900 mb-1">DAO Governance</h2>
              <p className="text-sm text-gray-600">Recent DAOs</p>
            </div>
            <button
              onClick={() => setActiveSection('active-dao')}
              className="text-sm text-black hover:text-gray-700 font-light"
            >
              View all →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {daos.slice(0, 3).map((dao) => (
              <div key={dao.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <img
                    src={dao.imageUrl}
                    alt={dao.name}
                    className="w-12 h-12 rounded-lg object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/48x48?text=DAO';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{dao.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                        dao.status === 'active' ? 'bg-green-100 text-green-800' :
                        dao.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {dao.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{dao.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">By:</span>
                        <span className="font-mono font-medium">{web3Service.formatAddress(dao.creatorWallet)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-500">
                        <span>{dao.membersCount} members</span>
                        <span>{dao.proposalsCount} proposals</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {daos.length === 0 && (
            <div className="text-center py-8">
              <Building2 size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-600 text-sm">No DAOs created yet</p>
              <button
                onClick={() => setActiveSection('create-dao')}
                className="text-sm text-black hover:text-gray-700 font-light mt-2"
              >
                Create first DAO →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderUserDashboard = () => (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-3">
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-3">
              <User size={20} className="text-gray-600" />
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-900">User Dashboard</h3>
              <p className="text-sm text-gray-600">eltesto@gmail.com</p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <p>📍 Sofia, Bulgaria</p>
            <p>🌐 185.94.188.123</p>
          </div>

          {kycStatus === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                KYC under review - we'll notify you within 24 hours
              </p>
            </div>
          )}

          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              Overview
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              My Requests <span className="float-right text-gray-400">31</span>
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              CO2 Certificates
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              Wallet & NFTs
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              KYC Verification
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              Profile Settings
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="col-span-9">
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Member since</div>
            <div className="text-lg font-medium text-gray-900">Jul 2025</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Total Requests</div>
            <div className="text-lg font-medium text-gray-900">31</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">CO2 Requests</div>
            <div className="text-lg font-medium text-gray-900">0</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Certificates</div>
            <div className="text-lg font-medium text-gray-900">0</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <>
            <div className="grid grid-cols-12 gap-4 h-full">
              <div className="col-span-3">
                <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      <User size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900">User Dashboard</h3>
                      <p className="text-sm text-gray-600">eltesto@gmail.com</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>📍 Sofia, Bulgaria</p>
                    <p>🌐 185.94.188.123</p>
                  </div>
                  {kycStatus === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-yellow-800">
                        KYC under review - we'll notify you within 24 hours
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                      Overview
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                      My Requests <span className="float-right text-gray-400">31</span>
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                      CO2 Certificates
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                      Wallet & NFTs
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                      KYC Verification
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                      Profile Settings
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-span-9">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">Member since</div>
                    <div className="text-lg font-medium text-gray-900">Jul 2025</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">Total Requests</div>
                    <div className="text-lg font-medium text-gray-900">31</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">CO2 Requests</div>
                    <div className="text-lg font-medium text-gray-900">0</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">Certificates</div>
                    <div className="text-lg font-medium text-gray-900">0</div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                    <button className="text-sm text-gray-600 hover:text-gray-900">View all</button>
                  </div>
                  <div className="space-y-3">
                    {dashboardUserRequests.slice(0, 6).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <span className="text-lg mr-3">{request.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{request.type}</div>
                            <div className="text-sm text-gray-600">
                              {request.route}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-900">{request.status}</div>
                          <div className="text-xs text-gray-500">{request.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        </div>
      </div>
    </div>
  );



  const renderAIDesigner = () => (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-3">
        <div className="bg-white rounded-xl p-3 shadow-sm h-full">
          <h3 className="text-base font-medium text-gray-900 mb-3">Chat History</h3>
          <div className="space-y-2">
            <div className="p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center mb-1">
                <Plane size={12} className="mr-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Aspen Trip Planning</span>
              </div>
              <p className="text-xs text-gray-600">2 hours ago</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center mb-1">
                <MapPin size={12} className="mr-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Miami Weekend</span>
              </div>
              <p className="text-xs text-gray-600">1 day ago</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center mb-1">
                <Clock size={12} className="mr-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Empty Leg Search</span>
              </div>
              <p className="text-xs text-gray-600">3 days ago</p>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-9">
        <div className="bg-white rounded-xl shadow-sm h-full flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-2">
                <Sparkles size={12} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900">AI Travel Designer</h3>
                <p className="text-sm text-gray-600">Find What Matters, Faster.</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-3 overflow-y-auto">
            <div className="space-y-3 mb-4">
              {chatHistory.map((chat, index) => (
                <div key={index} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    chat.type === 'user' 
                      ? 'bg-black text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{chat.message}</p>
                    <p className={`text-xs mt-1 ${chat.type === 'user' ? 'text-gray-300' : 'text-gray-500'}`}>
                      {chat.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(suggestion)}
                  className="p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <p className="text-sm text-gray-900">{suggestion}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 bg-gray-50 rounded-lg border-none outline-none text-sm font-light placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-gray-200 transition-all duration-200"
              />
              <button
                onClick={handleSendMessage}
                className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors duration-200"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Removed renderWeb3 function - functionality merged into renderWallet with proper global state sync

  const renderCards = (items: any[], type: string) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item: any, index: number) => (
        <div key={index} className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
          <img src={item.image} alt={item.name} className="w-full h-24 object-cover rounded-lg mb-2" />
          <h3 className="text-base font-medium text-gray-900 mb-1">{item.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{item.type || item.location}</p>
          <div className="space-y-1 mb-3">
            {type === 'adventures' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Duration</span>
                <span className="text-gray-900">{item.duration}</span>
              </div>
            )}
            {type === 'yachts' && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Length</span>
                  <span className="text-gray-900">{item.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Guests</span>
                  <span className="text-gray-900">{item.guests}</span>
                </div>
              </>
            )}
            {type === 'cars' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Seats</span>
                <span className="text-gray-900">{item.seats}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-light text-gray-900">{item.price}</span>
              <span className="text-sm text-gray-500 ml-1">
                {type === 'adventures' ? '/person' : type === 'cars' ? '/day' : '/day'}
              </span>
            </div>
            <button className="px-3 py-1 bg-black text-white text-sm font-light rounded-lg hover:bg-gray-800 transition-colors duration-200">
              Book
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmptyLegs = () => {
    const categories = [
      { id: 'all', label: 'All Offers', icon: '✈️' },
      { id: 'featured', label: 'Featured', icon: '⭐' },
      { id: 'europe', label: 'Europe', icon: '🇪🇺' },
      { id: 'usa', label: 'USA', icon: '🇺🇸' },
      { id: 'asia', label: 'Asia', icon: '🌏' },
      { id: 'africa', label: 'Africa', icon: '🌍' }
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Empty Leg Offers</h2>
            <p className="text-sm text-gray-600 mt-1">Discounted flights on return journeys from real database</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEmptyLegsView('grid')}
              className={`p-2 rounded-lg ${emptyLegsView === 'grid' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setEmptyLegsView('list')}
              className={`p-2 rounded-lg ${emptyLegsView === 'list' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setEmptyLegsCategory(category.id)}
                className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                  emptyLegsCategory === category.id
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </nav>
        </div>

      {loadingEmptyLegs ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading empty leg offers...</p>
        </div>
      ) : (
        <>
          {emptyLegOffers.length === 0 ? (
            <div className="text-center py-12">
              <Plane className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Empty Legs Available</h3>
              <p className="text-gray-600">No empty leg offers found for the selected category. Try a different filter.</p>
            </div>
          ) : (
            <div className={emptyLegsView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {emptyLegOffers.map((offer, index) => (
                <div key={offer.id || index} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
                  {/* Offer Image */}
                  {offer.image_url && (
                    <img
                      src={offer.image_url}
                      alt={offer.title}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Plane size={16} className="text-gray-600" />
                      <h3 className="font-medium text-gray-900">{offer.title || `${offer.origin} → ${offer.destination}`}</h3>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Empty Leg
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">Aircraft</span>
                      <p className="font-medium text-gray-900">{offer.aircraft_type}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Category</span>
                      <p className="font-medium text-gray-900">{offer.aircraft_category}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Date</span>
                      <p className="font-medium text-gray-900">{new Date(offer.departure_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration</span>
                      <p className="font-medium text-gray-900">{offer.duration}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Passengers</span>
                      <p className="font-medium text-gray-900">{offer.capacity}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Route</span>
                      <p className="font-medium text-gray-900">{offer.origin} → {offer.destination}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-semibold text-gray-900">{offer.currency}{offer.price}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEmptyLeg(offer);
                        setShowEmptyLegModal(true);
                      }}
                      className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showEmptyLegModal && selectedEmptyLeg && (
        <EmptyLegModal
          isOpen={showEmptyLegModal}
          onClose={() => {
            setShowEmptyLegModal(false);
            setSelectedEmptyLeg(null);
          }}
          emptyLeg={selectedEmptyLeg}
        />
      )}
    </div>
    );
  };

  const renderAdventurePackages = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Adventure Packages</h2>
          <p className="text-sm text-gray-600 mt-1">Curated travel experiences with private aviation</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAdventuresView('grid')}
            className={`p-2 rounded-lg ${adventuresView === 'grid' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setAdventuresView('list')}
            className={`p-2 rounded-lg ${adventuresView === 'list' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {loadingAdventures ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading adventure packages...</p>
        </div>
      ) : (
        <div className={adventuresView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-4'}>
          {adventurePackages.map((adventure, index) => (
            <div key={adventure.id || index} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200">
              {/* Adventure Image */}
              <div className="relative mb-4">
                {adventure.image ? (
                  <img src={adventure.image} alt={adventure.title} className="w-full h-48 object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Mountain size={32} className="text-gray-400" />
                  </div>
                )}
                {adventure.rating && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-white/90 text-gray-800 text-xs font-medium rounded-full flex items-center gap-1">
                    <Star size={10} className="text-yellow-500 fill-current" />
                    {adventure.rating}
                  </span>
                )}
              </div>

              {/* Adventure Details */}
              <div className="mb-4">
                <h3 className="font-bold text-gray-900 mb-1 text-lg">{adventure.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{adventure.category}</p>
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <MapPin size={12} />
                    <span>{adventure.destination}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar size={12} />
                    <span>{adventure.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User size={12} />
                    <span>{adventure.max_guests} max</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Key Features:</p>
                <div className="flex flex-wrap gap-1">
                  {adventure.features?.slice(0, 3).map((feature, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {feature}
                    </span>
                  ))}
                  {adventure.features && adventure.features.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                      +{adventure.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Season & Aircraft */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Plane size={12} />
                    <span>{adventure.aircraft_type}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar size={12} />
                    <span>{adventure.season}</span>
                  </div>
                </div>
              </div>

              {/* Pricing and Book Button */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-left">
                    <div className="text-lg font-bold text-gray-900">€{adventure.price_per_person}</div>
                    <div className="text-xs text-gray-500">per person</div>
                    {adventure.next_departure && (
                      <div className="text-xs text-gray-400">Next: {adventure.next_departure}</div>
                    )}
                  </div>
                  <button
                    onClick={() => addToBasket({
                      type: 'adventure',
                      name: adventure.title,
                      category: adventure.category,
                      price: adventure.price_per_person,
                      duration: adventure.duration,
                      location: adventure.destination,
                      image: adventure.image,
                      max_guests: adventure.max_guests,
                      features: adventure.features,
                      includes: adventure.includes,
                      season: adventure.season
                    })}
                    className="p-2 border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
                    title="Add to basket"
                  >
                    <ShoppingBag size={16} className="text-gray-600" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    setSelectedAdventure(adventure);
                    setShowFixedOfferModal(true);
                  }}
                  className="w-full px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors transform hover:scale-105"
                >
                  View Details & Book
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showFixedOfferModal && selectedAdventure && (
        <FixedOfferModal
          isOpen={showFixedOfferModal}
          onClose={() => {
            setShowFixedOfferModal(false);
            setSelectedAdventure(null);
          }}
          offer={selectedAdventure}
        />
      )}
    </div>
  );

  const renderHelicopterCharter = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Helicopter Charter</h2>
          <p className="text-sm text-gray-600 mt-1">Premium helicopter services for short-distance travel</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {helicopters.map((helicopter, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                  <Helicopter size={24} className="text-gray-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{helicopter.name}</h3>
                  <p className="text-sm text-gray-600">{helicopter.category}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Available
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Passengers</span>
                <span className="text-gray-900">{helicopter.passengers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Range</span>
                <span className="text-gray-900">{helicopter.range}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Speed</span>
                <span className="text-gray-900">{helicopter.speed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Flight Time</span>
                <span className="text-gray-900">{helicopter.flightTime}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div>
                <span className="text-xl font-bold text-gray-900">{helicopter.pricePerHour}</span>
                <span className="text-sm text-gray-500 ml-1">/hour</span>
              </div>
              <button
                onClick={() => addToBasket({
                  type: 'helicopter',
                  name: helicopter.name,
                  category: helicopter.category,
                  price: helicopter.pricePerHour,
                  passengers: helicopter.passengers,
                  range: helicopter.range,
                  speed: helicopter.speed,
                  flightTime: helicopter.flightTime
                })}
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Add to Basket
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLuxuryCars = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Luxury Cars</h2>
          <p className="text-sm text-gray-600 mt-1">Premium ground transportation services</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCarsView('grid')}
            className={`p-2 rounded-lg ${carsView === 'grid' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setCarsView('list')}
            className={`p-2 rounded-lg ${carsView === 'list' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {carsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading luxury cars...</p>
        </div>
      ) : luxuryCars.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
          <Car className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No luxury cars available</p>
          <p className="text-sm text-gray-500 mt-1">
            Check back later for premium vehicle options
          </p>
          <p className="text-xs text-gray-400 mt-2">Debug: luxuryCars array length = {luxuryCars.length}</p>
        </div>
      ) : (
        <div className={carsView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-4'}>
          {luxuryCars.map((car, index) => (
            <div key={car.id || index} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200">
              {/* Car Image */}
              <div className="relative mb-4">
                {car.image ? (
                  <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-full h-48 object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Car size={32} className="text-gray-400" />
                  </div>
                )}
                {car.fuel_type === 'Electric' && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Electric
                  </span>
                )}
              </div>

              {/* Car Details */}
              <div className="mb-4">
                <h3 className="font-bold text-gray-900 mb-1 text-lg">{car.brand} {car.model}</h3>
                <p className="text-sm text-gray-600 mb-2">{car.category}</p>
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar size={12} />
                    <span>{car.year}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User size={12} />
                    <span>{car.passengers} seats</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Car size={12} />
                    <span>{car.transmission?.replace('Automatic', 'Auto') || 'Auto'}</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Key Features:</p>
                <div className="flex flex-wrap gap-1">
                  {car.features?.slice(0, 3).map((feature, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {feature}
                    </span>
                  ))}
                  {car.features && car.features.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                      +{car.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="mb-4">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <MapPin size={12} />
                  <span>{car.location || 'Multiple locations'}</span>
                </div>
              </div>

              {/* Pricing and Book Button */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-left">
                    <div className="text-lg font-bold text-gray-900">€{car.price_per_hour}</div>
                    <div className="text-xs text-gray-500">per hour</div>
                    {car.price_per_day && (
                      <div className="text-xs text-gray-400">€{car.price_per_day}/day</div>
                    )}
                  </div>
                  <button
                    onClick={() => addToBasket({
                      type: 'luxury-car',
                      name: `${car.brand} ${car.model}`,
                      category: car.category,
                      price: car.price_per_hour,
                      duration: 'hourly',
                      location: car.location,
                      image: car.image,
                      year: car.year,
                      passengers: car.passengers,
                      features: car.features
                    })}
                    className="p-2 border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
                    title="Add to basket"
                  >
                    <ShoppingBag size={16} className="text-gray-600" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    setSelectedCar(car);
                    setShowLuxuryCarModal(true);
                  }}
                  className="w-full px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors transform hover:scale-105"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showLuxuryCarModal && selectedCar && (
        <LuxuryCarModal
          isOpen={showLuxuryCarModal}
          onClose={() => {
            setShowLuxuryCarModal(false);
            setSelectedCar(null);
          }}
          car={selectedCar}
        />
      )}
    </div>
  );

  // Jet categories - sorted by size with realistic market pricing (from UnifiedBookingFlow)
  const jetCategories = [
    {
      id: 'very-light',
      name: 'Very Light Jet',
      description: 'Compact and efficient',
      capacity: 4,
      range: 1500,
      speed: 650,
      pricePerHour: 4300,
      co2PerHour: 0.8,
      co2OffsetPerHour: 64,
      imageLink: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/mustang_lenght_BV_0.png',
      examples: ['Embraer Phenom 100', 'Cessna Citation Mustang', 'HondaJet']
    },
    {
      id: 'light',
      name: 'Light Jet',
      description: 'Perfect balance',
      capacity: 6,
      range: 2500,
      speed: 750,
      pricePerHour: 5100,
      co2PerHour: 1.2,
      co2OffsetPerHour: 96,
      imageLink: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/mustang_lenght_BV_0.png',
      examples: ['Embraer Phenom 300', 'Cessna Citation CJ4', 'Learjet 75']
    },
    {
      id: 'mid-size',
      name: 'Mid-Size Jet',
      description: 'Comfort & performance',
      capacity: 8,
      range: 3500,
      speed: 850,
      pricePerHour: 7200,
      co2PerHour: 1.8,
      co2OffsetPerHour: 144,
      imageLink: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/mustang_lenght_BV_0.png',
      examples: ['Hawker 850XP', 'Cessna Citation XLS+', 'Learjet 60XR']
    },
    {
      id: 'super-mid',
      name: 'Super Mid-Size',
      description: 'Premium comfort',
      capacity: 9,
      range: 4500,
      speed: 900,
      pricePerHour: 8800,
      co2PerHour: 2.2,
      co2OffsetPerHour: 176,
      imageLink: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/mustang_lenght_BV_0.png',
      examples: ['Cessna Citation X+', 'Hawker 4000', 'Gulfstream G200']
    },
    {
      id: 'heavy',
      name: 'Heavy Jet',
      description: 'Ultimate luxury',
      capacity: 12,
      range: 6500,
      speed: 950,
      pricePerHour: 12500,
      co2PerHour: 3.1,
      co2OffsetPerHour: 248,
      imageLink: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/mustang_lenght_BV_0.png',
      examples: ['Gulfstream G450', 'Bombardier Challenger 605', 'Falcon 2000']
    },
    {
      id: 'ultra-long',
      name: 'Ultra Long Range',
      description: 'Global reach',
      capacity: 16,
      range: 8000,
      speed: 950,
      pricePerHour: 15800,
      co2PerHour: 3.8,
      co2OffsetPerHour: 304,
      imageLink: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/mustang_lenght_BV_0.png',
      examples: ['Gulfstream G650', 'Bombardier Global 7500', 'Falcon 7X']
    }
  ];

  // Helicopter categories - Commercial charter helicopters with realistic specifications (from UnifiedBookingFlow)
  const helicopterCategories = [
    {
      id: 'robinson-r44',
      name: 'Robinson R44',
      description: 'Light single engine',
      capacity: 3,
      range: 600,
      speed: 185,
      pricePerHour: 2800,
      co2PerHour: 0.4,
      co2OffsetPerHour: 32,
      maxFlightTime: 70, // 1h 10min
      maxDistance: 216, // km - based on 70min at 185 km/h
      imageLink: 'https://example.com/images/robinson-r44.jpg'
    },
    {
      id: 'airbus-h125',
      name: 'Airbus H125',
      description: 'Versatile single engine',
      capacity: 5,
      range: 700,
      speed: 220,
      pricePerHour: 4200,
      co2PerHour: 0.6,
      co2OffsetPerHour: 48,
      maxFlightTime: 70,
      maxDistance: 257, // km - based on 70min at 220 km/h
      imageLink: 'https://example.com/images/airbus-h125.jpg'
    },
    {
      id: 'airbus-h135',
      name: 'Airbus H135',
      description: 'Twin engine comfort',
      capacity: 6,
      range: 650,
      speed: 230,
      pricePerHour: 5800,
      co2PerHour: 0.8,
      co2OffsetPerHour: 64,
      maxFlightTime: 70,
      maxDistance: 268, // km - based on 70min at 230 km/h
      imageLink: 'https://example.com/images/airbus-h135.jpg'
    },
    {
      id: 'leonardo-aw109',
      name: 'Leonardo AW109',
      description: 'Luxury twin engine',
      capacity: 7,
      range: 800,
      speed: 240,
      pricePerHour: 7200,
      co2PerHour: 1.0,
      co2OffsetPerHour: 80,
      maxFlightTime: 70,
      maxDistance: 280, // km - based on 70min at 240 km/h
      imageLink: 'https://example.com/images/leonardo-aw109.jpg'
    }
  ];

  // Aviation-focused services for flight details page (from UnifiedBookingFlow)
  const aviationServices = [
    { id: 'catering', name: 'Catering', icon: Utensils, desc: 'Gourmet in-flight dining. Hot catering available for light jets and above.' },
    { id: 'flowers', name: 'Flower Arrangements', icon: Flower, desc: 'Premium bouquets' },
    { id: 'wine', name: 'Wine & Spirits', icon: Wine, desc: 'Curated wine selection' },
    { id: 'medical', name: 'Medical Assistance', icon: Stethoscope, desc: 'Medical support' },
    { id: 'transport-assist', name: 'Transport Assistance', icon: UserCheck, desc: 'Special transport help' },
    { id: 'accessibility', name: 'Accessibility Services', icon: Accessibility, desc: 'Mobility assistance' },
    { id: 'pet-care', name: 'Pet Care', icon: Dog, desc: 'Professional pet care' },
  ];

  // Luxury lifestyle services (from UnifiedBookingFlow)
  const luxuryServices = [
    { id: 'car', name: 'Luxury Car Rental', desc: 'Premium vehicles at destination', image: '🚗' },
    { id: 'yacht', name: 'Yacht Charter', desc: 'Luxury yacht experiences', image: '🛥️' },
    { id: 'ground', name: 'Ground Transportation', desc: 'VIP transfers', image: '🚕', nftFree: true },
    { id: 'concierge', name: 'Concierge Service', desc: '24/7 personal assistance', image: '🤝' },
    { id: 'helicopter', name: 'Helicopter Charter', desc: 'City transfers by helicopter', image: '🚁' },
    { id: 'butler', name: 'Butler Service', desc: 'Personal attendant onboard', image: '🛎️' },
    { id: 'photo', name: 'Professional Photography', desc: 'Travel photographer', image: '📸' },
    { id: 'events', name: 'Event Planning', desc: 'Special occasion arrangements', image: '🎉' },
    { id: 'accommodation', name: 'Luxury Hotels', desc: '5-star hotel bookings', image: '🏨' },
    { id: 'entertainment', name: 'Entertainment', desc: 'Live music & performances', image: '🎤' },
  ];

  // Payment methods (from UnifiedBookingFlow)
  const paymentMethods = [
    { id: 'bank', name: 'Bank Transfer', icon: Building2, fee: 0 },
    { id: 'card', name: 'Credit Card', icon: CreditCard, fee: 2.9 },
    { id: 'crypto', name: 'Cryptocurrency', icon: Bitcoin, fee: 1.5 }
  ];

  // Complete UnifiedBookingFlow integrated for Private Jet Charter
  const renderPrivateJetCharter = () => {
    // All UnifiedBookingFlow state and logic
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [selectedAviationServices, setSelectedAviationServices] = useState<string[]>([]);
    const [selectedLuxuryServices, setSelectedLuxuryServices] = useState<string[]>([]);
    // walletAddress now comes from global Wagmi state (globalAddress)
    const [discountPercent, setDiscountPercent] = useState(0);
    const [nftBenefits, setNftBenefits] = useState<string[]>([]);
    const [showSameAirportPopup, setShowSameAirportPopup] = useState(false);
    const [showLoginRequired, setShowLoginRequired] = useState(false);
    // Use global wallet state from parent component
    const { address: globalAddress, isConnected: globalIsConnected } = useAccount();
    const { open: openWalletModal } = useAppKit();

    // Flight Details State
    const [originInput, setOriginInput] = useState('');
    const [destInput, setDestInput] = useState('');
    const [origin, setOrigin] = useState<AirportSearchResult | null>(null);
    const [destination, setDestination] = useState<AirportSearchResult | null>(null);
    const [selectedVehicleType, setSelectedVehicleType] = useState<'private-jet' | 'helicopter'>('private-jet');
    const [departureDate, setDepartureDate] = useState<Date | null>(null);
    const [departureTime, setDepartureTime] = useState('10:00');
    const [passengers, setPassengers] = useState(1);
    const [luggage, setLuggage] = useState(1);
    const [pets, setPets] = useState(0);

    const [showOriginDropdown, setShowOriginDropdown] = useState(false);
    const [showDestDropdown, setShowDestDropdown] = useState(false);
    const [originAirports, setOriginAirports] = useState<AirportSearchResult[]>([]);
    const [destAirports, setDestAirports] = useState<AirportSearchResult[]>([]);
    const [isLoadingOriginAirports, setIsLoadingOriginAirports] = useState(false);
    const [isLoadingDestAirports, setIsLoadingDestAirports] = useState(false);

    const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);

    // Other states from UnifiedBookingFlow
    const [selectedJet, setSelectedJet] = useState<any | null>(null);
    const [selectedHelicopter, setSelectedHelicopter] = useState<any | null>(null);
    const [carbonOption, setCarbonOption] = useState('none');
    const [selectedPayment, setSelectedPayment] = useState('bank');
    const [contact, setContact] = useState({
      name: '',
      email: '',
      phone: '',
      company: ''
    });

    const steps = [
      { id: 'details', label: 'Flight Details' },
      { id: 'aircraft', label: selectedVehicleType === 'helicopter' ? 'Helicopter' : 'Aircraft' },
      { id: 'services', label: 'Services' },
      { id: 'carbon', label: 'Carbon' },
      { id: 'summary', label: 'Review' },
    ];

    // Airport search functions from UnifiedBookingFlow
    const searchOriginAirports = async (query: string) => {
      setIsLoadingOriginAirports(true);
      try {
        const results = await airportsStaticService.searchAirports(query);
        setOriginAirports(results);
      } catch (error) {
        console.error('Error searching origin airports:', error);
        setOriginAirports([]);
      } finally {
        setIsLoadingOriginAirports(false);
      }
    };

    const searchDestAirports = async (query: string) => {
      setIsLoadingDestAirports(true);
      try {
        const results = await airportsStaticService.searchAirports(query);
        setDestAirports(results);
      } catch (error) {
        console.error('Error searching destination airports:', error);
        setDestAirports([]);
      } finally {
        setIsLoadingDestAirports(false);
      }
    };

    const handleOriginInputChange = (value: string) => {
      setOriginInput(value);
      if (value.length >= 2) {
        searchOriginAirports(value);
        setShowOriginDropdown(true);
      } else {
        setShowOriginDropdown(false);
      }
    };

    const handleDestInputChange = (value: string) => {
      setDestInput(value);
      if (value.length >= 2) {
        searchDestAirports(value);
        setShowDestDropdown(true);
      } else {
        setShowDestDropdown(false);
      }
    };

    const selectOriginAirport = (airport: AirportSearchResult) => {
      setOrigin(airport);
      setOriginInput(`${airport.name} (${airport.code})`);
      setShowOriginDropdown(false);
    };

    const selectDestAirport = (airport: AirportSearchResult) => {
      setDestination(airport);
      setDestInput(`${airport.name} (${airport.code})`);
      setShowDestDropdown(false);
    };

    const calculateTotalPrice = () => {
      const basePrice = selectedJet?.pricePerHour || selectedHelicopter?.pricePerHour || 0;
      const flightTime = 2; // Default flight time
      const subtotal = basePrice * flightTime;
      const discount = subtotal * (discountPercent / 100);
      return Math.max(0, subtotal - discount);
    };

    const handleFormSubmit = async () => {
      if (!isAuthenticated) {
        setShowLoginRequired(true);
        return;
      }

      setIsSubmittingBooking(true);
      setBookingError(null);

      try {
        const formData: BookingFormData = {
          origin,
          destination,
          departureDate,
          departureTime,
          passengers,
          luggage,
          pets,
          selectedJet: selectedJet || selectedHelicopter,
          selectedAviationServices,
          selectedLuxuryServices,
          carbonOption: carbonOption as 'none' | 'full',
          walletAddress: globalAddress || '',
          selectedPayment: selectedPayment as 'bank' | 'card' | 'crypto',
          contact,
          totalPrice: calculateTotalPrice(),
          discountPercent
        };

        const { data, error } = await bookingService.createBookingRequest(formData);

        if (error) {
          setBookingError(error.message || 'Failed to submit booking request');
        } else {
          setIsComplete(true);
          setCurrentStep(steps.length - 1);
        }
      } catch (error) {
        setBookingError('An unexpected error occurred');
        console.error('Booking submission error:', error);
      } finally {
        setIsSubmittingBooking(false);
      }
    };

    const renderStepContent = () => {
      const currentStepData = steps[currentStep];

      switch (currentStepData?.id) {
        case 'details':
          return (
            <FlightDetailsStep
              origin={origin}
              destination={destination}
              originInput={originInput}
              destInput={destInput}
              showOriginDropdown={showOriginDropdown}
              showDestDropdown={showDestDropdown}
              originAirports={originAirports}
              destAirports={destAirports}
              isLoadingOriginAirports={isLoadingOriginAirports}
              isLoadingDestAirports={isLoadingDestAirports}
              departureDate={departureDate}
              departureTime={departureTime}
              passengers={passengers}
              luggage={luggage}
              pets={pets}
              selectedVehicleType={selectedVehicleType}
              onOriginInputChange={handleOriginInputChange}
              onDestInputChange={handleDestInputChange}
              onOriginSelect={selectOriginAirport}
              onDestSelect={selectDestAirport}
              onDepartureDateChange={setDepartureDate}
              onDepartureTimeChange={setDepartureTime}
              onPassengersChange={setPassengers}
              onLuggageChange={setLuggage}
              onPetsChange={setPets}
              onVehicleTypeChange={setSelectedVehicleType}
              setShowOriginDropdown={setShowOriginDropdown}
              setShowDestDropdown={setShowDestDropdown}
            />
          );

        case 'aircraft':
          return (
            <AircraftSelectionStep
              selectedVehicleType={selectedVehicleType}
              selectedJet={selectedJet}
              selectedHelicopter={selectedHelicopter}
              jetCategories={jetCategories}
              helicopterCategories={helicopterCategories}
              onJetSelect={setSelectedJet}
              onHelicopterSelect={setSelectedHelicopter}
            />
          );

        case 'services':
          return (
            <ServicesStep
              selectedAviationServices={selectedAviationServices}
              selectedLuxuryServices={selectedLuxuryServices}
              aviationServices={aviationServices}
              luxuryServices={luxuryServices}
              nftBenefits={nftBenefits}
              onAviationServicesChange={setSelectedAviationServices}
              onLuxuryServicesChange={setSelectedLuxuryServices}
            />
          );

        case 'carbon':
          return (
            <CarbonOffsetStep
              carbonOption={carbonOption}
              walletAddress={globalAddress || ''}
              onCarbonOptionChange={setCarbonOption}
              onWalletAddressChange={(addr) => {
                // Address is managed by wallet connection, not local state
                console.log('Wallet address managed globally:', addr);
              }}
              isConnected={globalIsConnected}
              onConnect={() => setShowWalletModal(true)}
            />
          );

        case 'summary':
          return (
            <BookingSummaryStep
              origin={origin}
              destination={destination}
              departureDate={departureDate}
              departureTime={departureTime}
              passengers={passengers}
              luggage={luggage}
              pets={pets}
              selectedJet={selectedJet || selectedHelicopter}
              selectedAviationServices={selectedAviationServices}
              selectedLuxuryServices={selectedLuxuryServices}
              aviationServices={aviationServices}
              luxuryServices={luxuryServices}
              paymentMethods={paymentMethods}
              carbonOption={carbonOption}
              selectedPayment={selectedPayment}
              contact={contact}
              totalPrice={calculateTotalPrice()}
              discountPercent={discountPercent}
              onPaymentChange={setSelectedPayment}
              onContactChange={setContact}
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmittingBooking}
              error={bookingError}
            />
          );

        default:
          return <div>Invalid step</div>;
      }
    };

    return (
      <div className="h-full overflow-y-auto">
        <div className="space-y-6">
          {/* Header with Vehicle Type Selector */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {selectedVehicleType === 'helicopter' ? 'Helicopter Charter' : 'Private Jet Charter'}
            </h2>
            <p className="text-gray-600 mb-4">Book your private aviation experience</p>

            {/* Vehicle Type Toggle */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 rounded-xl p-1 inline-flex">
                <button
                  onClick={() => setSelectedVehicleType('private-jet')}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedVehicleType === 'private-jet'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Plane className="w-4 h-4 inline mr-2" />
                  Private Jet
                </button>
                <button
                  onClick={() => setSelectedVehicleType('helicopter')}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedVehicleType === 'helicopter'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Helicopter className="w-4 h-4 inline mr-2" />
                  Helicopter
                </button>
              </div>
            </div>
          </div>

          {/* Quick Airport Inputs - Like main page */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={originInput}
                    onChange={(e) => handleOriginInputChange(e.target.value)}
                    placeholder="Airport or city"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>
                {showOriginDropdown && originAirports.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {originAirports.map((airport, index) => (
                      <button
                        key={index}
                        onClick={() => selectOriginAirport(airport)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{airport.name}</div>
                        <div className="text-sm text-gray-600">{airport.code} • {airport.city}, {airport.country}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={destInput}
                    onChange={(e) => handleDestInputChange(e.target.value)}
                    placeholder="Airport or city"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>
                {showDestDropdown && destAirports.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {destAirports.map((airport, index) => (
                      <button
                        key={index}
                        onClick={() => selectDestAirport(airport)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{airport.name}</div>
                        <div className="text-sm text-gray-600">{airport.code} • {airport.city}, {airport.country}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                if (!origin || !destination) {
                  alert('Please select both origin and destination airports');
                  return;
                }
                setIsModalOpen(true);
              }}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
            >
              {selectedVehicleType === 'helicopter' ? <Helicopter size={16} /> : <Plane size={16} />}
              <span>Start {selectedVehicleType === 'helicopter' ? 'Helicopter' : 'Jet'} Booking</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Booking Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Book Your Flight</h2>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <BookingProgress steps={steps} currentStep={currentStep} />
                  </div>
                </div>

                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                  {renderStepContent()}
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <ChevronLeft size={16} />
                    <span>Back</span>
                  </button>

                  {currentStep < steps.length - 1 && (
                    <button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
                    >
                      <span>Next</span>
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Login Required Popup */}
          {showLoginRequired && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserCheck className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Login Required</h3>
                  <p className="text-gray-600">
                    You must be logged in to submit a booking request. Please sign in or create an account to continue.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLoginRequired(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowLoginRequired(false);
                      // You would redirect to login page here
                      window.location.href = '/login';
                    }}
                    className="flex-1 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // CO2 Carbon Certificates Management - Customized for SaaSDashboard
  const renderCertificates = () => {
    const [formData, setFormData] = useState({
      departureAirport: '',
      destinationAirport: '',
      flightDate: '',
      aircraftType: '',
      passengers: '',
      flightDuration: '',
      offsetPercentage: '100',
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      agreedToTerms: false
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');

    // Featured certificates data for "Recently Issued" section
    const recentCertificates = [
      {
        id: '1',
        route: 'TETERBORO → ASPEN',
        aircraft: 'Gulfstream G650',
        emissions: '4.2 tCO₂',
        date: '2024-01-15',
        nftId: 'PJC001',
        status: 'retired',
        projectName: 'Rainforest Protection Initiative',
        clientName: 'Private Client'
      },
      {
        id: '2',
        route: 'VAN NUYS → JACKSON HOLE',
        aircraft: 'Bombardier Global 7500',
        emissions: '3.8 tCO₂',
        date: '2024-01-20',
        nftId: 'PJC002',
        status: 'retired',
        projectName: 'Wind Farm Development',
        clientName: 'Private Client'
      },
      {
        id: '3',
        route: 'NICE → GENEVA',
        aircraft: 'Citation X+',
        emissions: '1.2 tCO₂',
        date: '2024-01-22',
        nftId: 'PJC003',
        status: 'retired',
        projectName: 'Solar Energy Initiative',
        clientName: 'Private Client'
      }
    ];

    const handleSubmit = async () => {
      setIsSubmitting(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setSubmitMessage('Certificate request submitted successfully! You will receive confirmation via email.');
        setFormData({
          departureAirport: '',
          destinationAirport: '',
          flightDate: '',
          aircraftType: '',
          passengers: '',
          flightDuration: '',
          offsetPercentage: '100',
          companyName: '',
          contactName: '',
          email: '',
          phone: '',
          agreedToTerms: false
        });
      } catch (error) {
        setSubmitMessage('Error submitting request. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="space-y-8">
        {/* CO2 Certificate Request Form */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-light text-gray-900">CO₂ Certificate Request</h2>
              <p className="text-sm text-gray-600">Request carbon offset certificates for your flights</p>
            </div>
          </div>

          {submitMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 text-sm">{submitMessage}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Departure Airport</label>
              <input
                type="text"
                value={formData.departureAirport}
                onChange={(e) => setFormData({...formData, departureAirport: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                placeholder="e.g., KTEB (Teterboro)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Destination Airport</label>
              <input
                type="text"
                value={formData.destinationAirport}
                onChange={(e) => setFormData({...formData, destinationAirport: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                placeholder="e.g., KASE (Aspen)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Flight Date</label>
              <input
                type="date"
                value={formData.flightDate}
                onChange={(e) => setFormData({...formData, flightDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Aircraft Type</label>
              <select
                value={formData.aircraftType}
                onChange={(e) => setFormData({...formData, aircraftType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
              >
                <option value="">Select Aircraft</option>
                <option value="Very Light Jet">Very Light Jet</option>
                <option value="Light Jet">Light Jet</option>
                <option value="Mid-Size Jet">Mid-Size Jet</option>
                <option value="Super Mid-Size Jet">Super Mid-Size Jet</option>
                <option value="Heavy Jet">Heavy Jet</option>
                <option value="Ultra Long Range">Ultra Long Range</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Passengers</label>
              <input
                type="number"
                value={formData.passengers}
                onChange={(e) => setFormData({...formData, passengers: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                placeholder="Number of passengers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Flight Duration (hours)</label>
              <input
                type="number"
                step="0.1"
                value={formData.flightDuration}
                onChange={(e) => setFormData({...formData, flightDuration: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                placeholder="e.g., 2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                placeholder="Your company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.agreedToTerms}
                onChange={(e) => setFormData({...formData, agreedToTerms: e.target.checked})}
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
              />
              <span className="text-sm text-gray-700">I agree to the terms and conditions</span>
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!formData.agreedToTerms || isSubmitting}
            className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting Request...</span>
              </>
            ) : (
              'Submit Certificate Request'
            )}
          </button>
        </div>

        {/* Recently Issued Certificates */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-light text-gray-900">Recently Issued Certificates</h2>
              <p className="text-sm text-gray-600">Latest CO₂ certificates issued by all users</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentCertificates.map((cert) => (
              <div key={cert.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono text-gray-500">#{cert.nftId}</span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    RETIRED
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1 text-sm">{cert.route}</h3>
                <p className="text-xs text-gray-600 mb-2">{cert.aircraft}</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-green-600">{cert.emissions}</span>
                  <span className="text-gray-500">{new Date(cert.date).toLocaleDateString()}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600">{cert.projectName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };


  // Profile section render functions
  const renderOverview = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Account Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="font-medium text-gray-900 mb-2">Total Bookings</h4>
          <p className="text-2xl font-semibold text-gray-900">{dashboardUserRequests?.length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="font-medium text-gray-900 mb-2">Account Status</h4>
          <p className="text-lg text-green-600">{kycStatus === 'verified' ? 'Verified' : 'Pending Verification'}</p>
        </div>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Booking Requests</h3>
      <div className="space-y-4">
        {dashboardUserRequests && dashboardUserRequests.length > 0 ? (
          dashboardUserRequests.map((request: any, index: number) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{request.origin_airport_code} → {request.destination_airport_code}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  request.status === 'approved' ? 'bg-green-100 text-green-800' :
                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {request.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">Date: {request.departure_date}</p>
              <p className="text-sm text-gray-600">Passengers: {request.passengers}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No booking requests found.</p>
          </div>
        )}
      </div>
    </div>
  );


  const renderWallet = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8">
            {/* Wallet Status */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-1">Wallet</h2>
                  <p className="text-sm text-gray-600">Manage your Web3 wallet and digital assets</p>
                </div>
                <div className="relative">
                  <button className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    isConnected
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-gray-50 text-gray-600 border border-gray-200'
                  }`}>
                    <Wallet size={16} />
                    {isConnected && address ? web3Service.formatAddress(address) : 'Not Connected'}
                  </button>
                  {/* Connection indicator dot */}
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    isConnected ? 'bg-green-500' : 'bg-orange-500'
                  }`}></div>
                </div>
              </div>

              {isConnected && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600">
                    Network: <span className="font-medium text-gray-900">{chain?.name || 'Unknown'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h3>
              <div className="space-y-3">
                {isConnected ? (
                  web3Transactions.map((tx, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{tx.type}</div>
                        <div className="text-xs text-gray-600 font-mono">{tx.hash}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{tx.amount}</div>
                        <div className="text-xs text-gray-600">{tx.value}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">{tx.status}</div>
                        <div className="text-xs text-gray-600">{tx.time}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Wallet size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Connect your wallet to view transaction history</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-4 space-y-4">
            {/* Token Swap */}
            <TokenSwap />

            {/* Token Balance */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Token Balance</h3>
              {isConnected ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-black rounded-full mr-2"></div>
                      <span className="text-sm font-medium">CTK</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">1,250</div>
                      <div className="text-xs text-gray-600">$3,125</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium">ETH</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">0.5</div>
                      <div className="text-xs text-gray-600">$1,500</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Coins size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Connect wallet to view balances</p>
                </div>
              )}
            </div>

            {/* NFT Benefits */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-3">NFT Benefits</h3>
              {isConnected ? (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 text-sm">NFT Benefits System</h5>
                      <p className="text-xs text-gray-600 mt-1">
                        Automatic detection of NFTs for exclusive benefits including discounts, free flights, and priority booking.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Gift size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Connect wallet to check NFT benefits</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // DAO Creation Functions
  const renderCreateDAO = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      category: '',
      tokenSymbol: '',
      totalSupply: '',
      imageUrl: '',
      website: '',
      twitter: '',
      discord: '',
      telegram: ''
    });
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateDAO = async () => {
      if (!isConnected || !address) {
        alert('Please connect your wallet to create a DAO');
        return;
      }

      if (!formData.name || !formData.description || !formData.category || !formData.tokenSymbol) {
        alert('Please fill in all required fields');
        return;
      }

      setIsCreating(true);

      try {
        const newDAO: DAO = {
          id: `dao-${Date.now()}`,
          name: formData.name,
          description: formData.description,
          creator: user?.email || 'Anonymous',
          creatorWallet: address,
          imageUrl: formData.imageUrl || 'https://via.placeholder.com/400x300?text=DAO+Image',
          category: formData.category,
          tokenSymbol: formData.tokenSymbol.toUpperCase(),
          totalSupply: formData.totalSupply || '1000000',
          votingPower: '0',
          treasuryValue: '0',
          membersCount: 1,
          proposalsCount: 0,
          createdAt: new Date(),
          status: 'active',
          website: formData.website,
          socialLinks: {
            twitter: formData.twitter,
            discord: formData.discord,
            telegram: formData.telegram
          }
        };

        // Add to local state (in production, this would go to backend/blockchain)
        setDaos(prevDaos => [newDAO, ...prevDaos]);

        // Reset form
        setFormData({
          name: '',
          description: '',
          category: '',
          tokenSymbol: '',
          totalSupply: '',
          imageUrl: '',
          website: '',
          twitter: '',
          discord: '',
          telegram: ''
        });

        alert('DAO created successfully!');
      } catch (error) {
        console.error('Error creating DAO:', error);
        alert('Error creating DAO. Please try again.');
      } finally {
        setIsCreating(false);
      }
    };

    if (!isConnected) {
      return (
        <div className="space-y-6">
          <div className="text-center py-12">
            <Wallet size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">You need to connect your wallet to create a DAO</p>
            <button
              onClick={() => setShowWalletModal(true)}
              className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New DAO</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">DAO Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter DAO name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Describe your DAO's purpose and goals"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Select category</option>
                  <option value="DeFi">DeFi & Finance</option>
                  <option value="Gaming">Gaming & NFTs</option>
                  <option value="Social">Social & Community</option>
                  <option value="Investment">Investment & Ventures</option>
                  <option value="Protocol">Protocol Governance</option>
                  <option value="Charity">Charity & Social Impact</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {/* Token & Technical Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Token Details</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Token Symbol *</label>
                <input
                  type="text"
                  value={formData.tokenSymbol}
                  onChange={(e) => setFormData({...formData, tokenSymbol: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="TOKEN"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Supply</label>
                <input
                  type="number"
                  value={formData.totalSupply}
                  onChange={(e) => setFormData({...formData, totalSupply: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="1000000"
                />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mt-6">Social Links</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="https://yourdao.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                <input
                  type="text"
                  value={formData.twitter}
                  onChange={(e) => setFormData({...formData, twitter: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="@yourdao"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discord</label>
                <input
                  type="url"
                  value={formData.discord}
                  onChange={(e) => setFormData({...formData, discord: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="https://discord.gg/..."
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Creating as: <span className="font-mono font-medium">{web3Service.formatAddress(address)}</span>
            </div>
            <button
              onClick={handleCreateDAO}
              disabled={isCreating || !formData.name || !formData.description || !formData.category || !formData.tokenSymbol}
              className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Building2 size={16} />
                  Create DAO
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // DAO Projects View
  const renderDAOProjects = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">DAO Projects</h2>
            <p className="text-gray-600">Browse and participate in decentralized autonomous organizations</p>
          </div>
          <button
            onClick={() => setActiveSection('create-dao')}
            className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Building2 size={16} />
            Create DAO
          </button>
        </div>

        {daos.length === 0 ? (
          <div className="text-center py-12">
            <Building2 size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No DAOs Created Yet</h3>
            <p className="text-gray-600 mb-6">Be the first to create a DAO and start building your community</p>
            <button
              onClick={() => setActiveSection('create-dao')}
              className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Create First DAO
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {daos.map((dao) => (
              <div key={dao.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <img
                    src={dao.imageUrl}
                    alt={dao.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x300?text=DAO+Image';
                    }}
                  />
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{dao.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      dao.status === 'active' ? 'bg-green-100 text-green-800' :
                      dao.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {dao.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{dao.description}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">{dao.category}</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-md font-mono">{dao.tokenSymbol}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Creator Info */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Creator:</span>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{dao.creator}</div>
                      <div className="text-xs text-gray-500 font-mono">{web3Service.formatAddress(dao.creatorWallet)}</div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{dao.membersCount}</div>
                      <div className="text-xs text-gray-600">Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{dao.proposalsCount}</div>
                      <div className="text-xs text-gray-600">Proposals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">${dao.treasuryValue}</div>
                      <div className="text-xs text-gray-600">Treasury</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3">
                    <button className="flex-1 bg-black text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                      Join DAO
                    </button>
                    <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                      <ExternalLink size={14} />
                    </button>
                  </div>

                  {/* Social Links */}
                  {(dao.website || dao.socialLinks?.twitter || dao.socialLinks?.discord) && (
                    <div className="flex items-center gap-2 pt-2">
                      {dao.website && (
                        <a href={dao.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                          <ExternalLink size={14} />
                        </a>
                      )}
                      {dao.socialLinks?.twitter && (
                        <a href={`https://twitter.com/${dao.socialLinks.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500">
                          <MessageSquare size={14} />
                        </a>
                      )}
                      {dao.socialLinks?.discord && (
                        <a href={dao.socialLinks.discord} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-500">
                          <Users size={14} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Voting Section
  const renderVoting = () => {
    const handleVote = (proposalId: string, vote: 'for' | 'against' | 'abstain') => {
      if (!isConnected) {
        alert('Please connect your wallet to vote');
        return;
      }

      // In production, this would interact with smart contracts
      alert(`Vote cast: ${vote} for proposal ${proposalId}`);
    };

    const getProposalTypeColor = (type: string) => {
      switch (type) {
        case 'funding': return 'bg-green-100 text-green-800';
        case 'governance': return 'bg-blue-100 text-blue-800';
        case 'upgrade': return 'bg-purple-100 text-purple-800';
        case 'membership': return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getDaysRemaining = (endDate: Date) => {
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">DAO Voting</h2>
            <p className="text-gray-600">Participate in governance decisions across all DAOs</p>
          </div>
          {!isConnected && (
            <button
              onClick={() => setShowWalletModal(true)}
              className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Connect Wallet to Vote
            </button>
          )}
        </div>

        {proposals.length === 0 ? (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-center py-12">
              <Vote size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Proposals</h3>
              <p className="text-gray-600">Proposals will appear here when DAOs create voting initiatives</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {proposals.map((proposal) => {
              const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
              const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
              const againstPercentage = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
              const abstainPercentage = totalVotes > 0 ? (proposal.votesAbstain / totalVotes) * 100 : 0;
              const quorumMet = totalVotes >= proposal.quorumRequired;
              const daysLeft = getDaysRemaining(proposal.endDate);

              return (
                <div key={proposal.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{proposal.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getProposalTypeColor(proposal.type)}`}>
                          {proposal.type}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          proposal.status === 'active' ? 'bg-green-100 text-green-800' :
                          proposal.status === 'passed' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {proposal.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{proposal.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div>DAO: <span className="font-medium text-gray-700">{proposal.daoName}</span></div>
                        <div>Proposer: <span className="font-mono">{web3Service.formatAddress(proposal.proposerWallet)}</span></div>
                        <div className={`font-medium ${daysLeft > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Voting ended'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Voting Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Voting Progress</span>
                      <span className="text-sm text-gray-500">
                        {totalVotes} / {proposal.quorumRequired} votes
                        {quorumMet && <span className="text-green-600 ml-2">✓ Quorum met</span>}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                      <div className="flex h-full rounded-full overflow-hidden">
                        <div
                          className="bg-green-500"
                          style={{ width: `${forPercentage}%` }}
                        ></div>
                        <div
                          className="bg-red-500"
                          style={{ width: `${againstPercentage}%` }}
                        ></div>
                        <div
                          className="bg-gray-400"
                          style={{ width: `${abstainPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span>For: {proposal.votesFor} ({forPercentage.toFixed(1)}%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span>Against: {proposal.votesAgainst} ({againstPercentage.toFixed(1)}%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                        <span>Abstain: {proposal.votesAbstain} ({abstainPercentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Voting Actions */}
                  {proposal.status === 'active' && daysLeft > 0 && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleVote(proposal.id, 'for')}
                        disabled={!isConnected}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Vote For
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, 'against')}
                        disabled={!isConnected}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Vote Against
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, 'abstain')}
                        disabled={!isConnected}
                        className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Abstain
                      </button>
                    </div>
                  )}

                  {(!isConnected || proposal.status !== 'active' || daysLeft <= 0) && (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-sm">
                        {!isConnected ? 'Connect wallet to vote' :
                         proposal.status !== 'active' ? `Proposal ${proposal.status}` :
                         'Voting period ended'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Comprehensive KYC Form component
  const KYCForm = ({ onComplete }: { onComplete?: () => void }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
      // Personal Information
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      nationality: '',
      phoneNumber: '',

      // Address Information
      street: '',
      city: '',
      postalCode: '',
      country: '',

      // Document Upload
      idDocument: null as File | null,
      proofOfAddress: null as File | null,

      // Additional Information
      occupation: '',
      sourceOfFunds: '',
      estimatedMonthlyVolume: '',

      // Compliance
      pep: false, // Politically Exposed Person
      sanctions: false,
      termsAccepted: false
    });

    const handleInputChange = (field: string, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (field: string, file: File | null) => {
      setFormData(prev => ({ ...prev, [field]: file }));
    };

    const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
      // Here you would submit to your KYC service
      console.log('KYC Form submitted:', formData);
      setKycStatus('pending');
      if (onComplete) onComplete();
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">KYC Verification</h3>
              <p className="text-sm text-gray-600 mt-1">Complete your verification to unlock all features</p>
            </div>
            <div className="text-sm text-gray-500">
              Step {step} of 4
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
            <div
              className="bg-black h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>

          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nationality *</label>
                  <select
                    value={formData.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Select nationality</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="CH">Switzerland</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Address Information */}
          {step === 2 && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">Address Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="123 Main Street"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="10001"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Select country</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="CH">Switzerland</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Document Upload */}
          {step === 3 && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">Document Upload</h4>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Government ID *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload Government ID
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => handleFileChange('idDocument', e.target.files?.[0] || null)}
                        />
                      </label>
                      <p className="mt-1 text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                    </div>
                    {formData.idDocument && (
                      <p className="mt-2 text-sm text-green-600">✓ {formData.idDocument.name}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Proof of Address *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload Proof of Address
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => handleFileChange('proofOfAddress', e.target.files?.[0] || null)}
                        />
                      </label>
                      <p className="mt-1 text-xs text-gray-500">Utility bill, bank statement (PNG, JPG, PDF up to 10MB)</p>
                    </div>
                    {formData.proofOfAddress && (
                      <p className="mt-2 text-sm text-green-600">✓ {formData.proofOfAddress.name}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Additional Information & Compliance */}
          {step === 4 && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">Additional Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Occupation *</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Business Executive"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source of Funds *</label>
                  <select
                    value={formData.sourceOfFunds}
                    onChange={(e) => handleInputChange('sourceOfFunds', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Select source</option>
                    <option value="salary">Salary/Employment</option>
                    <option value="business">Business Income</option>
                    <option value="investments">Investments</option>
                    <option value="inheritance">Inheritance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Monthly Volume *</label>
                  <select
                    value={formData.estimatedMonthlyVolume}
                    onChange={(e) => handleInputChange('estimatedMonthlyVolume', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Select range</option>
                    <option value="0-10k">$0 - $10,000</option>
                    <option value="10k-50k">$10,000 - $50,000</option>
                    <option value="50k-100k">$50,000 - $100,000</option>
                    <option value="100k+">$100,000+</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 border-t pt-6">
                <h5 className="font-medium text-gray-900">Compliance Declarations</h5>
                <div className="space-y-3">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.pep}
                      onChange={(e) => handleInputChange('pep', e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-700">
                      I am a Politically Exposed Person (PEP) or have close relations with one
                    </span>
                  </label>
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.sanctions}
                      onChange={(e) => handleInputChange('sanctions', e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-700">
                      I am subject to economic sanctions or on any sanctions list
                    </span>
                  </label>
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.termsAccepted}
                      onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-700">
                      I accept the <a href="#" className="text-black underline">Terms of Service</a> and <a href="#" className="text-black underline">Privacy Policy</a> *
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {step < 4 ? (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!formData.termsAccepted}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit for Review
              </button>
            )}
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h4 className="font-medium text-gray-900 mb-3">Verification Status</h4>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            kycStatus === 'verified' ? 'bg-green-100 text-green-800' :
            kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {kycStatus === 'verified' && <CheckCircle className="w-4 h-4 mr-2" />}
            {kycStatus === 'pending' && <Clock className="w-4 h-4 mr-2" />}
            {kycStatus === 'not_started' && <AlertCircle className="w-4 h-4 mr-2" />}

            {kycStatus === 'verified' ? 'Verified' :
             kycStatus === 'pending' ? 'Under Review' :
             'Not Submitted'}
          </div>

          {kycStatus === 'pending' && (
            <p className="text-sm text-gray-600 mt-2">
              Your documents are being reviewed. We'll notify you within 24-48 hours.
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderMap = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Interactive Services Map</h2>
          <p className="text-sm text-gray-600 mt-1">Explore our global network of services and office locations</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: '70vh' }}>
        <DashboardMap className="w-full h-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-2">
            <Building2 size={16} className="text-black" />
            <h3 className="font-medium text-gray-900">Office Locations</h3>
          </div>
          <p className="text-sm text-gray-600">3 offices worldwide providing 24/7 support</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-2">
            <Car size={16} className="text-blue-500" />
            <h3 className="font-medium text-gray-900">Luxury Cars</h3>
          </div>
          <p className="text-sm text-gray-600">Premium vehicle fleet across major cities</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-2">
            <Mountain size={16} className="text-green-500" />
            <h3 className="font-medium text-gray-900">Adventure Packages</h3>
          </div>
          <p className="text-sm text-gray-600">Exclusive experiences in unique destinations</p>
        </div>
      </div>
    </div>
  );

  // My Funds Section Renders
  const renderAccounts = () => (
    <div className="space-y-6">
      {/* Profile Summary Card */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <User size={32} className="text-gray-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-light text-black mb-1">{(user as any)?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}</h2>
            <p className="text-gray-600 mb-2">{user?.email}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-black rounded-full"></div>
                Verified Account
              </span>
              <span>Member since Jul 2025</span>
            </div>
          </div>
          <button className="px-6 py-2 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Account Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-light text-black">Account Balance</h3>
            <CreditCard size={20} className="text-gray-400" />
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-extralight text-black">€2,847.92</p>
            <p className="text-sm text-gray-600">Available balance</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-light text-black">Total Bookings</h3>
            <Plane size={20} className="text-gray-400" />
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-extralight text-black">24</p>
            <p className="text-sm text-gray-600">This year</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-light text-black">Carbon Offset</h3>
            <Leaf size={20} className="text-gray-400" />
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-extralight text-black">1.2t</p>
            <p className="text-sm text-gray-600">CO2 offset</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-light text-black">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { action: 'Flight booking confirmed', details: 'London → Paris', time: '2 hours ago', icon: Plane },
            { action: 'Payment processed', details: '€1,450.00', time: '2 hours ago', icon: CreditCard },
            { action: 'Carbon certificate issued', details: '0.5t CO2 offset', time: '1 day ago', icon: Leaf },
            { action: 'Profile updated', details: 'Contact information', time: '3 days ago', icon: User }
          ].map((activity, index) => (
            <div key={index} className="p-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <activity.icon size={16} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-black font-light">{activity.action}</p>
                <p className="text-sm text-gray-600">{activity.details}</p>
              </div>
              <div className="text-sm text-gray-500">{activity.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-light text-black mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Settings size={24} className="mx-auto mb-2 text-gray-600" />
            <p className="text-sm font-light text-black">Settings</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Shield size={24} className="mx-auto mb-2 text-gray-600" />
            <p className="text-sm font-light text-black">Security</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={24} className="mx-auto mb-2 text-gray-600" />
            <p className="text-sm font-light text-black">Download</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <AlertCircle size={24} className="mx-auto mb-2 text-gray-600" />
            <p className="text-sm font-light text-black">Support</p>
          </button>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-light text-black">Account Preferences</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-light text-black">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive booking confirmations and updates</p>
            </div>
            <div className="w-12 h-6 bg-black rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-light text-black">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600">Add an extra layer of security</p>
            </div>
            <div className="w-12 h-6 bg-gray-200 rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-light text-black">Dark Mode</p>
              <p className="text-sm text-gray-600">Switch to dark theme</p>
            </div>
            <div className="w-12 h-6 bg-gray-200 rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMarketplace = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Marketplace</h2>
          <p className="text-sm text-gray-600 mt-1">Trade NFTs and carbon credits</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setActiveSection('nft-marketplace')}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 text-left"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Image size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">NFT Marketplace</h3>
              <p className="text-sm text-gray-600">Buy, sell, and trade NFTs</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Active listings: {nfts.filter(n => n.forSale).length}
          </div>
        </button>
        <button
          onClick={() => setActiveSection('carbon-marketplace')}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 text-left"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Leaf size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Carbon Marketplace</h3>
              <p className="text-sm text-gray-600">Trade carbon credits and certificates</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Available projects: 25+
          </div>
        </button>
      </div>
    </div>
  );

  const renderNFTMarketplace = () => {
    // This will use the existing NFT functionality but in marketplace context
    return renderNFTs();
  };

  const renderCarbonMarketplace = () => {
    // Purchase handler with email integration
    const handlePurchaseEmail = () => {
      if (!selectedProject || !user) {
        alert('Please log in to place an order');
        return;
      }

      const userName = user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.email;

      const totalPrice = purchaseTons * selectedProject.pricePerTon;

      const subject = encodeURIComponent(`CO2 Certificate Order - Project ${selectedProject.projectId}`);
      const body = encodeURIComponent(`Dear PrivateCharterX Team,

I would like to purchase CO2 certificates:

ORDER DETAILS:
Customer: ${userName} (${user.email})
Project: ${selectedProject.name} (ID: ${selectedProject.projectId})
Provider: ${selectedProject.ngoName}
Location: ${selectedProject.location}
Quantity: ${purchaseTons} tons CO2
Price: $${selectedProject.pricePerTon}/ton
Total: $${totalPrice.toFixed(2)} USD
Payment: ${paymentMethod === 'crypto' ? 'Cryptocurrency' : 'Bank Transfer'}

${purchaseMessage ? `Message: ${purchaseMessage}` : ''}

Please confirm availability and payment instructions.

Best regards,
${userName}`);

      // Open email client
      window.location.href = `mailto:certificates@privatecharterx.com?subject=${subject}&body=${body}`;

      // Add to basket
      const basketItem = {
        id: `co2_${selectedProject.id}`,
        type: 'carbon_certificate',
        name: `CO₂ Certificate - ${selectedProject.name}`,
        description: `${purchaseTons} tons CO2 offset from ${selectedProject.location}`,
        price: totalPrice,
        currency: 'USD',
        metadata: selectedProject
      };

      setBasketItems(prev => [...prev, basketItem]);

      // Show success modal instead of alert
      setShowPurchaseSuccess(true);

      // Close success modal and purchase modal after 3 seconds
      setTimeout(() => {
        setShowPurchaseSuccess(false);
        setShowPurchaseModal(false);
      }, 3000);
    };

    const userCertificateHistory = [
      {
        id: '1',
        certificate: 'PJC001 - Rainforest Protection',
        emissions: '4.2 tCO₂',
        date: '2025-01-15',
        status: 'claimed',
        blockchain_tx: '0x1234...abcd',
        route: 'TETERBORO → ASPEN'
      },
      {
        id: '2',
        certificate: 'PJC002 - Wind Farm Development',
        emissions: '3.8 tCO₂',
        date: '2025-01-10',
        status: 'claimed',
        blockchain_tx: '0x5678...efgh',
        route: 'VAN NUYS → JACKSON HOLE'
      }
    ];

    const handleClaimCertificate = () => {
      if (!selectedCertificate) return;

      // Add to basket
      const basketItem = {
        id: `cert_${selectedCertificate.id}`,
        type: 'carbon_certificate',
        name: `CO₂ Certificate - ${selectedCertificate.projectName}`,
        description: `${selectedCertificate.emissions} offset certificate for ${selectedCertificate.route}`,
        price: 0,
        currency: 'USD',
        metadata: selectedCertificate
      };

      setBasketItems(prev => [...prev, basketItem]);
      alert(`Free CO₂ Certificate "${selectedCertificate.projectName}" added to basket!\n\nEmissions Offset: ${selectedCertificate.emissions}\nBlockchain: ${selectedCertificate.blockchain}\nNFT ID: ${selectedCertificate.nftId}`);
      setShowClaimModal(false);
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Carbon Marketplace</h2>
            <p className="text-sm text-gray-600 mt-1">Trade verified carbon credits and offset certificates</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              <Plus size={16} className="mr-2 inline" />
              List Project
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Globe size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-light text-gray-900">{realCO2Projects.length}</p>
                <p className="text-sm text-gray-600">Verified Projects</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Leaf size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-light text-gray-900">{Math.round(realCO2Projects.reduce((sum, p) => sum + p.availableTons, 0) / 1000)}K+</p>
                <p className="text-sm text-gray-600">Tons Available</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-light text-gray-900">${Math.min(...realCO2Projects.map(p => p.pricePerTon))}</p>
                <p className="text-sm text-gray-600">Starting Price/ton</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Shield size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-light text-gray-900">CDM</p>
                <p className="text-sm text-gray-600">Verified Standard</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex space-x-8">
              {[
                { id: 'marketplace', label: 'CO2 Projects', icon: ShoppingBag },
                { id: 'portfolio', label: 'My Purchases', icon: Briefcase },
                { id: 'history', label: 'Order History', icon: History }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCarbonActiveTab(tab.id)}
                  className={`flex items-center pb-3 border-b-2 transition-colors ${
                    carbonActiveTab === tab.id
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon size={16} className="mr-2" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {carbonActiveTab === 'marketplace' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {realCO2Projects.map((project) => (
                <div key={project.id} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer">
                  <div className="relative h-64 overflow-hidden">
                    <img src={project.image} alt={project.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Modern badges */}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      {project.verified && (
                        <span className="bg-black/90 backdrop-blur-md text-white text-xs px-3 py-2 rounded-full font-semibold border border-white/20">
                          <Shield size={10} className="inline mr-1" />
                          Verified
                        </span>
                      )}
                      <span className="bg-gray-900/90 backdrop-blur-md text-white text-xs px-3 py-2 rounded-full font-semibold border border-white/20">
                        {project.category === 'renewable-energy' ? 'Renewable Energy' :
                         project.category === 'methane-capture' ? 'Methane Capture' :
                         project.category === 'sustainable-agriculture' ? 'Sustainable Agriculture' :
                         project.category}
                      </span>
                    </div>

                    {/* Price overlay */}
                    <div className="absolute bottom-4 right-4">
                      <div className="bg-white/95 backdrop-blur-md rounded-xl px-3 py-2 border border-gray-200/50 shadow-lg">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-medium text-gray-600">$</span>
                          <span className="text-base font-bold text-gray-900">{project.pricePerTon}</span>
                        </div>
                        <div className="text-xs text-gray-500 text-center mt-0.5">per ton CO2</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col bg-white">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-black transition-colors leading-tight">
                      {project.name}
                    </h3>

                    <div className="flex items-center text-gray-600 mb-4">
                      <Globe size={16} className="mr-2 flex-shrink-0 text-gray-400" />
                      <span className="text-sm font-medium">
                        {project.location}, {project.country}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-3">{project.description}</p>

                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-900 mb-2">Key Benefits:</div>
                      <div className="flex flex-wrap gap-1">
                        {project.benefits.slice(0, 3).map((benefit, index) => (
                          <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full border border-gray-200">
                            {benefit}
                          </span>
                        ))}
                        {project.benefits.length > 3 && (
                          <span className="text-xs text-gray-500">+{project.benefits.length - 3} more</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4 pt-3 border-t border-gray-100 text-sm">
                      <div>
                        <div className="text-gray-500">Provider:</div>
                        <div className="text-gray-900 font-medium truncate">{project.ngoName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-500">Available:</div>
                        <div className="text-gray-900 font-medium">{project.availableTons.toLocaleString()} tons</div>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <button
                        className="w-full bg-black text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-black"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(project);
                          setPurchaseTons(project.minPurchase);
                          setShowPurchaseModal(true);
                          setPurchaseStep(1);
                        }}
                      >
                        Purchase Certificates
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {carbonActiveTab === 'portfolio' && (
            <div className="text-center py-12">
              <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your Carbon Certificates</h3>
              <p className="text-gray-600 mb-6">Track your claimed blockchain certificates</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-gray-900 mb-2">Total Certificates</h4>
                  <p className="text-2xl font-light text-gray-900">{userCertificateHistory.length}</p>
                  <p className="text-sm text-gray-600">Blockchain verified</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-gray-900 mb-2">Total CO₂ Offset</h4>
                  <p className="text-2xl font-light text-gray-900">8.0 tCO₂</p>
                  <p className="text-sm text-green-600">Permanently retired</p>
                </div>
              </div>
            </div>
          )}

          {carbonActiveTab === 'history' && (
            <div className="space-y-4">
              {userCertificateHistory.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle size={16} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Certificate Claimed</p>
                      <p className="text-sm text-gray-600">{tx.certificate}</p>
                      <p className="text-xs text-gray-500">{tx.route}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{tx.emissions}</p>
                    <p className="text-sm text-gray-600">CO₂ Offset</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{tx.date}</p>
                    <p className="text-xs text-green-600">{tx.status}</p>
                    <p className="text-xs text-blue-600 truncate max-w-20">{tx.blockchain_tx}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Purchase Modal */}
        {showPurchaseModal && selectedProject && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header with Hero Image */}
              <div className="relative">
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                  <X className="w-4 h-4 stroke-2" />
                </button>

                <div className="h-48 bg-gradient-to-br from-gray-900 to-gray-700 relative overflow-hidden rounded-t-2xl">
                  <img
                    src={selectedProject.image}
                    alt={selectedProject.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1.5 rounded-md flex items-center text-sm font-light">
                    <MapPin className="w-4 h-4 mr-2 stroke-1" />
                    {selectedProject.location}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div>
                  <h2 className="text-lg font-light text-black mb-2">
                    {selectedProject.name}
                  </h2>

                  <div className="flex items-center space-x-2 mb-3">
                    {selectedProject.verified && (
                      <div className="bg-gray-100 px-2 py-1 rounded-full flex items-center text-xs text-black font-light">
                        <Shield size={10} className="mr-1" />
                        Verified
                      </div>
                    )}
                    <div className="bg-gray-100 px-2 py-1 rounded-full flex items-center text-xs text-black font-light">
                      {selectedProject.category === 'renewable-energy' ? 'Renewable Energy' :
                       selectedProject.category === 'methane-capture' ? 'Methane Capture' :
                       selectedProject.category}
                    </div>
                  </div>

                  {/* Step 1: Project Overview */}
                  {purchaseStep === 1 && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="grid grid-cols-2 gap-3 text-sm font-light">
                          <div>
                            <span className="text-gray-500">Provider:</span>
                            <div className="text-black">{selectedProject.ngoName}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Standard:</span>
                            <div className="text-black">{selectedProject.certificationStandard}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Available:</span>
                            <div className="text-black">{selectedProject.availableTons.toLocaleString()} tons</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Price:</span>
                            <div className="text-black">${selectedProject.pricePerTon}/ton</div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-gray-700 leading-relaxed">
                          {selectedProject.description.split('\n')[0]}
                        </div>
                      </div>

                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-black mb-2">Key Benefits:</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedProject.benefits.slice(0, 4).map((benefit, index) => (
                            <div key={index} className="flex items-center text-xs text-gray-600">
                              <Check className="w-3 h-3 mr-1 text-green-600" />
                              <span className="truncate">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-black mb-2">Impact Details:</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><span className="font-medium">Community:</span> {selectedProject.additionalInfo.communityBenefit}</div>
                          <div><span className="font-medium">Environment:</span> {selectedProject.additionalInfo.biodiversityImpact}</div>
                          <div><span className="font-medium">Technology:</span> {selectedProject.additionalInfo.technologyUsed}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => setPurchaseStep(2)}
                        className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                      >
                        Continue to Purchase
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Step 2: Purchase Details */}
                  {purchaseStep === 2 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => setPurchaseStep(1)}
                          className="flex items-center text-gray-600 hover:text-black text-sm"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Back to Overview
                        </button>
                        <span className="text-sm text-gray-500">Step 2 of 2</span>
                      </div>

                      {/* Quantity Selection */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">Quantity (tons of CO2)</label>

                        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mb-3">
                          <span className="text-sm text-gray-700">Number of tons</span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setPurchaseTons(Math.max(selectedProject.minPurchase, purchaseTons - 1))}
                              disabled={purchaseTons <= selectedProject.minPurchase}
                              className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-sm font-semibold disabled:opacity-50"
                            >
                              -
                            </button>

                            <input
                              type="number"
                              value={purchaseTons}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value) && value >= selectedProject.minPurchase && value <= selectedProject.maxPurchase) {
                                  setPurchaseTons(value);
                                }
                              }}
                              min={selectedProject.minPurchase}
                              max={selectedProject.maxPurchase}
                              step={selectedProject.minPurchase < 1 ? 0.1 : 1}
                              className="w-16 text-center text-sm font-semibold bg-transparent border-none outline-none"
                            />

                            <button
                              onClick={() => setPurchaseTons(Math.min(selectedProject.maxPurchase, purchaseTons + 1))}
                              disabled={purchaseTons >= selectedProject.maxPurchase}
                              className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-sm font-semibold disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Custom Amount Input Field */}
                        <div className="mb-3">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={customTonsInput}
                              onChange={(e) => setCustomTonsInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const value = parseFloat(customTonsInput);
                                  if (!isNaN(value) && value >= selectedProject.minPurchase && value <= selectedProject.maxPurchase) {
                                    setPurchaseTons(value);
                                    setCustomTonsInput('');
                                  } else {
                                    alert(`Please enter a value between ${selectedProject.minPurchase} and ${selectedProject.maxPurchase} tons`);
                                  }
                                }
                              }}
                              placeholder={`Enter custom amount (${selectedProject.minPurchase}-${selectedProject.maxPurchase})`}
                              min={selectedProject.minPurchase}
                              max={selectedProject.maxPurchase}
                              step={selectedProject.minPurchase < 1 ? 0.1 : 1}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                            />
                            <button
                              onClick={() => {
                                const value = parseFloat(customTonsInput);
                                if (!isNaN(value) && value >= selectedProject.minPurchase && value <= selectedProject.maxPurchase) {
                                  setPurchaseTons(value);
                                  setCustomTonsInput('');
                                } else {
                                  alert(`Please enter a value between ${selectedProject.minPurchase} and ${selectedProject.maxPurchase} tons`);
                                }
                              }}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                            >
                              Set
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          Min: {selectedProject.minPurchase} • Max: {selectedProject.maxPurchase} • Current: {purchaseTons} tons
                        </p>
                      </div>

                      {/* Payment Method */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">Payment Method</label>
                        <div className="space-y-2">
                          <button
                            onClick={() => setPaymentMethod('bank')}
                            className={`w-full p-3 border rounded-xl text-left transition-all ${
                              paymentMethod === 'bank' ? 'border-black bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <CreditCard size={18} />
                              <span className="text-sm">Bank Transfer</span>
                            </div>
                          </button>

                          <button
                            onClick={() => setPaymentMethod('crypto')}
                            className={`w-full p-3 border rounded-xl text-left transition-all ${
                              paymentMethod === 'crypto' ? 'border-black bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Wallet size={18} />
                              <div>
                                <div className="text-sm">Cryptocurrency</div>
                                <div className="text-xs text-gray-500">Coming Soon</div>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">Additional Message</label>
                        <textarea
                          value={purchaseMessage}
                          onChange={(e) => setPurchaseMessage(e.target.value)}
                          placeholder="Any special requirements..."
                          className="w-full h-20 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none text-sm"
                        />
                      </div>

                      {/* Price display */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="flex justify-between items-center mb-2 text-sm">
                          <span className="text-gray-600">{purchaseTons} tons × ${selectedProject.pricePerTon}</span>
                          <span className="text-gray-900 font-semibold">${(purchaseTons * selectedProject.pricePerTon).toFixed(2)}</span>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            Total: ${(purchaseTons * selectedProject.pricePerTon).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">Final price</div>
                        </div>
                      </div>

                      {/* Action button */}
                      <button
                        onClick={handlePurchaseEmail}
                        className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                      >
                        Send Order Request
                        <Send className="w-4 h-4" />
                      </button>

                      <p className="text-center text-xs text-gray-500">
                        This will open your email client with order details
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showPurchaseSuccess && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl mx-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">Email Client Opened</h3>

              <p className="text-gray-600 mb-6">
                Your email client should open with pre-filled order details.
              </p>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">Manual email:</p>
                <div className="flex items-center justify-between bg-white rounded p-3">
                  <span className="text-sm font-medium">certificates@privatecharterx.com</span>
                  <button
                    onClick={() => navigator.clipboard.writeText('certificates@privatecharterx.com')}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAssets = () => {
    const [assetsActiveTab, setAssetsActiveTab] = useState('all');
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [withdrawAmount, setWithdrawAmount] = useState('');

    // Sample user assets data
    const userAssets = [
      {
        id: '1',
        symbol: 'ETH',
        name: 'Ethereum',
        balance: '2.45789',
        usdValue: '4,235.67',
        change24h: '+3.24%',
        icon: '⟠',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50'
      },
      {
        id: '2',
        symbol: 'BTC',
        name: 'Bitcoin',
        balance: '0.12456',
        usdValue: '5,678.90',
        change24h: '+1.87%',
        icon: '₿',
        color: 'text-orange-500',
        bgColor: 'bg-orange-50'
      },
      {
        id: '3',
        symbol: 'USDC',
        name: 'USD Coin',
        balance: '1,250.00',
        usdValue: '1,250.00',
        change24h: '+0.01%',
        icon: '$',
        color: 'text-green-500',
        bgColor: 'bg-green-50'
      },
      {
        id: '4',
        symbol: 'PCX',
        name: 'PrivateCharterX Token',
        balance: '15,000',
        usdValue: '3,750.00',
        change24h: '+12.45%',
        icon: '🛩',
        color: 'text-black',
        bgColor: 'bg-gray-50'
      }
    ];

    const transactionHistory = [
      {
        id: '1',
        type: 'deposit',
        asset: 'ETH',
        amount: '1.5',
        usdValue: '$2,456.78',
        status: 'completed',
        date: '2025-01-15',
        hash: '0x1234...abcd'
      },
      {
        id: '2',
        type: 'withdraw',
        asset: 'BTC',
        amount: '0.05',
        usdValue: '$2,234.50',
        status: 'completed',
        date: '2025-01-14',
        hash: '0x5678...efgh'
      },
      {
        id: '3',
        type: 'swap',
        asset: 'USDC → ETH',
        amount: '500 → 0.3',
        usdValue: '$500.00',
        status: 'completed',
        date: '2025-01-13',
        hash: '0x9abc...ijkl'
      }
    ];

    const handleWithdraw = () => {
      if (!selectedAsset || !withdrawAmount) return;
      alert(`Withdraw ${withdrawAmount} ${selectedAsset.symbol} initiated`);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
    };

    const totalPortfolioValue = userAssets.reduce((sum, asset) => sum + parseFloat(asset.usdValue.replace(',', '')), 0);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Assets</h2>
            <p className="text-sm text-gray-600 mt-1">Manage your digital asset portfolio</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              <Plus size={16} className="mr-2 inline" />
              Deposit
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <ArrowUpDown size={16} className="mr-2 inline" />
              Withdraw
            </button>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Portfolio Value</h3>
              <p className="text-3xl font-light text-gray-900 mt-2">${totalPortfolioValue.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">24h Change</p>
              <p className="text-lg font-medium text-green-500">+$234.56 (+2.45%)</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex space-x-8">
              {[
                { id: 'all', label: 'All Tokens', icon: Coins },
                { id: 'vault', label: 'Vault', icon: Shield },
                { id: 'history', label: 'History', icon: History }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAssetsActiveTab(tab.id)}
                  className={`flex items-center pb-3 border-b-2 transition-colors ${
                    assetsActiveTab === tab.id
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon size={16} className="mr-2" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {assetsActiveTab === 'all' && (
            <div className="space-y-4">
              {userAssets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full ${asset.bgColor} flex items-center justify-center text-lg`}>
                      {asset.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{asset.symbol}</h4>
                      <p className="text-sm text-gray-600">{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{asset.balance} {asset.symbol}</p>
                    <p className="text-sm text-gray-600">${asset.usdValue}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${asset.change24h.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                      {asset.change24h}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedAsset(asset);
                        setShowWithdrawModal(true);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {assetsActiveTab === 'vault' && (
            <div className="text-center py-12">
              <Shield size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Secure Vault</h3>
              <p className="text-gray-600 mb-6">Store your assets in our multi-signature vault for enhanced security</p>
              <button className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
                Access Vault
              </button>
            </div>
          )}

          {assetsActiveTab === 'history' && (
            <div className="space-y-4">
              {transactionHistory.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      tx.type === 'deposit' ? 'bg-green-100 text-green-600' :
                      tx.type === 'withdraw' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {tx.type === 'deposit' ? '↓' : tx.type === 'withdraw' ? '↑' : '↔'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{tx.type}</p>
                      <p className="text-sm text-gray-600">{tx.asset}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{tx.amount}</p>
                    <p className="text-sm text-gray-600">{tx.usdValue}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{tx.date}</p>
                    <p className={`text-xs font-medium ${
                      tx.status === 'completed' ? 'text-green-500' : 'text-yellow-500'
                    }`}>
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Withdraw Assets</h3>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Asset</label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    onChange={(e) => setSelectedAsset(userAssets.find(a => a.id === e.target.value))}
                  >
                    <option value="">Choose asset...</option>
                    {userAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.symbol} - {asset.balance} available
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  {selectedAsset && (
                    <p className="text-sm text-gray-600 mt-1">
                      Available: {selectedAsset.balance} {selectedAsset.symbol}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Address</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  className="flex-1 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNFTs = () => {
    // OpenSea API integration ready
    const OPENSEA_API_KEY = '4123a3e395f743e588f9d14b15133d19';
    const OPENSEA_BASE_URL = 'https://api.opensea.io/api/v2';

    // NFT Marketplace state
    const [nftMarketplaceActiveTab, setNftMarketplaceActiveTab] = useState('marketplace');
    const [selectedMarketplaceNFT, setSelectedMarketplaceNFT] = useState(null);
    const [showNFTModal, setShowNFTModal] = useState(false);
    const [currentNFTPage, setCurrentNFTPage] = useState(1);
    const [nftItemsPerPage] = useState(8); // 4 columns x 2 rows

    // Real NFT data from NFTCollection.tsx
    const nftVideo = "https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivateCharterX_transparent-_3_.mp4";
    const fallbackImage = "https://sgfnbormqiqgvhdfwmhz.supabase.co/storage/v1/object/public/logos/PrivatecharterX_logo_vectorized.png";

    const marketplaceNFTs = [
      {
        id: '1',
        name: 'PrivateCharterX Membership NFT #001',
        video: nftVideo,
        fallback: fallbackImage,
        price: '0.5 ETH',
        collection: 'PrivateCharterX Membership',
        description: 'Professional flight NFT membership with blockchain verification and immediate benefits. Perfect for brokers seeking 10% discounted offers and leisure travelers enjoying FREE empty leg flights.',
        benefits: ['10% Permanent Discount for Brokers', 'FREE Empty Leg Flight', 'FREE Mercedes Transport', 'Carbon Certificates', 'Priority Access', 'Exclusive Network'],
        rarity: 'Membership',
        opensea: 'https://opensea.io/0xbf673bf506bc8f10269e4a40c0658c7925be5c5e'
      },
      {
        id: '2',
        name: 'PrivateCharterX Membership NFT #002',
        video: nftVideo,
        fallback: fallbackImage,
        price: '0.5 ETH',
        collection: 'PrivateCharterX Membership',
        description: 'Revolutionary Web3 aviation technology. Every flight, carbon offset, and membership benefit is recorded permanently on the blockchain.',
        benefits: ['10% Permanent Discount for Brokers', 'FREE Empty Leg Flight', 'FREE Mercedes Transport', 'Carbon Certificates', 'Priority Access', 'Exclusive Network'],
        rarity: 'Membership',
        opensea: 'https://opensea.io/0xbf673bf506bc8f10269e4a40c0658c7925be5c5e'
      },
      {
        id: '3',
        name: 'PrivateCharterX Membership NFT #003',
        video: nftVideo,
        fallback: fallbackImage,
        price: '0.5 ETH',
        collection: 'PrivateCharterX Membership',
        description: 'Sustainable aviation leadership with blockchain-verified carbon offset certificates, making you part of the sustainable aviation revolution.',
        benefits: ['10% Permanent Discount for Brokers', 'FREE Empty Leg Flight', 'FREE Mercedes Transport', 'Carbon Certificates', 'Priority Access', 'Exclusive Network'],
        rarity: 'Membership',
        opensea: 'https://opensea.io/0xbf673bf506bc8f10269e4a40c0658c7925be5c5e'
      },
      {
        id: '4',
        name: 'PrivateCharterX Membership NFT #004',
        video: nftVideo,
        fallback: fallbackImage,
        price: '0.5 ETH',
        collection: 'PrivateCharterX Membership',
        description: 'Join our private broker network with special rates and partnership opportunities. Access exclusive empty leg flights.',
        benefits: ['10% Permanent Discount for Brokers', 'FREE Empty Leg Flight', 'FREE Mercedes Transport', 'Carbon Certificates', 'Priority Access', 'Exclusive Network'],
        rarity: 'Membership',
        opensea: 'https://opensea.io/0xbf673bf506bc8f10269e4a40c0658c7925be5c5e'
      },
      {
        id: '5',
        name: 'PrivateCharterX Membership NFT #005',
        video: nftVideo,
        fallback: fallbackImage,
        price: '0.5 ETH',
        collection: 'PrivateCharterX Membership',
        description: 'Smart contracts automatically execute benefits from discounts to free flights, eliminating bureaucracy and ensuring instant access.',
        benefits: ['10% Permanent Discount for Brokers', 'FREE Empty Leg Flight', 'FREE Mercedes Transport', 'Carbon Certificates', 'Priority Access', 'Exclusive Network'],
        rarity: 'Membership',
        opensea: 'https://opensea.io/0xbf673bf506bc8f10269e4a40c0658c7925be5c5e'
      },
      {
        id: '6',
        name: 'PrivateCharterX Membership NFT #006',
        video: nftVideo,
        fallback: fallbackImage,
        price: '0.5 ETH',
        collection: 'PrivateCharterX Membership',
        description: 'First access to available empty leg flights before public listing. Secure inventory instantly with priority booking.',
        benefits: ['10% Permanent Discount for Brokers', 'FREE Empty Leg Flight', 'FREE Mercedes Transport', 'Carbon Certificates', 'Priority Access', 'Exclusive Network'],
        rarity: 'Membership',
        opensea: 'https://opensea.io/0xbf673bf506bc8f10269e4a40c0658c7925be5c5e'
      },
      {
        id: '7',
        name: 'PrivateCharterX Membership NFT #007',
        video: nftVideo,
        fallback: fallbackImage,
        price: '0.5 ETH',
        collection: 'PrivateCharterX Membership',
        description: 'Complimentary empty leg flight worth up to $5,000. Perfect for spontaneous luxury travel experiences.',
        benefits: ['10% Permanent Discount for Brokers', 'FREE Empty Leg Flight', 'FREE Mercedes Transport', 'Carbon Certificates', 'Priority Access', 'Exclusive Network'],
        rarity: 'Membership',
        opensea: 'https://opensea.io/0xbf673bf506bc8f10269e4a40c0658c7925be5c5e'
      },
      {
        id: '8',
        name: 'PrivateCharterX Membership NFT #008',
        video: nftVideo,
        fallback: fallbackImage,
        price: '0.5 ETH',
        collection: 'PrivateCharterX Membership',
        description: 'The world\'s first tokenized multi-charter company built on Web3 technology with immediate financial benefits.',
        benefits: ['10% Permanent Discount for Brokers', 'FREE Empty Leg Flight', 'FREE Mercedes Transport', 'Carbon Certificates', 'Priority Access', 'Exclusive Network'],
        rarity: 'Membership',
        opensea: 'https://opensea.io/0xbf673bf506bc8f10269e4a40c0658c7925be5c5e'
      }
    ];

    // Pagination logic
    const totalNFTPages = Math.ceil(marketplaceNFTs.length / nftItemsPerPage);
    const startNFTIndex = (currentNFTPage - 1) * nftItemsPerPage;
    const paginatedNFTs = marketplaceNFTs.slice(startNFTIndex, startNFTIndex + nftItemsPerPage);

    const paginateNFTs = (pageNumber) => {
      setCurrentNFTPage(pageNumber);
    };

    const handleListNFT = async () => {
      if (!selectedNFT || !listPrice) return;

      try {
        // In production, this would call OpenSea's listing API
        console.log(`Listing NFT ${selectedNFT.name} for ${listPrice} ETH`);

        // Update local state
        setNfts(prev => prev.map(nft =>
          nft.id === selectedNFT.id
            ? { ...nft, listed: true, price: `${listPrice} ETH` }
            : nft
        ));

        setShowListModal(false);
        setListPrice('');
        alert(`Successfully listed ${selectedNFT.name} for ${listPrice} ETH`);
      } catch (error) {
        alert('Error listing NFT');
      }
    };

    const handleBuyNFT = async () => {
      if (!selectedNFT) return;

      try {
        // In production, this would call OpenSea's purchase API
        console.log(`Buying NFT ${selectedNFT.name} for ${selectedNFT.price}`);

        // Update local state
        setNfts(prev => prev.map(nft =>
          nft.id === selectedNFT.id
            ? { ...nft, owner: user?.email?.split('@')[0] || 'You', forSale: false }
            : nft
        ));

        setShowBuyModal(false);
        alert(`Successfully purchased ${selectedNFT.name}!`);
      } catch (error) {
        alert('Error purchasing NFT');
      }
    };

    const filteredNFTs = nfts.filter(nft => {
      switch (nftActiveTab) {
        case 'owned':
          return nft.owner === (user?.email?.split('@')[0] || 'You') && !nft.listed;
        case 'listed':
          return nft.owner === (user?.email?.split('@')[0] || 'You') && nft.listed;
        case 'marketplace':
          return nft.forSale && nft.owner !== (user?.email?.split('@')[0] || 'You');
        default:
          return true;
      }
    });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-light text-black">NFT Marketplace</h2>
            <p className="text-gray-600">Buy, sell, and mint NFTs • Powered by OpenSea API</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Portfolio Value</p>
            <p className="text-xl font-light text-black">4.2 ETH</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border border-gray-100">
          <div className="flex border-b border-gray-100">
            {[
              { id: 'owned', label: 'My NFTs', count: nfts.filter(n => n.owner === (user?.email?.split('@')[0] || 'You')).length },
              { id: 'listed', label: 'Listed for Sale', count: nfts.filter(n => n.owner === (user?.email?.split('@')[0] || 'You') && n.listed).length },
              { id: 'marketplace', label: 'Marketplace', count: marketplaceNFTs.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setNftActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-light transition-all duration-200 border-b-2 ${
                  nftActiveTab === tab.id
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-600 hover:text-black'
                }`}
              >
                {tab.label}
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* NFT Grid */}
        {nftLoading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading NFTs from OpenSea...</p>
            </div>
          </div>
        ) : (
          <>
            {nftActiveTab === 'marketplace' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {paginatedNFTs.map((nft) => (
                  <div key={nft.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer">
                    <div
                      className="aspect-square bg-white relative overflow-hidden"
                      onClick={() => {
                        setSelectedMarketplaceNFT(nft);
                        setShowNFTModal(true);
                      }}
                    >
                      <video
                        src={nft.video}
                        poster={nft.fallback}
                        alt={nft.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        autoPlay
                        loop
                        muted
                        playsInline
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const img = document.createElement('img');
                          img.src = nft.fallback;
                          img.className = 'w-full h-full object-contain group-hover:scale-105 transition-transform duration-500';
                          img.alt = nft.name;
                          e.currentTarget.parentNode.appendChild(img);
                        }}
                      />
                      <div className="absolute top-3 right-3 bg-black text-white text-xs px-2 py-1 rounded-full font-medium">
                        {nft.price}
                      </div>
                      <div className="absolute top-3 left-3 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                        {nft.rarity}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-black text-sm truncate">{nft.name}</h3>
                          <p className="text-xs text-gray-600 mb-2">{nft.collection}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(nft.opensea, '_blank')}
                          className="flex-1 px-3 py-2 bg-black text-white text-xs font-medium hover:bg-gray-800 transition-colors rounded-lg"
                        >
                          Buy on OpenSea
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMarketplaceNFT(nft);
                            setShowNFTModal(true);
                          }}
                          className="px-3 py-2 border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors rounded-lg"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNFTs.map((nft) => (
              <div key={nft.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 relative">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x400/f3f4f6/9ca3af?text=NFT';
                    }}
                  />
                  {nft.listed && (
                    <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 rounded text-xs">
                      Listed
                    </div>
                  )}
                  {nft.forSale && nft.owner !== (user?.email?.split('@')[0] || 'You') && (
                    <div className="absolute top-2 right-2 bg-black text-white px-2 py-1 rounded text-xs">
                      For Sale
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-light text-black truncate">{nft.name}</h3>
                      <p className="text-sm text-gray-600">{nft.collection}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-light text-black">{nft.price}</p>
                      <p className="text-xs text-gray-600">Floor: {nft.floorPrice}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                    <span>Owner: {nft.owner}</span>
                    <span>#{nft.tokenId}</span>
                  </div>

                  <div className="flex gap-2">
                    {nft.owner === (user?.email?.split('@')[0] || 'You') ? (
                      <>
                        {!nft.listed ? (
                          <button
                            onClick={() => {
                              setSelectedNFT(nft);
                              setShowListModal(true);
                            }}
                            className="flex-1 px-3 py-2 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors"
                          >
                            List for Sale
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setNfts(prev => prev.map(n =>
                                n.id === nft.id ? { ...n, listed: false } : n
                              ));
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-light hover:bg-gray-50 transition-colors"
                          >
                            Unlist
                          </button>
                        )}
                        <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-light hover:bg-gray-50 transition-colors">
                          Transfer
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedNFT(nft);
                          setShowBuyModal(true);
                        }}
                        className="w-full px-3 py-2 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors"
                      >
                        Buy Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
              </div>
            )}

            {/* Pagination for Marketplace */}
            {nftActiveTab === 'marketplace' && totalNFTPages > 1 && (
              <div className="flex justify-center items-center mt-8">
                <div className="flex items-center bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => paginateNFTs(currentNFTPage - 1)}
                    disabled={currentNFTPage === 1}
                    className={`px-6 py-4 transition-colors ${currentNFTPage === 1
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="flex items-center">
                    {Array.from({ length: Math.min(3, totalNFTPages) }, (_, i) => {
                      let pageNum;
                      if (totalNFTPages <= 3) {
                        pageNum = i + 1;
                      } else if (currentNFTPage <= 2) {
                        pageNum = i + 1;
                      } else if (currentNFTPage >= totalNFTPages - 1) {
                        pageNum = totalNFTPages - 2 + i;
                      } else {
                        pageNum = currentNFTPage - 1 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => paginateNFTs(pageNum)}
                          className={`px-6 py-4 text-sm font-medium transition-colors ${currentNFTPage === pageNum
                            ? 'bg-black text-white'
                            : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => paginateNFTs(currentNFTPage + 1)}
                    disabled={currentNFTPage === totalNFTPages}
                    className={`px-6 py-4 transition-colors ${currentNFTPage === totalNFTPages
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* List Modal */}
        {showListModal && selectedNFT && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowListModal(false)}></div>
              <div className="relative bg-white rounded-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-light text-black">List NFT for Sale</h3>
                  <button
                    onClick={() => setShowListModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <img
                    src={selectedNFT.image}
                    alt={selectedNFT.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <h4 className="font-light text-black mt-2">{selectedNFT.name}</h4>
                  <p className="text-sm text-gray-600">Floor Price: {selectedNFT.floorPrice}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-light text-black mb-2">List Price (ETH)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={listPrice}
                      onChange={(e) => setListPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                      placeholder="Enter price in ETH"
                    />
                  </div>

                  <button
                    onClick={handleListNFT}
                    disabled={!listPrice}
                    className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    List NFT
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buy Modal */}
        {showBuyModal && selectedNFT && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowBuyModal(false)}></div>
              <div className="relative bg-white rounded-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-light text-black">Purchase NFT</h3>
                  <button
                    onClick={() => setShowBuyModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <img
                    src={selectedNFT.image}
                    alt={selectedNFT.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <h4 className="font-light text-black mt-2">{selectedNFT.name}</h4>
                  <p className="text-sm text-gray-600">Seller: {selectedNFT.owner}</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Price</span>
                      <span className="font-light text-black text-lg">{selectedNFT.price}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-light text-black">Traits</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedNFT.traits?.map((trait, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                          <p className="text-gray-600">{trait.trait_type}</p>
                          <p className="text-black">{trait.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleBuyNFT}
                    className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Buy Now for {selectedNFT.price}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NFT Details Modal - Wider Design */}
        {showNFTModal && selectedMarketplaceNFT && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="relative">
                <button
                  onClick={() => setShowNFTModal(false)}
                  className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                  <X className="w-4 h-4 stroke-2" />
                </button>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                {/* Left Side - NFT Media */}
                <div className="space-y-6">
                  <div className="aspect-square bg-white rounded-2xl overflow-hidden border border-gray-200">
                    <video
                      src={selectedMarketplaceNFT.video}
                      poster={selectedMarketplaceNFT.fallback}
                      alt={selectedMarketplaceNFT.name}
                      className="w-full h-full object-contain"
                      autoPlay
                      loop
                      muted
                      playsInline
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const img = document.createElement('img');
                        img.src = selectedMarketplaceNFT.fallback;
                        img.className = 'w-full h-full object-contain';
                        img.alt = selectedMarketplaceNFT.name;
                        e.currentTarget.parentNode.appendChild(img);
                      }}
                    />
                  </div>

                  {/* Collection Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Collection</h3>
                    <p className="text-lg font-semibold text-black">{selectedMarketplaceNFT.collection}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {selectedMarketplaceNFT.rarity}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side - NFT Details */}
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedMarketplaceNFT.name}
                    </h1>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-black">
                        {selectedMarketplaceNFT.price}
                      </span>
                      <span className="text-sm text-gray-500">Current Price</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {selectedMarketplaceNFT.description}
                    </p>
                  </div>

                  {/* Benefits */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Membership Benefits</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedMarketplaceNFT.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                          <span className="text-sm text-gray-700">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => window.open(selectedMarketplaceNFT.opensea, '_blank')}
                      className="w-full bg-black text-white py-4 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={18} />
                      Buy on OpenSea for {selectedMarketplaceNFT.price}
                    </button>
                    <button
                      onClick={() => window.open('mailto:nft@privatecharterx.com', '_blank')}
                      className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                      Contact NFT Team
                    </button>
                  </div>

                  {/* Additional Info */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="font-medium text-blue-900 mb-2">How It Works</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>1. Buy NFT on OpenSea (0.5 ETH)</p>
                      <p>2. Connect wallet to website</p>
                      <p>3. Get benefits immediately</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStaking = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Staking</h2>
          <p className="text-sm text-gray-600 mt-1">Stake tokens and earn rewards</p>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="text-center py-8">
          <TrendingDown size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Staking Rewards</h3>
          <p className="text-gray-600">Stake your tokens to earn passive income and support the network.</p>
        </div>
      </div>
    </div>
  );

  // Services Overview - Main Services Landing Page
  const renderServicesOverview = () => {
    const serviceCategories = [
      {
        id: 'jets',
        title: 'Private Jets',
        description: 'Access our fleet of luxury private jets for charter worldwide',
        icon: '✈️',
        stats: { available: '245 Aircraft', routes: '2,500+ Routes' },
        color: 'blue'
      },
      {
        id: 'helicopters',
        title: 'Helicopter Charter',
        description: 'Urban mobility and scenic flights with premium helicopters',
        icon: '🚁',
        stats: { available: '89 Helicopters', routes: '150+ Locations' },
        color: 'green'
      },
      {
        id: 'cars',
        title: 'Luxury Cars',
        description: 'Ground transportation with high-end vehicles and professional drivers',
        icon: '🚗',
        stats: { available: '312 Vehicles', cities: '85 Cities' },
        color: 'purple'
      },
      {
        id: 'yachts',
        title: 'Yachts & Boats',
        description: 'Luxury yacht charters for maritime adventures and events',
        icon: '🛥️',
        stats: { available: '127 Yachts', destinations: '200+ Destinations' },
        color: 'cyan'
      },
      {
        id: 'adventures',
        title: 'Adventure Packages',
        description: 'Curated travel experiences combining multiple luxury services',
        icon: '🏔️',
        stats: { packages: '45 Packages', destinations: '30 Countries' },
        color: 'amber'
      },
      {
        id: 'certificates',
        title: 'CO₂ Certificates',
        description: 'Carbon offset solutions for sustainable luxury travel',
        icon: '🌱',
        stats: { offset: '10,500 tCO₂', projects: '25 Projects' },
        color: 'emerald'
      }
    ];

    const quickStats = {
      totalBookings: '2,847',
      activeServices: '6',
      satisfaction: '98.5%',
      globalReach: '150+'
    };

    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-light text-gray-900">Global Mobility Services</h1>
                <p className="text-gray-600">Premium transportation and travel solutions worldwide</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-lg font-semibold text-gray-900">{quickStats.totalBookings}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Active Services</p>
              <p className="text-lg font-semibold text-gray-900">{quickStats.activeServices}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Satisfaction</p>
              <p className="text-lg font-semibold text-green-600">{quickStats.satisfaction}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Global Reach</p>
              <p className="text-lg font-semibold text-gray-900">{quickStats.globalReach} Countries</p>
            </div>
          </div>
        </div>

        {/* Service Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviceCategories.map((service) => (
            <div
              key={service.id}
              onClick={() => setActiveSection(service.id)}
              className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 bg-${service.color}-100 rounded-xl flex items-center justify-center text-xl`}>
                  {service.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </h3>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>

              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                {service.description}
              </p>

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(service.stats).map(([key, value]) => (
                  <div key={key} className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 capitalize">{key}</p>
                    <p className="text-sm font-medium text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity & Popular Services */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
            <div className="space-y-3">
              {[
                { service: 'Private Jet', route: 'NYC → LAX', time: '2 hours ago', status: 'confirmed' },
                { service: 'Helicopter', route: 'Manhattan Tour', time: '4 hours ago', status: 'completed' },
                { service: 'Luxury Car', route: 'Airport Transfer', time: '1 day ago', status: 'completed' },
                { service: 'Yacht Charter', route: 'Miami Beach', time: '2 days ago', status: 'pending' }
              ].map((booking, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{booking.service}</p>
                    <p className="text-xs text-gray-600">{booking.route}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{booking.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Destinations */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Destinations</h3>
            <div className="space-y-3">
              {[
                { destination: 'Los Angeles', bookings: '156 bookings', trend: '+12%' },
                { destination: 'Miami', bookings: '143 bookings', trend: '+8%' },
                { destination: 'London', bookings: '132 bookings', trend: '+15%' },
                { destination: 'Dubai', bookings: '118 bookings', trend: '+22%' }
              ].map((dest, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{dest.destination}</p>
                    <p className="text-xs text-gray-600">{dest.bookings}</p>
                  </div>
                  <span className="text-xs font-medium text-green-600">{dest.trend}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Tokenization Section - Comprehensive Implementation
  const renderTokenization = () => {

    // Sample tokenization data
    const tokenizedAssets = [
      {
        id: 1,
        name: 'Gulfstream G650 #1',
        type: 'Aircraft',
        totalValue: '$65,000,000',
        tokenizedValue: '$32,500,000',
        tokenSupply: '32,500,000',
        price: '$1.00',
        status: 'Active',
        yield: '8.5%',
        holders: 156,
        liquidity: '85%'
      },
      {
        id: 2,
        name: 'Manhattan Office Building',
        type: 'Real Estate',
        totalValue: '$120,000,000',
        tokenizedValue: '$60,000,000',
        tokenSupply: '60,000,000',
        price: '$1.00',
        status: 'Active',
        yield: '6.2%',
        holders: 312,
        liquidity: '92%'
      },
      {
        id: 3,
        name: 'Art Collection Portfolio',
        type: 'Art & Collectibles',
        totalValue: '$25,000,000',
        tokenizedValue: '$12,500,000',
        tokenSupply: '12,500,000',
        price: '$1.00',
        status: 'Pending',
        yield: '4.8%',
        holders: 89,
        liquidity: '67%'
      }
    ];

    const marketStats = {
      totalValueLocked: '$157,500,000',
      totalTokens: '105,000,000',
      averageYield: '6.8%',
      activeAssets: 3,
      totalHolders: 557
    };

    const handleTokenize = async () => {
      setTokenizationIsProcessing(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Handle tokenization logic
        alert('Tokenization request submitted successfully!');
        setTokenizationTokenAmount('');
        setTokenizationSelectedAsset('');
      } catch (error) {
        alert('Error processing tokenization request');
      } finally {
        setTokenizationIsProcessing(false);
      }
    };

    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 flex items-center justify-center">
                <Coins className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-light text-gray-900">Asset Tokenization</h1>
                <p className="text-gray-600">Transform real-world assets into digital tokens</p>
              </div>
            </div>
            <button
              onClick={() => setTokenizationShowCreateModal(true)}
              className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Token
            </button>
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Value Locked</p>
              <p className="text-lg font-semibold text-gray-900">{marketStats.totalValueLocked}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Tokens</p>
              <p className="text-lg font-semibold text-gray-900">{marketStats.totalTokens}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Average Yield</p>
              <p className="text-lg font-semibold text-black">{marketStats.averageYield}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Active Assets</p>
              <p className="text-lg font-semibold text-gray-900">{marketStats.activeAssets}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Holders</p>
              <p className="text-lg font-semibold text-gray-900">{marketStats.totalHolders}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border border-gray-100">
          <div className="flex border-b border-gray-100">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'assets', label: 'Tokenized Assets', icon: Building },
              { id: 'portfolio', label: 'My Portfolio', icon: Wallet },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTokenizationActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-light transition-all duration-200 border-b-2 ${
                  tokenizationActiveTab === tab.id
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-600 hover:text-black'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {tokenizationActiveTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Plus className="w-5 h-5 text-black" />
                    <span className="text-black font-light">Tokenize New Asset</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <ShoppingBag className="w-5 h-5 text-black" />
                    <span className="text-black font-light">Buy Tokens</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <ArrowUpRight className="w-5 h-5 text-black" />
                    <span className="text-black font-light">Sell Tokens</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <TrendingUp className="w-5 h-5 text-black" />
                    <span className="text-black font-light">View Analytics</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    { type: 'purchase', asset: 'Gulfstream G650 #1', amount: '10,000 tokens', time: '2 hours ago', user: 'investor@email.com' },
                    { type: 'yield', asset: 'Manhattan Office Building', amount: '$2,450 yield', time: '6 hours ago', user: 'holder@email.com' },
                    { type: 'sale', asset: 'Art Collection Portfolio', amount: '5,000 tokens', time: '1 day ago', user: 'trader@email.com' },
                    { type: 'tokenization', asset: 'Luxury Yacht Marina', amount: 'Asset tokenized', time: '2 days ago', user: 'admin@platform.com' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
                          {activity.type === 'purchase' && <ArrowDownLeft className="w-4 h-4 text-black" />}
                          {activity.type === 'yield' && <TrendingUp className="w-4 h-4 text-black" />}
                          {activity.type === 'sale' && <ArrowUpRight className="w-4 h-4 text-black" />}
                          {activity.type === 'tokenization' && <Coins className="w-4 h-4 text-black" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{activity.asset}</p>
                          <p className="text-xs text-gray-600">{activity.amount} • {activity.user}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tokenizationActiveTab === 'assets' && (
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Tokenized Assets</h3>
              <p className="text-gray-600">Browse and invest in tokenized real-world assets</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tokenizedAssets.map((asset) => (
                  <div key={asset.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        asset.status === 'Active' ? 'bg-black text-white' : 'bg-gray-200 text-gray-800'
                      }`}>
                        {asset.status}
                      </span>
                      <span className="text-xs text-gray-500">{asset.type}</span>
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-2">{asset.name}</h4>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Value</span>
                        <span className="font-medium">{asset.totalValue}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tokenized</span>
                        <span className="font-medium">{asset.tokenizedValue}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Token Price</span>
                        <span className="font-medium">{asset.price}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Yield</span>
                        <span className="font-medium text-green-600">{asset.yield}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{asset.holders} holders</span>
                      <span>{asset.liquidity} liquidity</span>
                    </div>

                    <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tokenizationActiveTab === 'portfolio' && (
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">My Tokenization Portfolio</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600 mb-1">Total Investment</p>
                <p className="text-xl font-semibold text-purple-700">$45,750</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 mb-1">Current Value</p>
                <p className="text-xl font-semibold text-green-700">$49,120</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 mb-1">Total Return</p>
                <p className="text-xl font-semibold text-blue-700">+7.36%</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-sm text-amber-600 mb-1">Monthly Yield</p>
                <p className="text-xl font-semibold text-amber-700">$312</p>
              </div>
            </div>

            <div className="text-center py-8">
              <Building size={48} className="mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Investments Yet</h4>
              <p className="text-gray-600 mb-4">Start building your tokenized asset portfolio today</p>
              <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Browse Assets
              </button>
            </div>
          </div>
        )}

        {tokenizationActiveTab === 'analytics' && (
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Tokenization Analytics</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Market Performance</h4>
                <div className="text-center py-8">
                  <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Interactive charts coming soon</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Yield Distribution</h4>
                <div className="text-center py-8">
                  <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Yield analytics coming soon</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Token Modal */}
        {tokenizationShowCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black opacity-50" onClick={() => setTokenizationShowCreateModal(false)}></div>
              <div className="relative bg-white rounded-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Token</h3>
                  <button
                    onClick={() => setTokenizationShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Asset Type</label>
                    <select
                      value={tokenizationSelectedAsset}
                      onChange={(e) => setTokenizationSelectedAsset(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                    >
                      <option value="">Select Asset Type</option>
                      <option value="aircraft">Aircraft</option>
                      <option value="real-estate">Real Estate</option>
                      <option value="art">Art & Collectibles</option>
                      <option value="yacht">Yacht</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Token Amount</label>
                    <input
                      type="number"
                      value={tokenizationTokenAmount}
                      onChange={(e) => setTokenizationTokenAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                      placeholder="Enter token amount"
                    />
                  </div>

                  <button
                    onClick={handleTokenize}
                    disabled={!tokenizationSelectedAsset || !tokenizationTokenAmount || tokenizationIsProcessing}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {tokenizationIsProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      'Create Token'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Tokenization Section Renders
  const renderNetwork = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Network</h2>
          <p className="text-sm text-gray-600 mt-1">Blockchain network settings and status</p>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="text-center py-8">
          <Network size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Network Configuration</h3>
          <p className="text-gray-600">Manage blockchain networks, RPC endpoints, and connection settings.</p>
        </div>
      </div>
    </div>
  );

  const renderWhitelist = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Whitelisted Addresses</h2>
          <p className="text-sm text-gray-600 mt-1">Manage trusted wallet addresses</p>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="text-center py-8">
          <UserCheck size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Address Whitelist</h3>
          <p className="text-gray-600">Add and manage whitelisted addresses for secure transactions.</p>
        </div>
      </div>
    </div>
  );

  const renderWeb3Access = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Web3 Access</h2>
          <p className="text-sm text-gray-600 mt-1">Web3 permissions and access control</p>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="text-center py-8">
          <Key size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Management</h3>
          <p className="text-gray-600">Control Web3 application permissions and access levels.</p>
        </div>
      </div>
    </div>
  );

  const renderTransactionHistory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
          <p className="text-sm text-gray-600 mt-1">Complete transaction log and history</p>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="text-center py-8">
          <History size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Transaction Log</h3>
          <p className="text-gray-600">View detailed history of all your blockchain transactions.</p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'services':
        return renderServicesOverview();
      case 'tokenization':
        return renderTokenization();
      case 'profile':
        return (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                    <User size={24} className="text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{(user as any)?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}</h3>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>📍 Sofia, Bulgaria</span>
                      <span>🌐 185.94.188.123</span>
                    </div>
                  </div>
                </div>

                {kycStatus === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      KYC under review - we'll notify you within 24 hours
                    </p>
                  </div>
                )}
              </div>

              {/* Toggle Switcher Design for Profile Sections */}
              <div className="bg-gray-100 rounded-xl p-2">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  <button
                    onClick={() => setCurrentView('overview')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      currentView === 'overview'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setCurrentView('requests')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center ${
                      currentView === 'requests'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <span>Requests</span>
                    {dashboardUserRequests.length > 0 && (
                      <span className="ml-2 bg-gray-400 text-white text-xs rounded-full px-2 py-0.5">
                        {dashboardUserRequests.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setCurrentView('co2-certificates')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      currentView === 'co2-certificates'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    Certificates
                  </button>
                  <button
                    onClick={() => setCurrentView('wallet')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      currentView === 'wallet'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    Wallet & NFTs
                  </button>
                  {kycStatus !== 'verified' && (
                    <button
                      onClick={() => setCurrentView('kyc')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        currentView === 'kyc'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      KYC Verify
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentView('profile-settings')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      currentView === 'profile-settings'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    Settings
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="min-h-[500px]">
              {currentView === 'overview' && (
                <div className="space-y-6 p-6">
                  {renderOverview()}
                </div>
              )}
              {currentView === 'requests' && (
                <div className="space-y-6 p-6">
                  {renderRequests()}
                </div>
              )}
              {currentView === 'co2-certificates' && (
                <div className="space-y-6 p-6">
                  {renderCO2Certificates()}
                </div>
              )}
              {currentView === 'wallet' && (
                <div className="space-y-6 p-6">
                  {renderWallet()}
                </div>
              )}
              {currentView === 'kyc' && (
                <div className="p-6">
                  <KYCForm
                    onComplete={() => {
                      setKycStatus('pending');
                      setCurrentView('overview');
                    }}
                  />
                </div>
              )}
              {currentView === 'profile-settings' && (
                <div className="p-6">
                  <ProfileSettings />
                </div>
              )}
            </div>
          </div>
        );
      case 'jets':
        return renderPrivateJetCharter();
      case 'helicopters':
        return renderHelicopterCharter();
      case 'charter':
        return renderPrivateJetCharter();
      case 'certificates':
        return renderCertificates();
      case 'marketplace':
        return renderMarketplace();
      case 'nft-marketplace':
        return renderNFTMarketplace();
      case 'carbon-marketplace':
        return renderCarbonMarketplace();
      case 'ai-designer':
        return renderAIDesigner();
      case 'wallet':
        return renderWallet();
      case 'dao-governance':
        return renderVoting();
      case 'create-dao':
        return renderCreateDAO();
      case 'active-dao':
        return renderDAOProjects();
      case 'voting':
        return renderVoting();
      case 'adventures':
        return renderAdventurePackages();
      case 'yachts':
        return renderCards(yachts, 'yachts');
      case 'cars':
        return renderLuxuryCars();
      case 'accounts':
        return renderAccounts();
      case 'assets':
        return renderAssets();
      case 'nfts':
        return renderNFTs();
      case 'staking':
        return renderStaking();
      case 'network':
        return renderNetwork();
      case 'whitelist':
        return renderWhitelist();
      case 'web3-access':
        return renderWeb3Access();
      case 'transaction-history':
        return renderTransactionHistory();
      case 'map':
        return renderMap();
      default:
        return (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="text-xl font-light text-gray-900">{getPageTitle()} - Coming Soon</h2>
          </div>
        );
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100">
      <div className="p-6 h-screen flex gap-6">
        {/* Expandable Sidebar - Outside white component */}
        <div className={`${sidebarExpanded ? 'w-72' : 'w-20'} h-full flex flex-col items-center justify-between py-4 overflow-hidden transition-all duration-300`}>
          {/* Top Section: Logo + Navigation */}
          <div className="flex flex-col items-center space-y-1 flex-1 w-full">
            {/* Logo */}
            <div className={`${sidebarExpanded ? 'w-full h-20' : 'w-12 h-12'} flex items-center justify-center flex-shrink-0 mb-1`}>
              {sidebarExpanded ? (
                <img
                  src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
                  alt="PrivateCharterX"
                  className="h-16 w-auto object-contain"
                />
              ) : (
                <img
                  src="https://i.imgur.com/iu42DU1.png"
                  alt="PrivateCharterX"
                  className="w-12 h-12 object-contain"
                />
              )}
            </div>

            {/* Navigation Items */}
            {navItems.map((item, index) => (
              <div key={index} className="w-full px-3">
                {index > 0 && sidebarExpanded && <div className="border-t border-gray-100 mb-1"></div>}
                {/* Main Navigation Item */}
                <button
                  onClick={() => {
                    // Always set the active section for direct navigation
                    setActiveSection(item.id);

                    // If expandable, also toggle the expansion state
                    if (item.expandable) {
                      if (item.id === 'services') {
                        setServicesExpanded(!servicesExpanded);
                      } else if (item.id === 'funds') {
                        setFundsExpanded(!fundsExpanded);
                      } else if (item.id === 'tokenization') {
                        setTokenizationExpanded(!tokenizationExpanded);
                      } else if (item.id === 'marketplace') {
                        setMarketplaceExpanded(!marketplaceExpanded);
                      }
                    }
                  }}
                  className={`${sidebarExpanded ? 'w-full justify-between px-4' : 'w-12 h-10 justify-center mx-auto'} h-10 rounded-lg flex items-center transition-all duration-300 ${
                    activeSection === item.id || (item.children && item.children.some(child => child.id === activeSection))
                      ? 'bg-black text-white shadow-lg'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                  }`}
                  title={!sidebarExpanded ? item.label : undefined}
                >
                  <div className="flex items-center">
                    <item.icon size={18} className={sidebarExpanded ? 'mr-4' : ''} />
                    {sidebarExpanded && (
                      <span className="text-sm font-light tracking-wide">{item.label}</span>
                    )}
                  </div>
                  {item.expandable && sidebarExpanded && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-300 ${
                        (item.id === 'services' && servicesExpanded) ||
                        (item.id === 'funds' && fundsExpanded) ||
                        (item.id === 'tokenization' && tokenizationExpanded) ||
                        (item.id === 'marketplace' && marketplaceExpanded) ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>

                {/* Expandable Children */}
                {item.expandable && item.children && sidebarExpanded && (
                  <div className={`overflow-hidden transition-all duration-300 ${
                    (item.id === 'services' && servicesExpanded) ||
                    (item.id === 'funds' && fundsExpanded) ||
                    (item.id === 'tokenization' && tokenizationExpanded) ||
                    (item.id === 'marketplace' && marketplaceExpanded)
                      ? 'max-h-96 mt-1' : 'max-h-0'
                  }`}>
                    <div className="space-y-0.5 pl-4">
                      {item.children.map((child, childIndex) => (
                        <button
                          key={childIndex}
                          onClick={() => setActiveSection(child.id)}
                          className={`w-full text-left px-3 py-1.5 rounded-md text-sm font-light tracking-wide transition-all duration-200 ${
                            activeSection === child.id
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                        >
                          <div className="flex items-center">
                            <child.icon size={16} className="mr-3" />
                            {child.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Section: Toggle, Settings, Sign Out */}
          <div className="flex flex-col space-y-1 w-full px-3">
            {/* Toggle Button */}
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className={`${sidebarExpanded ? 'w-full justify-start px-4' : 'w-12 h-10 justify-center mx-auto'} h-10 rounded-lg flex items-center text-gray-400 hover:bg-gray-50 transition-all duration-300`}
              title={!sidebarExpanded ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <ChevronRight className={`w-5 h-5 transition-transform ${sidebarExpanded ? 'rotate-180 mr-4' : ''}`} />
              {sidebarExpanded && (
                <span className="text-sm font-light tracking-wide">Collapse</span>
              )}
            </button>


            {/* Sign Out Button */}
            <button
              className={`${sidebarExpanded ? 'w-full justify-start px-4' : 'w-12 h-10 justify-center mx-auto'} h-10 rounded-lg flex items-center text-red-400 hover:bg-red-50 transition-all duration-300`}
              title={!sidebarExpanded ? 'Sign Out' : undefined}
            >
              <LogOut size={18} className={sidebarExpanded ? 'mr-4' : ''} />
              {sidebarExpanded && (
                <span className="text-sm font-light tracking-wide">Sign Out</span>
              )}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 h-full flex flex-col">
          {/* Header on grey background */}
          <div className="flex items-center justify-between w-full mb-6">
            <div>
              <h1 className="text-2xl font-light text-gray-900">{getPageTitle()}</h1>
              <p className="text-sm text-gray-600 font-light">Welcome back, Captain.</p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search assets"
                  className="w-64 pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 outline-none text-sm font-light placeholder-gray-400 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200 shadow-sm"
                />
              </div>

              {/* Basket Button */}
              <button
                onClick={() => setShowBasket(true)}
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200 relative"
                title="Basket"
              >
                <ShoppingBag size={16} />
                {basketItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {basketItems.length}
                  </span>
                )}
              </button>

              {/* Wallet Connect */}
              <div className="relative">
                <WalletMenu onConnect={handleWalletConnect} iconOnly={true} />
              </div>

              {/* Settings Button */}
              <button
                onClick={() => setActiveSection('settings')}
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200"
                title="Settings"
              >
                <Settings size={16} />
              </button>

              {/* Profile Button */}
              <button
                onClick={() => setActiveSection('profile')}
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200"
                title="Profile"
              >
                <User size={16} />
              </button>
            </div>
          </div>

          {/* White Content Container */}
          <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-lg">
            <div className="h-full overflow-y-auto p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Basket Sidebar */}
    {showBasket && (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowBasket(false)}></div>
        <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Service Basket</h2>
              <button
                onClick={() => setShowBasket(false)}
                className="rounded-md p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {basketItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 py-8">
                  <ShoppingBag size={64} className="text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your basket is empty</h3>
                  <p className="text-center text-sm text-gray-500 mb-6">
                    Add luxury cars, boats, or other services to get started
                  </p>

                  {/* Quick Add Suggestions */}
                  <div className="w-full space-y-3">
                    <button
                      onClick={() => addToBasket({
                        type: 'luxury-car',
                        name: 'Rolls-Royce Phantom',
                        category: 'Ultra Luxury',
                        price: 350,
                        duration: 'hourly',
                        location: 'London, Paris, Monaco',
                        image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop'
                      })}
                      className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Car size={20} className="text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">Add Luxury Car</div>
                        <div className="text-sm text-gray-500">Premium vehicles</div>
                      </div>
                    </button>

                    <button
                      onClick={() => addToBasket({
                        type: 'yacht',
                        name: 'Luxury Yacht Charter',
                        category: 'Yacht Charter',
                        price: 1200,
                        duration: 'daily',
                        location: 'Mediterranean, Caribbean',
                        image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop'
                      })}
                      className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Ship size={20} className="text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">Add Yacht Charter</div>
                        <div className="text-sm text-gray-500">Luxury boats</div>
                      </div>
                    </button>

                    <button
                      onClick={() => addToBasket({
                        type: 'helicopter',
                        name: 'Helicopter Charter',
                        category: 'City Transfer',
                        price: 800,
                        duration: 'hourly',
                        location: 'Major Cities',
                        image: 'https://images.unsplash.com/photo-1544737151-6e4b09743733?w=400&h=300&fit=crop'
                      })}
                      className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Helicopter size={20} className="text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">Add Helicopter</div>
                        <div className="text-sm text-gray-500">City transfers</div>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    {basketItems.map((item, index) => (
                      <div key={item.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{item.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{item.category}</p>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">{item.location}</div>
                            <div className="font-semibold text-gray-900">
                              €{item.price}/{item.duration === 'hourly' ? 'hour' : 'day'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromBasket(item.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Items:</span>
                      <span>{basketItems.length}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <button
                      className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                      onClick={() => {
                        // Handle direct booking for luxury cars and boats
                        const bookableItems = basketItems.filter(item =>
                          item.type === 'luxury-car' || item.type === 'yacht'
                        );
                        if (bookableItems.length > 0) {
                          alert('Direct booking available for luxury cars and yachts!');
                        } else {
                          alert('Request quote for selected services');
                        }
                      }}
                    >
                      <CreditCard size={16} />
                      Book Now (Cars & Boats)
                    </button>

                    <button
                      className="w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                      onClick={() => {
                        alert('Quote request sent for all services');
                        // Here you would send the request to backend
                      }}
                    >
                      <FileText size={16} />
                      Request Quote
                    </button>

                    <button
                      className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      onClick={() => {
                        alert('Service request sent to team');
                        // Here you would send the request to support team
                      }}
                    >
                      <Send size={16} />
                      Send Request
                    </button>

                    <button
                      onClick={clearBasket}
                      className="w-full text-red-600 py-2 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Clear Basket
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Custom White Wallet Connection Modal */}
    <WalletConnect
      show={showWalletModal}
      onClose={() => setShowWalletModal(false)}
      onConnect={handleWalletConnected}
      onError={(error) => console.error('Wallet connection error:', error)}
    />
    </>
  );
};

export default Dashboard;