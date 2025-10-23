import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plane, Zap, Mountain, MapPin, Calendar, Users, 
  Clock, Send, Paperclip, Camera, Sparkles,
  MessageSquare, Star, Globe, Shield, ArrowRight,
  CheckCircle, Loader2, Search, Mic, X, Plus,
  History, Settings, User, CreditCard, Car,
  ChevronRight, ChevronDown, Edit3, Trash2,
  DollarSign, Euro, Bell, CalendarDays, Route,
  Building2, Phone, Filter, Wifi, Heart, Share,
  Menu, SlidersHorizontal, ChevronUp, ChevronLeft,
  Anchor, Ship, LogIn, UserPlus, Grid, List,
  Percent, Info, Leaf, Check, RefreshCw
} from 'lucide-react';
import Map, {
  Source,
  Layer,
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  GeolocateControl
} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import { supabase } from '../lib/supabase';

// Empty Leg Interface
interface EmptyLegOffer {
  id: string;
  from: string;
  to: string;
  from_iata: string;
  to_iata: string;
  aircraft_type: string;
  category: string;
  capacity: number;
  departure_date: string;
  price: number;
  currency: string;
  operator: string;
  booking_link: string;
  aircraft_type_original: string;
  from_country: string;
  to_country: string;
  from_city: string;
  to_city: string;
  departure_time: string;
  arrival_time: string;
  registration: string;
  image_url: string;
  price_usd: number;
  co2_emissions_kg: number;
  co2_offset_cost_eur: number;
  flight_duration_hours: number;
  from_continent?: string;
  to_continent?: string;
}

// Adventure Package Interface
interface AdventurePackage {
  id: string;
  title: string;
  description: string;
  location: string;
  country: string;
  region: string;
  duration: string;
  duration_days: number;
  price: number;
  currency: string;
  category: string;
  activities: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  group_size: number;
  image_url: string;
  is_featured: boolean;
  inclusions: string[];
  exclusions: string[];
  start_date?: string;
  end_date?: string;
  price_usd: number;
}

interface Message {
  id: number;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  metadata?: any;
  serviceCards?: ServiceCard[];
  emptyLegs?: EmptyLegOffer[];
  adventurePackages?: AdventurePackage[];
  suggestedAddOns?: ServiceCard[];
}

interface ServiceCard {
  id: string;
  type: 'private-jet' | 'luxury-car' | 'adventure-package' | 'helicopter' | 'yacht' | 'empty-leg' | 'ground-transport';
  title: string;
  subtitle: string;
  price: number;
  currency: string;
  details: any;
  image?: string;
}

interface CartItem extends ServiceCard {
  quantity?: number;
  customizations?: any;
}

interface BookingModal {
  isOpen: boolean;
  service: ServiceCard | null;
  type: 'private-jet' | 'luxury-car' | 'adventure-package' | 'helicopter' | 'yacht' | 'empty-leg' | 'ground-transport' | null;
}

// Aircraft categories with CO2 emissions and offset costs
const aircraftCategories = {
  'Very Light Jet': { emissionsPerHour: 0.8, offsetCostPerHour: 64 },
  'Light Jet': { emissionsPerHour: 1.2, offsetCostPerHour: 96 },
  'Mid-Size': { emissionsPerHour: 1.8, offsetCostPerHour: 144 },
  'Super Mid': { emissionsPerHour: 2.2, offsetCostPerHour: 176 },
  'Heavy Jet': { emissionsPerHour: 3.1, offsetCostPerHour: 248 },
  'Ultra Long': { emissionsPerHour: 3.8, offsetCostPerHour: 304 },
  'default': { emissionsPerHour: 1.2, offsetCostPerHour: 96 }
};

// Function to determine aircraft category from type
const getAircraftCategory = (aircraftType: string): keyof typeof aircraftCategories => {
  const type = aircraftType.toLowerCase();
  if (type.includes('very light') || type.includes('vlj') || type.includes('citation mustang') || type.includes('phenom 100')) {
    return 'Very Light Jet';
  }
  if (type.includes('light') || type.includes('citation cj') || type.includes('phenom 300') || type.includes('nextant 400xt')) {
    return 'Light Jet';
  }
  if (type.includes('mid-size') || type.includes('midsize') || type.includes('citation x') || type.includes('learjet 60') || type.includes('hawker 850xp')) {
    return 'Mid-Size';
  }
  if (type.includes('super mid') || type.includes('super midsize') || type.includes('gulfstream g280') || type.includes('citation sovereign') || type.includes('falcon 2000')) {
    return 'Super Mid';
  }
  if (type.includes('heavy') || type.includes('gulfstream g450') || type.includes('gulfstream g550') || type.includes('falcon 7x') || type.includes('global 5000')) {
    return 'Heavy Jet';
  }
  if (type.includes('ultra long') || type.includes('ultra-long') || type.includes('gulfstream g650') || type.includes('global 6000') || type.includes('falcon 8x')) {
    return 'Ultra Long';
  }
  return 'default';
};

// Function to calculate flight distance based on continents
const calculateFlightDistance = (fromContinent: string, toContinent: string): number => {
  const continentDistances: Record<string, Record<string, number>> = {
    'North America': {
      'North America': 2000,
      'South America': 4000,
      'Europe': 7000,
      'Asia': 11000,
      'Africa': 12000,
      'Oceania': 13000
    },
    'South America': {
      'North America': 4000,
      'South America': 2500,
      'Europe': 9000,
      'Asia': 18000,
      'Africa': 8000,
      'Oceania': 14000
    },
    'Europe': {
      'North America': 7000,
      'South America': 9000,
      'Europe': 1000,
      'Asia': 6000,
      'Africa': 3500,
      'Oceania': 17000
    },
    'Asia': {
      'North America': 11000,
      'South America': 18000,
      'Europe': 6000,
      'Asia': 3000,
      'Africa': 7000,
      'Oceania': 8000
    },
    'Africa': {
      'North America': 12000,
      'South America': 8000,
      'Europe': 3500,
      'Asia': 7000,
      'Africa': 2500,
      'Oceania': 11000
    },
    'Oceania': {
      'North America': 13000,
      'South America': 14000,
      'Europe': 17000,
      'Asia': 8000,
      'Africa': 11000,
      'Oceania': 2000
    }
  };
  // Default to a reasonable distance if continents not found
  return continentDistances[fromContinent]?.[toContinent] || 5000;
};

// Function to calculate CO2 emissions and offset cost
const calculateCO2Data = (fromContinent: string, toContinent: string, aircraftType: string) => {
  const category = getAircraftCategory(aircraftType);
  const { emissionsPerHour, offsetCostPerHour } = aircraftCategories[category];
  const distance = calculateFlightDistance(fromContinent, toContinent);
  const flightDurationHours = distance / 800;
  const co2EmissionsTons = emissionsPerHour * flightDurationHours;
  const co2EmissionsKg = Math.round(co2EmissionsTons * 1000);
  const offsetCostEur = Math.round(offsetCostPerHour * flightDurationHours);
  return {
    co2_emissions_kg: co2EmissionsKg,
    co2_offset_cost_eur: offsetCostEur,
    flight_duration_hours: parseFloat(flightDurationHours.toFixed(1))
  };
};

// Function to get continent from airport code, city, or country
const getContinentFromLocation = async (location: string | null | undefined, locationType: 'city' | 'country' | 'airport' = 'airport'): Promise<string> => {
  if (!location) return '';
  
  try {
    // Simple mapping for common locations (in a real app, this would use a proper geocoding service)
    const locationMap: Record<string, string> = {
      // Europe
      'LHR': 'Europe', 'London': 'Europe', 'Paris': 'Europe', 'CDG': 'Europe', 
      'FRA': 'Europe', 'Frankfurt': 'Europe', 'ZRH': 'Europe', 'Zurich': 'Europe',
      'MAD': 'Europe', 'Madrid': 'Europe', 'ROM': 'Europe', 'Rome': 'Europe',
      'AMS': 'Europe', 'Amsterdam': 'Europe', 'BER': 'Europe', 'Berlin': 'Europe',
      // North America
      'JFK': 'North America', 'New York': 'North America', 'LAX': 'North America', 
      'Los Angeles': 'North America', 'MIA': 'North America', 'Miami': 'North America',
      'ORD': 'North America', 'Chicago': 'North America', 'DFW': 'North America', 
      'Dallas': 'North America', 'ATL': 'North America', 'Atlanta': 'North America',
      // Asia
      'NRT': 'Asia', 'Tokyo': 'Asia', 'HKG': 'Asia', 'Hong Kong': 'Asia',
      'SIN': 'Asia', 'Singapore': 'Asia', 'BKK': 'Asia', 'Bangkok': 'Asia',
      'ICN': 'Asia', 'Seoul': 'Asia', 'PEK': 'Asia', 'Beijing': 'Asia',
      // Africa
      'JNB': 'Africa', 'Johannesburg': 'Africa', 'CAI': 'Africa', 'Cairo': 'Africa',
      'DKR': 'Africa', 'Dakar': 'Africa', 'LOS': 'Africa', 'Lagos': 'Africa',
      // South America
      'GRU': 'South America', 'São Paulo': 'South America', 'EZE': 'South America', 
      'Buenos Aires': 'South America', 'BOG': 'South America', 'Bogotá': 'South America',
      // Oceania
      'SYD': 'Oceania', 'Sydney': 'Oceania', 'MEL': 'Oceania', 'Melbourne': 'Oceania',
      'BNE': 'Oceania', 'Brisbane': 'Oceania', 'AKL': 'Oceania', 'Auckland': 'Oceania'
    };
    
    // Check if we have a direct mapping
    if (locationMap[location]) {
      return locationMap[location];
    }
    
    // Try to extract country from location name
    const countries: Record<string, string> = {
      'United States': 'North America', 'USA': 'North America', 'Canada': 'North America',
      'Mexico': 'North America', 'Brazil': 'South America', 'Argentina': 'South America',
      'Chile': 'South America', 'Colombia': 'South America', 'United Kingdom': 'Europe',
      'Germany': 'Europe', 'France': 'Europe', 'Spain': 'Europe', 'Italy': 'Europe',
      'Netherlands': 'Europe', 'Switzerland': 'Europe', 'Austria': 'Europe', 'Belgium': 'Europe',
      'China': 'Asia', 'Japan': 'Asia', 'South Korea': 'Asia', 'India': 'Asia',
      'Thailand': 'Asia', 'Singapore': 'Asia', 'Malaysia': 'Asia', 'Indonesia': 'Asia',
      'South Africa': 'Africa', 'Egypt': 'Africa', 'Nigeria': 'Africa', 'Kenya': 'Africa',
      'Morocco': 'Africa', 'Australia': 'Oceania', 'New Zealand': 'Oceania', 'Fiji': 'Oceania'
    };
    
    // Check if location contains a country name
    for (const [country, continent] of Object.entries(countries)) {
      if (location.toLowerCase().includes(country.toLowerCase())) {
        return continent;
      }
    }
    
    // Default to empty string if we can't determine the continent
    return '';
  } catch (error) {
    console.error('Error looking up continent for location:', location, error);
    return '';
  }
};

// Empty Legs Service Functions
const fetchEmptyLegsFromDB = async (filters?: {
  searchLocation?: string;
  minPrice?: number;
  maxPrice?: number;
  passengers?: number;
  aircraftType?: string;
  departureDate?: string;
  from?: string;
  to?: string;
}): Promise<EmptyLegOffer[]> => {
  try {
    console.log('Fetching empty legs from EmptyLegs_ table...', filters);
    
    const today = new Date().toISOString().split('T')[0];
    
    let query = supabase
      .from('EmptyLegs_')
      .select('*')
      .gte('departure_date', today)
      .order('departure_date', { ascending: true });
    
    // Apply location filter if provided
    if (filters?.searchLocation && filters.searchLocation.trim()) {
      const location = filters.searchLocation.toLowerCase().trim();
      query = query.or(`from.ilike.%${location}%,to.ilike.%${location}%,from_city.ilike.%${location}%,to_city.ilike.%${location}%,from_iata.ilike.%${location}%,to_iata.ilike.%${location}%,from_country.ilike.%${location}%,to_country.ilike.%${location}%`);
    }
    
    // Apply specific from/to filters if provided
    if (filters?.from && filters.from.trim()) {
      const from = filters.from.toLowerCase().trim();
      query = query.or(`from.ilike.%${from}%,from_city.ilike.%${from}%,from_iata.ilike.%${from}%`);
    }
    
    if (filters?.to && filters.to.trim()) {
      const to = filters.to.toLowerCase().trim();
      query = query.or(`to.ilike.%${to}%,to_city.ilike.%${to}%,to_iata.ilike.%${to}%`);
    }
    
    // Apply price filters if provided
    if (filters?.minPrice !== undefined) {
      query = query.gte('price_usd', filters.minPrice);
    }
    if (filters?.maxPrice !== undefined) {
      query = query.lte('price_usd', filters.maxPrice);
    }
    
    // Apply passenger filter if provided
    if (filters?.passengers !== undefined) {
      query = query.gte('capacity', filters.passengers);
    }
    
    // Apply aircraft type filter if provided
    if (filters?.aircraftType && filters.aircraftType.trim()) {
      const aircraftType = filters.aircraftType.toLowerCase().trim();
      query = query.or(`aircraft_type.ilike.%${aircraftType}%,category.ilike.%${aircraftType}%`);
    }
    
    // Apply departure date filter if provided
    if (filters?.departureDate) {
      const filterDate = new Date(filters.departureDate).toISOString().split('T')[0];
      query = query.gte('departure_date', filterDate);
    }
    
    const { data, error } = await query.limit(10); // Limit to 10 results
    
    if (error) {
      console.error('Error fetching empty legs:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} empty legs`);
    
    // Process data with continent and CO2 information
    const processedData = await Promise.all((data || []).map(async (emptyLeg) => {
      // Use existing continent data if available, otherwise look it up
      let fromContinent = emptyLeg.from_continent;
      let toContinent = emptyLeg.to_continent;
      
      if (!fromContinent && emptyLeg.from_iata) {
        fromContinent = await getContinentFromLocation(emptyLeg.from_iata, 'airport');
      }
      if (!fromContinent && emptyLeg.from_city) {
        fromContinent = await getContinentFromLocation(emptyLeg.from_city, 'city');
      }
      if (!fromContinent && emptyLeg.from) {
        fromContinent = await getContinentFromLocation(emptyLeg.from, 'airport');
      }
      
      if (!toContinent && emptyLeg.to_iata) {
        toContinent = await getContinentFromLocation(emptyLeg.to_iata, 'airport');
      }
      if (!toContinent && emptyLeg.to_city) {
        toContinent = await getContinentFromLocation(emptyLeg.to_city, 'city');
      }
      if (!toContinent && emptyLeg.to) {
        toContinent = await getContinentFromLocation(emptyLeg.to, 'airport');
      }
      
      const co2Data = calculateCO2Data(
        fromContinent || 'Unknown',
        toContinent || 'Unknown',
        emptyLeg.aircraft_type
      );
      
      return {
        ...emptyLeg,
        from_continent: fromContinent || '',
        to_continent: toContinent || '',
        ...co2Data
      };
    }));
    
    return processedData;
    
  } catch (error) {
    console.error('Error in fetchEmptyLegsFromDB:', error);
    return [];
  }
};

// Adventure Packages Service Functions
const fetchAdventurePackagesFromDB = async (filters?: {
  searchLocation?: string;
  minPrice?: number;
  maxPrice?: number;
  activities?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  duration?: number; // in days
  groupSize?: number;
  category?: string;
  startDate?: string;
}): Promise<AdventurePackage[]> => {
  try {
    console.log('Fetching adventure packages from fixed_offers table...', filters);
    
    let query = supabase
      .from('fixed_offers')
      .select('*')
      .order('price_usd', { ascending: true });
    
    // Apply location filter if provided
    if (filters?.searchLocation && filters.searchLocation.trim()) {
      const location = filters.searchLocation.toLowerCase().trim();
      query = query.or(`location.ilike.%${location}%,country.ilike.%${location}%,region.ilike.%${location}%,title.ilike.%${location}%`);
    }
    
    // Apply price filters if provided
    if (filters?.minPrice !== undefined) {
      query = query.gte('price_usd', filters.minPrice);
    }
    if (filters?.maxPrice !== undefined) {
      query = query.lte('price_usd', filters.maxPrice);
    }
    
    // Apply activity filter if provided
    if (filters?.activities && filters.activities.length > 0) {
      const activityConditions = filters.activities.map(activity => 
        `activities.cs.'{"${activity}"'`
      ).join(',');
      query = query.or(activityConditions);
    }
    
    // Apply difficulty filter if provided
    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    
    // Apply duration filter if provided
    if (filters?.duration !== undefined) {
      query = query.lte('duration_days', filters.duration);
    }
    
    // Apply group size filter if provided
    if (filters?.groupSize !== undefined) {
      query = query.gte('group_size', filters.groupSize);
    }
    
    // Apply category filter if provided
    if (filters?.category && filters.category.trim()) {
      const category = filters.category.toLowerCase().trim();
      query = query.or(`category.ilike.%${category}%`);
    }
    
    // Apply start date filter if provided
    if (filters?.startDate) {
      const filterDate = new Date(filters.startDate).toISOString().split('T')[0];
      query = query.gte('start_date', filterDate);
    }
    
    const { data, error } = await query.limit(10); // Limit to 10 results
    
    if (error) {
      console.error('Error fetching adventure packages:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} adventure packages`);
    
    return data || [];
    
  } catch (error) {
    console.error('Error in fetchAdventurePackagesFromDB:', error);
    return [];
  }
};

const convertEmptyLegToServiceCard = (emptyLeg: EmptyLegOffer): ServiceCard => {
  const isNFTFree = emptyLeg.price_usd < 1500;
  
  return {
    id: emptyLeg.id,
    type: 'empty-leg',
    title: `${emptyLeg.from_city || emptyLeg.from} → ${emptyLeg.to_city || emptyLeg.to}`,
    subtitle: `${emptyLeg.aircraft_type} • ${emptyLeg.capacity} seats • Carbon Neutral${isNFTFree ? ' • FREE with NFT' : ''}`,
    price: emptyLeg.price_usd,
    currency: 'USD',
    details: {
      ...emptyLeg,
      route: `${emptyLeg.from_iata || emptyLeg.from} → ${emptyLeg.to_iata || emptyLeg.to}`,
      isNFTFree,
      carbonNeutral: true
    },
    image: emptyLeg.image_url || '✈️'
  };
};

const convertAdventurePackageToServiceCard = (adventurePackage: AdventurePackage): ServiceCard => {
  return {
    id: adventurePackage.id,
    type: 'adventure-package',
    title: adventurePackage.title,
    subtitle: `${adventurePackage.location} • ${adventurePackage.duration} • ${adventurePackage.difficulty} • ${adventurePackage.group_size} people`,
    price: adventurePackage.price_usd,
    currency: 'USD',
    details: {
      ...adventurePackage,
      activities: adventurePackage.activities,
      inclusions: adventurePackage.inclusions,
      exclusions: adventurePackage.exclusions
    },
    image: package.image_url || '🏔️'
  };
};

const TravelDesigner = () => {
  // Auth State
  const { user, isAuthenticated, initializing } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  
  // Landing Page State
  const [showMainModal, setShowMainModal] = useState(false);
  const [landingInput, setLandingInput] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  
  // Main Modal State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [sidebarView, setSidebarView] = useState('chat');
  const [showCart, setShowCart] = useState(false);
  const [bookingModal, setBookingModal] = useState<BookingModal>({ isOpen: false, service: null, type: null });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Map-related state
  const [mapViewState, setMapViewState] = useState({
    longitude: 10.0,
    latitude: 51.0,
    zoom: 4.0,
    pitch: 0,
    bearing: 0
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotationPaused, setRotationPaused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [mapSidebarCollapsed, setMapSidebarCollapsed] = useState(false);
  const [luxuryCars, setLuxuryCars] = useState([]);
  const [adventurePackages, setAdventurePackages] = useState([]);
  const [mapIsLoading, setMapIsLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const mapRef = useRef();
  const MAPBOX_TOKEN = 'pk.eyJ1IjoicHJpdmF0ZWNoYXJ0ZXJ4IiwiYSI6ImNtN2Z4empwNzA2Z2wyanM3NWN2Znpmbm4ifQ.nuvmpND_qtdsauY-n8F_9g';
  
  // Service Options for Landing Page
  const serviceOptions = [
    { 
      id: 'private-jet', 
      label: 'Private Jet Booking', 
      icon: Plane,
      description: 'Luxury private aviation worldwide'
    },
    { 
      id: 'helicopter', 
      label: 'Helicopter Charter', 
      icon: Zap,
      description: 'Premium helicopter services'
    },
    { 
      id: 'yacht', 
      label: 'Yacht Charter', 
      icon: Ship,
      description: 'Exclusive yacht experiences'
    },
    { 
      id: 'luxury-car', 
      label: 'Luxury Cars', 
      icon: Car,
      description: 'Premium vehicle rentals'
    },
    { 
      id: 'adventure', 
      label: 'Adventure Packages', 
      icon: Mountain,
      description: 'Curated luxury experiences'
    },
    { 
      id: 'empty-legs', 
      label: 'Empty Leg Flights', 
      icon: Route,
      description: 'Up to 75% off • Carbon neutral'
    }
  ];
  
  const OFFICE_LOCATIONS = [
    {
      id: "london",
      name: "London Office",
      address: "71-75 Shelton Street, Covent Garden",
      city: "London",
      postcode: "WC2H 9JQ",
      country: "United Kingdom",
      hours: "Mo-Su, 00:00 - 23:59",
      lat: 51.5155,
      lng: -0.1229,
      type: 'office'
    },
    {
      id: "zurich",
      name: "Zurich Office",
      address: "Bahnhofstrasse 37/10",
      city: "Zurich",
      postcode: "8001",
      country: "Switzerland",
      hours: "Mo-Su, 00:00 - 23:59",
      lat: 47.3769,
      lng: 8.5417,
      type: 'office'
    },
    {
      id: "miami",
      name: "Miami Office",
      address: "1000 Brickell Ave, Suite 715",
      city: "Miami",
      postcode: "33131",
      country: "United States",
      hours: "Mo-Su, 00:00 - 23:59",
      lat: 25.7617,
      lng: -80.1918,
      type: 'office'
    }
  ];
  
  const currencies = [
    { code: 'EUR', symbol: '€', icon: Euro },
    { code: 'USD', symbol: '$', icon: DollarSign },
    { code: 'GBP', symbol: '£', icon: DollarSign },
    { code: 'CHF', symbol: 'CHF', icon: DollarSign },
  ];
  
  const getCurrencySymbol = (code) => {
    return currencies.find(c => c.code === code)?.symbol || code;
  };
  
  const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkIsMobile();
      window.addEventListener('resize', checkIsMobile);
      return () => window.removeEventListener('resize', checkIsMobile);
    }, []);
    return isMobile;
  };
  
  const isMobile = useIsMobile();
  
  // Mock data for other services
  const mockServices = {
    privateJets: [
      {
        id: 'vlight-1',
        type: 'private-jet',
        category: 'Very Light Jet',
        name: 'Cessna Citation Mustang',
        pricePerHour: 4300,
        capacity: 4,
        range: 1500,
        currency: 'EUR',
        image: '✈️'
      },
      {
        id: 'light-1',
        type: 'private-jet',
        category: 'Light Jet',
        name: 'Embraer Phenom 300',
        pricePerHour: 5100,
        capacity: 6,
        range: 2500,
        currency: 'EUR',
        image: '✈️'
      },
      {
        id: 'midsize-1',
        type: 'private-jet',
        category: 'Midsize Jet',
        name: 'Hawker 900XP',
        pricePerHour: 6800,
        capacity: 8,
        range: 3500,
        currency: 'EUR',
        image: '✈️'
      }
    ],
    helicopters: [
      {
        id: 'heli-1',
        type: 'helicopter',
        name: 'Eurocopter EC145',
        pricePerHour: 3200,
        capacity: 6,
        range: 680,
        currency: 'EUR',
        image: '🚁'
      }
    ],
    yachts: [
      {
        id: 'yacht-1',
        type: 'yacht',
        name: 'Sunseeker Predator 68',
        pricePerDay: 8500,
        capacity: 8,
        length: 68,
        currency: 'EUR',
        image: '🛥️'
      }
    ],
    luxuryCars: [
      {
        id: 'car-1',
        type: 'luxury-car',
        brand: 'Mercedes-Benz',
        model: 'S-Class',
        pricePerDay: 350,
        location: 'Zurich',
        currency: 'EUR',
        image: '🚗'
      },
      {
        id: 'car-2',
        type: 'ground-transport',
        brand: 'BMW',
        model: '7 Series',
        pricePerTrip: 150,
        location: 'Airport Transfer',
        currency: 'EUR',
        image: '🚗'
      }
    ],
    adventurePackages: [
      {
        id: 'adv-1',
        type: 'adventure-package',
        title: 'Swiss Alps Helicopter Tour',
        location: 'Switzerland',
        duration: '3 hours',
        price: 1200,
        currency: 'EUR',
        image: '🏔️'
      }
    ]
  };
  
  // Enhanced AI Analysis Functions
  const analyzeUserRequest = (message: string, previousMessages: Message[] = []) => {
    const lowerMessage = message.toLowerCase();
    const allMessages = [...previousMessages, { type: 'user', content: message } as Message];
    const conversationText = allMessages.map(m => m.content).join(' ').toLowerCase();
    
    const fromMatch = lowerMessage.match(/from\s+([^to]+)(?=\s+to|\s*$)/);
    const toMatch = lowerMessage.match(/to\s+([^.!?]+)/);
    const passengerMatch = lowerMessage.match(/(\d+)\s*(?:person|people|passenger|pax)/);
    const budgetMatch = lowerMessage.match(/(?:budget|price|cost|spend|afford)\s+(?:under|less than|no more than|max)?\s*\$?(\d+)/);
    const aircraftMatch = lowerMessage.match(/(?:aircraft|jet|plane)\s+(?:type|model)?\s+([a-zA-Z0-9\s]+)/);
    const dateMatch = lowerMessage.match(/(?:date|departure|leave|fly)\s+(?:on)?\s+([a-zA-Z0-9\s]+)/);
    const durationMatch = lowerMessage.match(/(?:duration|stay|trip)\s+(?:of|for)?\s+(\d+)\s*(?:days|day|d)/);
    const activityMatch = lowerMessage.match(/(?:activity|activities|do|doing|like|enjoy)\s+([a-zA-Z\s]+)/);
    const difficultyMatch = lowerMessage.match(/(?:difficulty|level|challenge)\s+(easy|medium|hard|beginner|intermediate|advanced)/);
    
    // Check for service types
    const needsJet = conversationText.includes('private jet') || 
                    conversationText.includes('jet charter') || 
                    conversationText.includes('private flight') ||
                    conversationText.includes('fly private');
                    
    const needsEmptyLeg = conversationText.includes('empty leg') || 
                          conversationText.includes('empty leg flight') || 
                          conversationText.includes('discount flight') ||
                          conversationText.includes('last minute') ||
                          conversationText.includes('cheap flight') ||
                          conversationText.includes('deal');
                          
    const needsCar = conversationText.includes('car') || 
                    conversationText.includes('transport') || 
                    conversationText.includes('drive') ||
                    conversationText.includes('ground transportation') ||
                    conversationText.includes('airport transfer');
                    
    const needsAdventure = conversationText.includes('adventure') || 
                          conversationText.includes('tour') || 
                          conversationText.includes('experience') ||
                          conversationText.includes('package') ||
                          conversationText.includes('trip') ||
                          conversationText.includes('vacation') ||
                          conversationText.includes('holiday') ||
                          conversationText.includes('activities');
                          
    const needsYacht = conversationText.includes('yacht') || 
                      conversationText.includes('boat') || 
                      conversationText.includes('charter') ||
                      conversationText.includes('cruise');
                      
    const needsHelicopter = conversationText.includes('helicopter') || 
                            conversationText.includes('heli');
    
    // Extract location from various patterns
    const locationKeywords = ['to', 'from', 'in', 'near', 'around', 'visiting', 'going'];
    let searchLocation = null;
    
    if (toMatch) {
      searchLocation = toMatch[1].trim();
    } else if (fromMatch) {
      searchLocation = fromMatch[1].trim();
    } else {
      // Look for destination patterns
      for (const keyword of locationKeywords) {
        const locationMatch = lowerMessage.match(new RegExp(`${keyword}\\s+([a-zA-Z\\s,]+?)(?:\\s+(?:with|for|and|on|at|by)|[.!?]|$)`));
        if (locationMatch) {
          searchLocation = locationMatch[1].trim();
          break;
        }
      }
    }
    
    // Check if user has already selected items
    const hasSelectedEmptyLeg = cartItems.some(item => item.type === 'empty-leg');
    const hasSelectedAdventure = cartItems.some(item => item.type === 'adventure-package');
    
    return {
      from: fromMatch ? fromMatch[1].trim() : null,
      to: toMatch ? toMatch[1].trim() : null,
      searchLocation,
      passengers: passengerMatch ? parseInt(passengerMatch[1]) : null,
      budget: budgetMatch ? parseInt(budgetMatch[1]) : null,
      aircraftType: aircraftMatch ? aircraftMatch[1].trim() : null,
      departureDate: dateMatch ? dateMatch[1].trim() : null,
      duration: durationMatch ? parseInt(durationMatch[1]) : null,
      activities: activityMatch ? activityMatch[1].trim().split(',').map(a => a.trim()) : null,
      difficulty: difficultyMatch ? 
        (difficultyMatch[1] === 'beginner' ? 'easy' : 
         difficultyMatch[1] === 'intermediate' ? 'medium' : 
         difficultyMatch[1] === 'advanced' ? 'hard' : difficultyMatch[1] as 'easy' | 'medium' | 'hard') : null,
      needsJet,
      needsCar,
      needsAdventure,
      needsEmptyLeg,
      needsYacht,
      needsHelicopter,
      hasSelectedEmptyLeg,
      hasSelectedAdventure,
      conversationContext: conversationText
    };
  };
  
  // Enhanced Service Recommendations
  const generateServiceRecommendations = async (analysis: any, previousMessages: Message[] = []) => {
    const recommendations: ServiceCard[] = [];
    const suggestedAddOns: ServiceCard[] = [];
    const adventurePackages: AdventurePackage[] = [];
    
    // EMPTY LEGS - High priority for cost-conscious searches
    if (analysis.needsEmptyLeg || analysis.searchLocation || analysis.to || analysis.from) {
      console.log('Fetching empty legs for recommendation...', analysis.searchLocation);
      
      try {
        const filters: any = {};
        
        if (analysis.passengers) {
          filters.passengers = analysis.passengers;
        }
        
        if (analysis.budget) {
          filters.maxPrice = analysis.budget;
        }
        
        if (analysis.aircraftType) {
          filters.aircraftType = analysis.aircraftType;
        }
        
        if (analysis.departureDate) {
          filters.departureDate = analysis.departureDate;
        }
        
        if (analysis.from) {
          filters.from = analysis.from;
        }
        
        if (analysis.to) {
          filters.to = analysis.to;
        }
        
        if (analysis.searchLocation) {
          filters.searchLocation = analysis.searchLocation;
        }
        
        const emptyLegsData = await fetchEmptyLegsFromDB(filters);
        
        // Convert to service cards
        const emptyLegCards = emptyLegsData.map(emptyLeg => convertEmptyLegToServiceCard(emptyLeg));
        recommendations.push(...emptyLegCards);
        
        console.log(`Added ${emptyLegsData.length} empty leg recommendations`);
        
        // If user has selected an empty leg, suggest ground transportation
        if (analysis.hasSelectedEmptyLeg || recommendations.some(r => r.type === 'empty-leg')) {
          // Add ground transportation options
          const groundTransport = mockServices.luxuryCars
            .filter(car => car.type === 'ground-transport')
            .map(car => ({
              id: car.id,
              type: 'ground-transport' as const,
              title: `${car.brand} ${car.model} - Airport Transfer`,
              subtitle: `Premium ground transportation • ${car.location}`,
              price: car.pricePerTrip,
              currency: car.currency,
              details: car,
              image: car.image
            }));
          
          suggestedAddOns.push(...groundTransport);
        }
      } catch (error) {
        console.error('Error fetching empty legs for recommendations:', error);
      }
    }
    
    // ADVENTURE PACKAGES
    if (analysis.needsAdventure || analysis.searchLocation) {
      console.log('Fetching adventure packages for recommendation...', analysis.searchLocation);
      
      try {
        const filters: any = {};
        
        if (analysis.searchLocation) {
          filters.searchLocation = analysis.searchLocation;
        }
        
        if (analysis.budget) {
          filters.maxPrice = analysis.budget;
        }
        
        if (analysis.duration) {
          filters.duration = analysis.duration;
        }
        
        if (analysis.activities) {
          filters.activities = analysis.activities;
        }
        
        if (analysis.difficulty) {
          filters.difficulty = analysis.difficulty;
        }
        
        if (analysis.passengers) {
          filters.groupSize = analysis.passengers;
        }
        
        const packagesData = await fetchAdventurePackagesFromDB(filters);
        
        // Store packages for direct display
        adventurePackages.push(...packagesData);
        
        // Convert to service cards
        const packageCards = packagesData.map(pkg => convertAdventurePackageToServiceCard(pkg));
        recommendations.push(...packageCards);
        
        console.log(`Added ${packagesData.length} adventure package recommendations`);
        
        // If user has selected an adventure package, suggest transportation
        if (analysis.hasSelectedAdventure || recommendations.some(r => r.type === 'adventure-package')) {
          // Add transportation options
          const transportOptions = [
            ...mockServices.helicopters.map(heli => ({
              id: heli.id,
              type: 'helicopter' as const,
              title: heli.name,
              subtitle: `Helicopter transfer • ${heli.capacity} passengers`,
              price: heli.pricePerHour,
              currency: heli.currency,
              details: heli,
              image: heli.image
            })),
            ...mockServices.luxuryCars
              .filter(car => car.type === 'luxury-car')
              .map(car => ({
                id: car.id,
                type: 'luxury-car' as const,
                title: `${car.brand} ${car.model}`,
                subtitle: `Luxury rental • ${car.location}`,
                price: car.pricePerDay,
                currency: car.currency,
                details: car,
                image: car.image
              }))
          ];
          
          suggestedAddOns.push(...transportOptions);
        }
      } catch (error) {
        console.error('Error fetching adventure packages for recommendations:', error);
      }
    }
    
    // Other services based on user needs
    if (analysis.needsJet && analysis.passengers) {
      const suitableJets = mockServices.privateJets.filter(jet => 
        jet.capacity >= analysis.passengers
      );
      
      suitableJets.forEach(jet => {
        const estimatedHours = 2;
        const totalPrice = jet.pricePerHour * estimatedHours;
        
        recommendations.push({
          id: jet.id,
          type: 'private-jet',
          title: jet.name,
          subtitle: `${jet.category} • ${jet.capacity} passengers • Carbon offset included`,
          price: totalPrice,
          currency: jet.currency,
          details: { ...jet, estimatedHours, route: `${analysis.from} → ${analysis.to}` },
          image: jet.image
        });
      });
    }
    
    if (analysis.needsCar && !analysis.hasSelectedAdventure && !analysis.hasSelectedEmptyLeg) {
      const cars = mockServices.luxuryCars.map(car => ({
        id: car.id,
        type: car.type,
        title: `${car.brand} ${car.model}`,
        subtitle: `Luxury rental • ${car.location}`,
        price: car.pricePerDay,
        currency: car.currency,
        details: car,
        image: car.image
      }));
      
      recommendations.push(...cars);
    }
    
    if (analysis.needsHelicopter && !analysis.hasSelectedAdventure) {
      const helicopters = mockServices.helicopters.map(heli => ({
        id: heli.id,
        type: 'helicopter',
        title: heli.name,
        subtitle: `Premium helicopter service • ${heli.capacity} passengers`,
        price: heli.pricePerHour,
        currency: heli.currency,
        details: heli,
        image: heli.image
      }));
      
      recommendations.push(...helicopters);
    }
    
    if (analysis.needsYacht) {
      const yachts = mockServices.yachts.map(yacht => ({
        id: yacht.id,
        type: 'yacht',
        title: yacht.name,
        subtitle: `Luxury yacht charter • ${yacht.capacity} passengers`,
        price: yacht.pricePerDay,
        currency: yacht.currency,
        details: yacht,
        image: yacht.image
      }));
      
      recommendations.push(...yachts);
    }
    
    return { recommendations, suggestedAddOns, adventurePackages };
  };
  
  // Landing Page Functions
  const handleServiceSelect = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };
  
  const handleStartSearch = () => {
    if (!landingInput.trim() && selectedServices.length === 0) return;
    
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    const initialMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: `I'm traveling to ${landingInput}${selectedServices.length > 0 ? ` and I'm interested in: ${selectedServices.map(s => serviceOptions.find(opt => opt.id === s)?.label).join(', ')}` : ''}`,
      timestamp: new Date()
    };
    
    setMessages([initialMessage]);
    setShowMainModal(true);
    
    setTimeout(() => {
      handleInitialAIResponse(landingInput, selectedServices);
    }, 500);
  };
  
  const handleInitialAIResponse = async (destination: string, services: string[]) => {
    setIsLoading(true);
    
    try {
      const analysis = analyzeUserRequest(`traveling to ${destination}`);
      const { recommendations, suggestedAddOns, adventurePackages } = await generateServiceRecommendations(analysis);
      
      let aiResponse = `Perfect! I can help you plan your trip to ${destination}. `;
      
      if (recommendations.length > 0) {
        const emptyLegsCount = recommendations.filter(r => r.type === 'empty-leg').length;
        const adventureCount = recommendations.filter(r => r.type === 'adventure-package').length;
        const othersCount = recommendations.length - emptyLegsCount - adventureCount;
        
        if (emptyLegsCount > 0) {
          aiResponse += `Great news! I found ${emptyLegsCount} empty leg flight${emptyLegsCount > 1 ? 's' : ''} to/from ${destination} with up to 75% savings. All flights are carbon neutral. `;
        }
        
        if (adventureCount > 0) {
          aiResponse += `I also found ${adventureCount} amazing adventure package${adventureCount > 1 ? 's' : ''} in ${destination}. `;
        }
        
        if (othersCount > 0) {
          aiResponse += `I've also found ${othersCount} other service${othersCount > 1 ? 's' : ''} that match your requirements.`;
        }
      } else {
        aiResponse += `Let me show you our available services for your destination. I'll also check for any empty leg opportunities and adventure packages with significant savings.`;
      }
      
      // Ask about preferences if not clear
      if (!analysis.needsAdventure && !analysis.needsEmptyLeg) {
        aiResponse += `\n\nTo help me find the best options for you, could you tell me more about what you're looking for? Are you interested in:\n• Empty leg flights for significant savings\n• Adventure packages and experiences\n• Private jet charters\n• Or something else entirely?`;
      }
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        type: 'agent',
        content: aiResponse,
        timestamp: new Date(),
        serviceCards: recommendations.length > 0 ? recommendations : undefined,
        suggestedAddOns: suggestedAddOns.length > 0 ? suggestedAddOns : undefined,
        adventurePackages: adventurePackages.length > 0 ? adventurePackages : undefined
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      if (recommendations.length > 0) {
        setShowCart(true);
      }
      
    } catch (error) {
      console.error('AI response error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const analysis = analyzeUserRequest(userMessage.content, messages);
      const { recommendations, suggestedAddOns, adventurePackages } = await generateServiceRecommendations(analysis, messages);
      
      let aiResponse = '';
      
      // Check if user is asking about empty legs specifically
      if (analysis.needsEmptyLeg || userMessage.content.toLowerCase().includes('empty leg')) {
        if (recommendations.filter(r => r.type === 'empty-leg').length > 0) {
          const emptyLegsCount = recommendations.filter(r => r.type === 'empty-leg').length;
          aiResponse = `I found ${emptyLegsCount} empty leg flight${emptyLegsCount > 1 ? 's' : ''} that match your search! These offer up to 75% savings compared to regular charter prices and are completely carbon neutral. `;
          
          if (analysis.searchLocation) {
            aiResponse += `All flights are related to ${analysis.searchLocation}. `;
          }
          
          if (analysis.passengers) {
            aiResponse += `I've filtered for aircraft with at least ${analysis.passengers} passenger${analysis.passengers > 1 ? 's' : ''} capacity. `;
          }
          
          if (analysis.budget) {
            aiResponse += `I've also filtered for flights within your budget of $${analysis.budget.toLocaleString()}. `;
          }
          
          if (analysis.aircraftType) {
            aiResponse += `I've filtered for ${analysis.aircraftType} aircraft types. `;
          }
          
          aiResponse += `Empty leg flights are repositioning flights where the aircraft needs to fly empty to pick up the next passengers. You get luxury private aviation at a fraction of the cost!`;
        } else {
          aiResponse = `I don't currently have empty leg flights matching your criteria`;
          if (analysis.searchLocation) {
            aiResponse += ` for ${analysis.searchLocation}`;
          }
          if (analysis.passengers) {
            aiResponse += ` with at least ${analysis.passengers} passengers`;
          }
          if (analysis.budget) {
            aiResponse += ` within your budget of $${analysis.budget.toLocaleString()}`;
          }
          if (analysis.aircraftType) {
            aiResponse += ` of type ${analysis.aircraftType}`;
          }
          aiResponse += `. Empty legs change frequently, so please check back soon or let me know if you'd like to explore other destinations or regular charter options.`;
        }
      } 
      // Check if user is asking about adventure packages specifically
      else if (analysis.needsAdventure || userMessage.content.toLowerCase().includes('adventure') || userMessage.content.toLowerCase().includes('package')) {
        if (recommendations.filter(r => r.type === 'adventure-package').length > 0) {
          const adventureCount = recommendations.filter(r => r.type === 'adventure-package').length;
          aiResponse = `I found ${adventureCount} amazing adventure package${adventureCount > 1 ? 's' : ''} that match your interests! `;
          
          if (analysis.searchLocation) {
            aiResponse += `All packages are in or near ${analysis.searchLocation}. `;
          }
          
          if (analysis.duration) {
            aiResponse += `I've filtered for packages with a duration of up to ${analysis.duration} days. `;
          }
          
          if (analysis.budget) {
            aiResponse += `I've also filtered for packages within your budget of $${analysis.budget.toLocaleString()}. `;
          }
          
          if (analysis.activities) {
            aiResponse += `I've found packages that include activities like: ${analysis.activities.join(', ')}. `;
          }
          
          if (analysis.difficulty) {
            aiResponse += `I've filtered for ${analysis.difficulty} difficulty level. `;
          }
          
          aiResponse += `These packages offer curated experiences with all the details taken care of for you!`;
        } else {
          aiResponse = `I don't currently have adventure packages matching your criteria`;
          if (analysis.searchLocation) {
            aiResponse += ` in ${analysis.searchLocation}`;
          }
          if (analysis.duration) {
            aiResponse += ` with a duration of ${analysis.duration} days`;
          }
          if (analysis.budget) {
            aiResponse += ` within your budget of $${analysis.budget.toLocaleString()}`;
          }
          if (analysis.activities) {
            aiResponse += ` with activities like ${analysis.activities.join(', ')}`;
          }
          if (analysis.difficulty) {
            aiResponse += ` at ${analysis.difficulty} difficulty level`;
          }
          aiResponse += `. Our adventure packages change frequently, so please check back soon or let me know if you'd like to explore other options.`;
        }
      }
      // Check if user has selected an empty leg and might need ground transportation
      else if (analysis.hasSelectedEmptyLeg && !analysis.needsCar) {
        aiResponse = `Great choice on the empty leg flight! Would you like me to arrange ground transportation to and from the airport? We offer premium vehicle services for a seamless travel experience.`;
      }
      // Check if user has selected an adventure package and might need transportation
      else if (analysis.hasSelectedAdventure && !analysis.needsCar && !analysis.needsHelicopter) {
        aiResponse = `Excellent choice on the adventure package! Would you like me to arrange transportation to and from the adventure location? We offer premium vehicle and helicopter services for a seamless travel experience.`;
      }
      // Handle specific route requests
      else if (analysis.from && analysis.to) {
        aiResponse = `Perfect! I can help you plan your trip from ${analysis.from} to ${analysis.to}. `;
        
        if (!analysis.passengers) {
          aiResponse += 'How many passengers will be traveling? ';
        }
        
        if (recommendations.length > 0) {
          const emptyLegsCount = recommendations.filter(r => r.type === 'empty-leg').length;
          if (emptyLegsCount > 0) {
            aiResponse += `Great news! I found ${emptyLegsCount} empty leg option${emptyLegsCount > 1 ? 's' : ''} for this route with up to 75% savings - all carbon neutral included. `;
          }
          aiResponse += `Here are the available services from our PrivateCharterX fleet:`;
        }
      } 
      // Handle location-based requests
      else if (analysis.searchLocation) {
        const emptyLegsCount = recommendations.filter(r => r.type === 'empty-leg').length;
        const adventureCount = recommendations.filter(r => r.type === 'adventure-package').length;
        
        if (emptyLegsCount > 0 || adventureCount > 0) {
          aiResponse = `I found some great options for ${analysis.searchLocation}! `;
          
          if (emptyLegsCount > 0) {
            aiResponse += `There ${emptyLegsCount === 1 ? 'is' : 'are'} ${emptyLegsCount} empty leg flight${emptyLegsCount > 1 ? 's' : ''} with up to 75% savings. `;
          }
          
          if (adventureCount > 0) {
            aiResponse += `I also found ${adventureCount} amazing adventure package${adventureCount > 1 ? 's' : ''} in the area. `;
          }
          
          aiResponse += `Would you like to see the options?`;
        } else {
          aiResponse = `I'd be happy to help you with travel to ${analysis.searchLocation}! Let me know more details like your departure location, dates, and number of passengers. I'll also check for any empty leg opportunities and adventure packages which could enhance your trip.`;
        }
      }
      // Handle general service requests
      else if (analysis.needsJet || analysis.needsCar || analysis.needsAdventure || analysis.needsYacht || analysis.needsHelicopter) {
        aiResponse = "I'd be happy to help you with your travel needs! ";
        
        if (analysis.needsJet) {
          aiResponse += "For private jet charter, I'll need to know your departure and arrival locations, travel dates, and number of passengers. ";
        }
        
        if (analysis.needsCar) {
          aiResponse += "For luxury car rentals, please let me know your pickup location, dates, and vehicle preferences. ";
        }
        
        if (analysis.needsAdventure) {
          if (!analysis.activities && !analysis.difficulty && !analysis.duration) {
            aiResponse += "For adventure packages, I'd like to know more about your preferences: What activities do you enjoy? What difficulty level are you comfortable with? How many days are you planning? ";
          }
        }
        
        if (analysis.needsYacht) {
          aiResponse += "For yacht charters, please share your desired cruising area, dates, and group size. ";
        }
        
        if (analysis.needsHelicopter) {
          aiResponse += "For helicopter services, I'll need your pickup and drop-off locations, dates, and passenger count. ";
        }
        
        aiResponse += "\n\nAlso, would you be interested in empty leg flights? They offer up to 75% savings compared to regular charter prices and are completely carbon neutral.";
      }
      // Default response
      else {
        aiResponse = "I'd be happy to help you plan your travel! Could you tell me more about your trip? For example:\n\n• Where are you traveling from and to?\n• How many passengers?\n• Are you looking for empty leg deals (up to 75% off)?\n• Are you interested in adventure packages or experiences?\n• What type of services do you need?\n• Do you have a budget in mind?\n• Do you have a preferred aircraft type?\n\nAll our flights are carbon neutral included!";
      }
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        type: 'agent',
        content: aiResponse,
        timestamp: new Date(),
        serviceCards: recommendations.length > 0 ? recommendations : undefined,
        suggestedAddOns: suggestedAddOns.length > 0 ? suggestedAddOns : undefined,
        adventurePackages: adventurePackages.length > 0 ? adventurePackages : undefined
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      if (recommendations.length > 0) {
        setShowCart(true);
      }
      
    } catch (error) {
      console.error('AI response error:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'agent',
        content: "I apologize for the technical difficulty. Please try again or provide more specific details about your travel requirements.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Utility functions
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };
  
  const formatTime = (timeString: string) => {
    if (!timeString) return 'TBD';
    
    if (timeString.includes('T')) {
      try {
        const timeDate = new Date(timeString);
        return timeDate.toISOString().substring(11, 16) + ' UTC';
      } catch {
        return timeString;
      }
    }
    return timeString;
  };
  
  const formatDateTime = (dateString: string, timeString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isToday = date.toDateString() === today.toDateString();
      const isTomorrow = date.toDateString() === tomorrow.toDateString();
      
      let formattedTime = 'TBD';
      if (timeString) {
        if (timeString.includes('T')) {
          try {
            const timeDate = new Date(timeString);
            formattedTime = timeDate.toISOString().substring(11, 16) + ' UTC';
          } catch {
            formattedTime = timeString;
          }
        } else {
          formattedTime = timeString;
        }
      }
      
      if (isToday) {
        return `Today ${formattedTime}`;
      } else if (isTomorrow) {
        return `Tomorrow ${formattedTime}`;
      } else {
        return `${formatDate(dateString)} ${formattedTime}`;
      }
    } catch {
      return `${dateString} ${timeString || 'TBD'}`;
    }
  };
  
  const isNFTFreeEligible = (emptyLeg: EmptyLegOffer) => {
    return emptyLeg.price_usd < 1500;
  };
  
  const getDefaultImage = () => {
    return 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80';
  };
  
  // Auth Modal Handlers
  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (landingInput.trim() || selectedServices.length > 0) {
      setTimeout(() => {
        handleStartSearch();
      }, 100);
    }
  };
  
  const handleSwitchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterForm(true);
  };
  
  const handleSwitchToLogin = () => {
    setShowRegisterForm(false);
    setShowLoginModal(true);
  };
  
  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    if (user.first_name) {
      return user.first_name;
    }
    return user.email?.split('@')[0] || 'Guest';
  };
  
  const openBookingModal = (serviceCard: ServiceCard) => {
    setBookingModal({
      isOpen: true,
      service: serviceCard,
      type: serviceCard.type
    });
  };
  
  const closeBookingModal = () => {
    setBookingModal({ isOpen: false, service: null, type: null });
  };
  
  const addToCart = (serviceCard: ServiceCard, customizations?: any) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === serviceCard.id);
      if (existing) {
        return prev.map(item => 
          item.id === serviceCard.id 
            ? { ...item, quantity: (item.quantity || 1) + 1, customizations }
            : item
        );
      } else {
        return [...prev, { ...serviceCard, quantity: 1, customizations }];
      }
    });
    closeBookingModal();
  };
  
  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  const formatPrice = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleLandingKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStartSearch();
    }
  };
  
  const sidebarItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'history', label: 'History', icon: History },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'events', label: 'Upcoming Events', icon: Bell },
    { id: 'tokenization', label: 'Tokenization', icon: Shield },
    { id: 'mapx', label: 'MapX', icon: MapPin }
  ];
  
  // Booking Modal Component
  const BookingModalComponent = () => {
    const [formData, setFormData] = useState({
      passengers: 1,
      luggage: 1,
      departureDate: '',
      departureTime: '10:00',
      returnDate: '',
      notes: ''
    });
    
    if (!bookingModal.isOpen || !bookingModal.service) return null;
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addToCart(bookingModal.service!, formData);
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-light text-gray-900">Customize Your Booking</h2>
              <button
                onClick={closeBookingModal}
                className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-2">{bookingModal.service.title}</h3>
              <p className="text-sm text-gray-500 mb-3">{bookingModal.service.subtitle}</p>
              <p className="text-lg font-light text-gray-900">
                {formatPrice(bookingModal.service.price, bookingModal.service.currency)}
              </p>
              {bookingModal.service.type === 'empty-leg' && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Leaf size={14} />
                    <span>Carbon neutral included at no extra cost</span>
                  </div>
                  {bookingModal.service.details?.isNFTFree && (
                    <div className="flex items-center gap-2 text-sm text-green-600 mt-1">
                      <Star size={14} />
                      <span>FREE for NFT holders</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Form fields would go here - simplified for example */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Passengers</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.passengers}
                  onChange={(e) => setFormData(prev => ({ ...prev, passengers: parseInt(e.target.value) }))}
                  className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Departure Date</label>
                <input
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
                  className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={closeBookingModal}
                className="flex-1 py-4 px-6 border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-4 px-6 bg-black text-white rounded-2xl hover:bg-gray-800 transition-colors font-medium"
              >
                Add to Cart
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  // Sidebar Content Components
  const renderSidebarContent = () => {
    switch (sidebarView) {
      case 'history':
        return (
          <div className="p-6 space-y-4">
            <h3 className="font-medium text-gray-900">Chat History</h3>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:border-gray-200 transition-colors">
                <p className="font-medium text-sm text-gray-900">Empty Legs to Switzerland</p>
                <p className="text-xs text-gray-500 mt-1">2 days ago</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:border-gray-200 transition-colors">
                <p className="font-medium text-sm text-gray-900">London Business Trip</p>
                <p className="text-xs text-gray-500 mt-1">1 week ago</p>
              </div>
            </div>
          </div>
        );
      case 'bookings':
        return (
          <div className="p-6 space-y-4">
            <h3 className="font-medium text-gray-900">My Bookings</h3>
            <div className="space-y-3">
              <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
                <p className="font-medium text-sm text-green-900">Confirmed</p>
                <p className="text-xs text-green-700 mt-1">Empty Leg: ZRH → LHR • Jan 15</p>
                <p className="text-xs text-green-600 mt-1">Carbon Neutral • Gulfstream G550</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  // LANDING PAGE
  if (!showMainModal) {
    if (initializing) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white" style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
          fontWeight: '400',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        }}>
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">Loading PrivateCharterX...</p>
          </div>
        </div>
      );
    }
    
    return (
      <>
        <div className="min-h-screen flex flex-col bg-white" style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
          fontWeight: '400',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        }}>
          <Header />
          
          <main className="flex-1 flex items-center justify-center px-4 py-8 pt-24">
            <div className="w-full max-w-4xl mx-auto">
              
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-4xl font-light text-gray-900 tracking-tight mb-2">
                  Hello, {getUserDisplayName()}
                </h1>
                <p className="text-base text-gray-500 font-light">
                  Find What Matters, Faster. All flights carbon neutral.
                </p>
              </div>
              
              <div className="mb-6">
                <div className="max-w-3xl mx-auto">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                    
                    <div className="relative mb-3">
                      <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                        <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={landingInput}
                          onChange={(e) => setLandingInput(e.target.value)}
                          onKeyDown={handleLandingKeyDown}
                          placeholder="New York, NY 10038, United States"
                          className="flex-1 text-sm bg-transparent border-0 outline-none placeholder-gray-400 text-gray-900"
                        />
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <X size={14} className="text-gray-400" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-2 mb-3">
                      <div className="flex-1 flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Mon 16 Aug</span>
                      </div>
                      
                      <div className="flex-1 flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                        <Clock size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700">10:00</span>
                      </div>
                      
                      <div className="flex-1 flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Wed 18 Aug</span>
                      </div>
                      
                      <div className="flex-1 flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                        <Clock size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700">14:00</span>
                      </div>
                      
                      <button
                        onClick={handleStartSearch}
                        disabled={!landingInput.trim() && selectedServices.length === 0}
                        className="bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg transition-colors disabled:cursor-not-allowed font-medium text-sm"
                      >
                        Search
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {serviceOptions.slice(0, 6).map((service) => {
                        const isSelected = selectedServices.includes(service.id);
                        
                        return (
                          <button
                            key={service.id}
                            onClick={() => handleServiceSelect(service.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              isSelected 
                                ? 'bg-black text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } ${service.id === 'empty-legs' ? 'border border-green-200' : ''}`}
                          >
                            {service.id === 'empty-legs' ? (
                              <span className="flex items-center gap-1">
                                <Route size={10} />
                                Empty Legs • Save 75%
                              </span>
                            ) : (
                              service.label.replace(' Booking', '').replace(' Charter', '')
                            )}
                          </button>
                        );
                      })}
                      
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 rounded-full hover:border-gray-300">
                        <SlidersHorizontal size={12} />
                        Filter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-3xl mx-auto mb-6">
                {[
                  { title: 'Empty legs to Switzerland?', icon: Route },
                  { title: 'Adventure packages in Alps?', icon: Mountain },
                  { title: 'Last minute deals?', icon: Clock },
                  { title: 'Carbon neutral flights?', icon: Leaf }
                ].map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setLandingInput(item.title);
                        handleStartSearch();
                      }}
                      className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-left transition-colors border border-gray-100 hover:border-gray-200"
                    >
                      <div className="mb-2">
                        <IconComponent size={14} className="text-gray-500" />
                      </div>
                      <h3 className="text-xs font-medium text-gray-900">
                        {item.title}
                      </h3>
                    </button>
                  );
                })}
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-2">
                  Powered by PrivateCharterX
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                  <span>Carbon Neutral</span>
                  <span>24/7 Support</span>
                  <span>Up to 75% Off</span>
                </div>
              </div>
            </div>
          </main>
          
          <Footer />
        </div>
        
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onSwitchToRegister={handleSwitchToRegister}
            onSuccess={handleLoginSuccess}
          />
        )}
      </>
    );
  }
  
  // MAIN MODAL
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden relative">
        
        <button
          onClick={() => {
            setShowMainModal(false);
            setMessages([]);
            setCartItems([]);
            setSelectedServices([]);
            setLandingInput('');
          }}
          className="absolute top-6 right-6 z-50 p-2 hover:bg-gray-100 rounded-full transition-colors bg-white shadow-lg"
        >
          <X size={20} className="text-gray-600" />
        </button>
        
        <div className="flex h-full">
          
          <div className={`border-r border-gray-100 flex flex-col bg-white/80 backdrop-blur-sm transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}>
            
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              {!sidebarCollapsed && (
                <div>
                  <h2 className="font-medium text-gray-900">AI Travel Designer</h2>
                  <p className="text-sm text-gray-500 mt-1">PrivateCharterX</p>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <ChevronLeft className={`w-4 h-4 text-gray-400 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            <nav className="flex-1 p-4">
              {sidebarItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSidebarView(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors mb-1 text-sm ${
                      sidebarView === item.id 
                        ? 'bg-black text-white' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    title={sidebarCollapsed ? item.label : ''}
                  >
                    <IconComponent size={16} />
                    {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
            
            {cartItems.length > 0 && (
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => setShowCart(!showCart)}
                  className={`w-full flex items-center justify-between px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium ${
                    sidebarCollapsed ? 'justify-center' : ''
                  }`}
                  title={sidebarCollapsed ? `Cart (${cartItems.length})` : ''}
                >
                  {sidebarCollapsed ? (
                    <div className="relative">
                      <CreditCard size={16} />
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {cartItems.length}
                      </div>
                    </div>
                  ) : (
                    <>
                      <span>Cart ({cartItems.length})</span>
                      <span>{formatPrice(getTotalPrice())}</span>
                    </>
                  )}
                </button>
              </div>
            )}
            
            {sidebarView !== 'chat' && sidebarView !== 'mapx' && !sidebarCollapsed && (
              <div className="border-t border-gray-100 max-h-64 overflow-y-auto">
                {renderSidebarContent()}
              </div>
            )}
          </div>
          
          {sidebarView === 'chat' && (
            <div className="flex-1 flex flex-col">
              
              <div className="p-6 border-b border-gray-100">
                <h1 className="text-2xl font-light text-gray-900 mb-2">
                  AI Travel Designer
                </h1>
                <p className="text-gray-500 text-base font-light">
                  PrivateCharterX • Plan your perfect luxury journey • Carbon neutral included
                </p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="max-w-4xl mx-auto">
                  {messages.map((message) => (
                    <div key={message.id}>
                      <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-2xl rounded-2xl px-6 py-4 ${
                            message.type === 'user'
                              ? 'bg-black text-white'
                              : 'bg-gray-50 text-gray-900 border border-gray-100'
                          }`}
                        >
                          {message.type === 'agent' && (
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <Sparkles size={12} className="text-gray-500" />
                              </div>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                AI Travel Designer
                              </span>
                            </div>
                          )}
                          <div className="whitespace-pre-wrap leading-relaxed text-sm">
                            {message.content}
                          </div>
                        </div>
                      </div>
                      
                      {message.serviceCards && message.serviceCards.length > 0 && (
                        <div className="mt-4 space-y-3 max-w-2xl">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            {message.serviceCards.some(card => card.type === 'empty-leg') 
                              ? 'Available Empty Legs' 
                              : message.serviceCards.some(card => card.type === 'adventure-package')
                                ? 'Adventure Packages'
                                : 'Recommended Services'}
                          </h4>
                          {message.serviceCards.map((card) => (
                            <div
                              key={card.id}
                              className={`rounded-2xl p-4 border transition-colors ${
                                card.type === 'empty-leg' 
                                  ? 'bg-green-50 border-green-200 hover:border-green-300' 
                                  : card.type === 'adventure-package'
                                    ? 'bg-purple-50 border-purple-200 hover:border-purple-300'
                                    : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="text-2xl">{card.image}</div>
                                  <div>
                                    <h4 className="font-medium text-gray-900 text-sm">{card.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <p className="text-sm font-light text-gray-900">
                                        {card.type === 'empty-leg' && card.details?.isNFTFree ? 'FREE*' : formatPrice(card.price, card.currency)}
                                      </p>
                                      {card.type === 'empty-leg' && (
                                        <div className="flex items-center gap-1 text-xs text-green-600">
                                          <Leaf size={10} />
                                          <span>Carbon Neutral</span>
                                        </div>
                                      )}
                                      {card.type === 'adventure-package' && (
                                        <div className="flex items-center gap-1 text-xs text-purple-600">
                                          <Mountain size={10} />
                                          <span>Adventure</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openBookingModal(card)}
                                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                                  >
                                    Customize
                                  </button>
                                  <button
                                    onClick={() => addToCart(card)}
                                    className="bg-black text-white px-3 py-2 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium"
                                  >
                                    <Plus size={14} />
                                    Add to Cart
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {message.adventurePackages && message.adventurePackages.length > 0 && (
                        <div className="mt-4 space-y-3 max-w-2xl">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Adventure Packages & Fixed Offers
                          </h4>
                          {message.adventurePackages.map((pkg) => (
                            <div
                              key={pkg.id}
                              className="rounded-2xl p-4 border bg-purple-50 border-purple-200 hover:border-purple-300 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 rounded-lg overflow-hidden">
                                    <img
                                      src={pkg.image_url || getDefaultImage()}
                                      alt={pkg.title}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = getDefaultImage();
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900 text-sm">{pkg.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{pkg.location} • {pkg.duration} • {pkg.difficulty}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <p className="text-sm font-light text-gray-900">
                                        {formatPrice(pkg.price_usd, 'USD')}
                                      </p>
                                      <div className="flex items-center gap-1 text-xs text-purple-600">
                                        <Mountain size={10} />
                                        <span>{pkg.activities.slice(0, 2).join(', ')}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openBookingModal(convertAdventurePackageToServiceCard(pkg))}
                                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                                  >
                                    Customize
                                  </button>
                                  <button
                                    onClick={() => addToCart(convertAdventurePackageToServiceCard(pkg))}
                                    className="bg-black text-white px-3 py-2 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium"
                                  >
                                    <Plus size={14} />
                                    Add to Cart
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {message.suggestedAddOns && message.suggestedAddOns.length > 0 && (
                        <div className="mt-4 space-y-3 max-w-2xl">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Recommended Add-ons
                          </h4>
                          {message.suggestedAddOns.map((card) => (
                            <div
                              key={card.id}
                              className="rounded-2xl p-4 border bg-blue-50 border-blue-200 hover:border-blue-300 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="text-2xl">{card.image}</div>
                                  <div>
                                    <h4 className="font-medium text-gray-900 text-sm">{card.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <p className="text-sm font-light text-gray-900">
                                        {formatPrice(card.price, card.currency)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openBookingModal(card)}
                                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                                  >
                                    Customize
                                  </button>
                                  <button
                                    onClick={() => addToCart(card)}
                                    className="bg-black text-white px-3 py-2 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium"
                                  >
                                    <Plus size={14} />
                                    Add to Cart
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-50 rounded-2xl px-6 py-4 max-w-2xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <Sparkles size={12} className="text-gray-500" />
                          </div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Searching PrivateCharterX fleet...
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-3 bg-gray-100 rounded-2xl border border-gray-200 p-4">
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors">
                        <Paperclip size={16} />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors">
                        <Camera size={16} />
                      </button>
                    </div>
                    
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about empty legs, adventure packages, or any travel needs..."
                      disabled={isLoading}
                      className="flex-1 bg-transparent border-0 outline-none placeholder-gray-500 text-gray-900 disabled:opacity-50 text-base"
                    />
                    
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors">
                        <Mic size={16} />
                      </button>
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        className="bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white p-2 rounded-xl transition-colors disabled:cursor-not-allowed"
                      >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {sidebarView !== 'chat' && sidebarView !== 'mapx' && (
            <div className="flex-1 flex flex-col p-6">
              <div className="flex-1 overflow-y-auto">
                {renderSidebarContent()}
              </div>
            </div>
          )}
          
          {showCart && cartItems.length > 0 && (
            <div className="w-80 border-l border-gray-100 flex flex-col bg-white/80 backdrop-blur-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Your Journey</h3>
                  <button
                    onClick={() => setShowCart(false)}
                    className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className={`rounded-2xl p-4 border ${
                    item.type === 'empty-leg' ? 'bg-green-50 border-green-200' : 
                    item.type === 'adventure-package' ? 'bg-purple-50 border-purple-200' :
                    item.type === 'ground-transport' ? 'bg-blue-50 border-blue-200' : 
                    'bg-gray-50 border-gray-100'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{item.subtitle}</p>
                        {item.type === 'empty-leg' && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <Leaf size={10} />
                              <span>Carbon Neutral</span>
                            </div>
                            {item.details?.isNFTFree && (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <Star size={10} />
                                <span>FREE</span>
                              </div>
                            )}
                          </div>
                        )}
                        {item.type === 'adventure-package' && (
                          <div className="flex items-center gap-1 text-xs text-purple-600 mt-1">
                            <Mountain size={10} />
                            <span>Adventure Package</span>
                          </div>
                        )}
                        {item.type === 'ground-transport' && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                            <Car size={10} />
                            <span>Airport Transfer</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X size={12} className="text-gray-400" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 text-sm">
                        {item.type === 'empty-leg' && item.details?.isNFTFree ? 'FREE*' : formatPrice(item.price * (item.quantity || 1), item.currency)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Qty: {item.quantity || 1}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-gray-900">Total</span>
                  <span className="text-lg font-light text-gray-900">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>
                <button className="w-full bg-black text-white py-3 rounded-2xl hover:bg-gray-800 transition-colors font-medium text-sm mb-2">
                  Get a Quote
                </button>
                <button className="w-full bg-gray-100 text-gray-900 py-3 rounded-2xl hover:bg-gray-200 transition-colors font-medium text-sm">
                  Request Now
                </button>
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Carbon neutral flights • 24/7 concierge • Up to 75% savings
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <BookingModalComponent />
    </div>
  );
};

export default TravelDesigner;
