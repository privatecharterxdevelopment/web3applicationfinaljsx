import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hero from './Hero';
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
import Header from './Header';
import Footer from './Footer';
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

interface Message {
  id: number;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  metadata?: any;
  serviceCards?: ServiceCard[];
  emptyLegs?: EmptyLegOffer[];
}

interface ServiceCard {
  id: string;
  type: 'private-jet' | 'luxury-car' | 'adventure-package' | 'helicopter' | 'yacht' | 'empty-leg';
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
  type: 'private-jet' | 'luxury-car' | 'adventure-package' | 'helicopter' | 'yacht' | 'empty-leg' | null;
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
const fetchEmptyLegsFromDB = async (searchLocation?: string, filters?: {
  minPrice?: number;
  maxPrice?: number;
  passengers?: number;
  aircraftType?: string;
  departureDate?: string;
}): Promise<EmptyLegOffer[]> => {
  try {
    console.log('Fetching empty legs from EmptyLegs_ table...', searchLocation ? `for location: ${searchLocation}` : '');
    
    const today = new Date().toISOString().split('T')[0];
    
    let query = supabase
      .from('EmptyLegs_')
      .select('*')
      .gte('departure_date', today)
      .order('departure_date', { ascending: true });
    
    // Apply location filter if provided
    if (searchLocation && searchLocation.trim()) {
      const location = searchLocation.toLowerCase().trim();
      query = query.or(`from.ilike.%${location}%,to.ilike.%${location}%,from_city.ilike.%${location}%,to_city.ilike.%${location}%,from_iata.ilike.%${location}%,to_iata.ilike.%${location}%,from_country.ilike.%${location}%,to_country.ilike.%${location}%`);
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
    
    const { data, error } = await query.limit(20);
    
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
  
  // Empty Legs State
  const [emptyLegs, setEmptyLegs] = useState<EmptyLegOffer[]>([]);
  const [filteredEmptyLegs, setFilteredEmptyLegs] = useState<EmptyLegOffer[]>([]);
  const [emptyLegsLoading, setEmptyLegsLoading] = useState(false);
  const [emptyLegsSearchTerm, setEmptyLegsSearchTerm] = useState('');
  const [emptyLegsViewMode, setEmptyLegsViewMode] = useState<'grid' | 'list' | 'tabs'>('tabs');
  const [lastEmptyLegsUpdate, setLastEmptyLegsUpdate] = useState<Date | null>(null);
  
  // Empty Legs Filters State
  const [emptyLegsFilters, setEmptyLegsFilters] = useState({
    minPrice: 0,
    maxPrice: 100000,
    passengers: 1,
    aircraftType: '',
    departureDate: ''
  });
  
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
  
  // UPDATED AI Analysis Functions - Now includes Empty Legs
  const analyzeUserRequest = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    const fromMatch = lowerMessage.match(/from\s+([^to]+)(?=\s+to|\s*$)/);
    const toMatch = lowerMessage.match(/to\s+([^.!?]+)/);
    const passengerMatch = lowerMessage.match(/(\d+)\s*(?:person|people|passenger)/);
    const budgetMatch = lowerMessage.match(/(?:budget|price|cost|spend|afford)\s+(?:under|less than|no more than|max)?\s*\$?(\d+)/);
    const aircraftMatch = lowerMessage.match(/(?:aircraft|jet|plane)\s+(?:type|model)?\s+([a-zA-Z0-9\s]+)/);
    const dateMatch = lowerMessage.match(/(?:date|departure|leave|fly)\s+(?:on)?\s+([a-zA-Z0-9\s]+)/);
    
    const needsJet = lowerMessage.includes('fly') || lowerMessage.includes('flight') || lowerMessage.includes('jet');
    const needsCar = lowerMessage.includes('car') || lowerMessage.includes('transport') || lowerMessage.includes('drive');
    const needsAdventure = lowerMessage.includes('adventure') || lowerMessage.includes('tour') || lowerMessage.includes('experience');
    const needsEmptyLeg = lowerMessage.includes('empty leg') || lowerMessage.includes('discount') || lowerMessage.includes('last minute') || lowerMessage.includes('cheap flight') || lowerMessage.includes('deal');
    const needsYacht = lowerMessage.includes('yacht') || lowerMessage.includes('boat') || lowerMessage.includes('charter');
    const needsHelicopter = lowerMessage.includes('helicopter') || lowerMessage.includes('heli');
    
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
    
    return {
      from: fromMatch ? fromMatch[1].trim() : null,
      to: toMatch ? toMatch[1].trim() : null,
      searchLocation,
      passengers: passengerMatch ? parseInt(passengerMatch[1]) : null,
      budget: budgetMatch ? parseInt(budgetMatch[1]) : null,
      aircraftType: aircraftMatch ? aircraftMatch[1].trim() : null,
      departureDate: dateMatch ? dateMatch[1].trim() : null,
      needsJet,
      needsCar,
      needsAdventure,
      needsEmptyLeg,
      needsYacht,
      needsHelicopter
    };
  };
  
  // UPDATED Service Recommendations - Now includes Empty Legs
  const generateServiceRecommendations = async (analysis: any) => {
    const recommendations: ServiceCard[] = [];
    
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
        
        const emptyLegsData = await fetchEmptyLegsFromDB(
          analysis.searchLocation || analysis.to || analysis.from, 
          filters
        );
        
        emptyLegsData.slice(0, 5).forEach(emptyLeg => {
          recommendations.push(convertEmptyLegToServiceCard(emptyLeg));
        });
        
        console.log(`Added ${emptyLegsData.length} empty leg recommendations`);
      } catch (error) {
        console.error('Error fetching empty legs for recommendations:', error);
      }
    }
    
    // Other services (existing logic)
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
    
    // Add other service types as needed...
    return recommendations;
  };
  
  // Empty Legs Functions
  const fetchAllEmptyLegs = useCallback(async (searchLocation?: string) => {
    setEmptyLegsLoading(true);
    try {
      const data = await fetchEmptyLegsFromDB(searchLocation, emptyLegsFilters);
      setEmptyLegs(data);
      setLastEmptyLegsUpdate(new Date());
    } catch (error) {
      console.error('Error fetching empty legs:', error);
    } finally {
      setEmptyLegsLoading(false);
    }
  }, [emptyLegsFilters]);
  
  const applyEmptyLegsFilters = useCallback(() => {
    let filtered = [...emptyLegs];
    
    // Apply search term filter
    if (emptyLegsSearchTerm.trim()) {
      const search = emptyLegsSearchTerm.toLowerCase();
      filtered = filtered.filter(leg =>
        leg.from?.toLowerCase().includes(search) ||
        leg.to?.toLowerCase().includes(search) ||
        leg.from_city?.toLowerCase().includes(search) ||
        leg.to_city?.toLowerCase().includes(search) ||
        leg.from_iata?.toLowerCase().includes(search) ||
        leg.to_iata?.toLowerCase().includes(search)
      );
    }
    
    // Apply price filters
    if (emptyLegsFilters.minPrice > 0) {
      filtered = filtered.filter(leg => leg.price_usd >= emptyLegsFilters.minPrice);
    }
    
    if (emptyLegsFilters.maxPrice < 100000) {
      filtered = filtered.filter(leg => leg.price_usd <= emptyLegsFilters.maxPrice);
    }
    
    // Apply passenger filter
    if (emptyLegsFilters.passengers > 1) {
      filtered = filtered.filter(leg => leg.capacity >= emptyLegsFilters.passengers);
    }
    
    // Apply aircraft type filter
    if (emptyLegsFilters.aircraftType.trim()) {
      const aircraftType = emptyLegsFilters.aircraftType.toLowerCase();
      filtered = filtered.filter(leg =>
        leg.aircraft_type?.toLowerCase().includes(aircraftType) ||
        leg.category?.toLowerCase().includes(aircraftType)
      );
    }
    
    // Apply departure date filter
    if (emptyLegsFilters.departureDate) {
      const filterDate = new Date(emptyLegsFilters.departureDate).toISOString().split('T')[0];
      filtered = filtered.filter(leg => leg.departure_date >= filterDate);
    }
    
    setFilteredEmptyLegs(filtered);
  }, [emptyLegs, emptyLegsSearchTerm, emptyLegsFilters]);
  
  // Load empty legs when sidebar view changes to emptylegs
  useEffect(() => {
    if (sidebarView === 'emptylegs') {
      fetchAllEmptyLegs();
    }
  }, [sidebarView, fetchAllEmptyLegs]);
  
  // Apply filters when data changes
  useEffect(() => {
    applyEmptyLegsFilters();
  }, [applyEmptyLegsFilters]);
  
  // Set up real-time subscription for empty legs
  useEffect(() => {
    const subscription = supabase
      .channel('empty-legs-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'EmptyLegs_' },
        (payload) => {
          console.log('Real-time empty legs update received:', payload);
          if (sidebarView === 'emptylegs') {
            fetchAllEmptyLegs(emptyLegsSearchTerm);
          }
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [sidebarView, emptyLegsSearchTerm, fetchAllEmptyLegs]);
  
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
      const recommendations = await generateServiceRecommendations(analysis);
      
      let aiResponse = `Perfect! I can help you plan your trip to ${destination}. `;
      
      if (recommendations.length > 0) {
        const emptyLegsCount = recommendations.filter(r => r.type === 'empty-leg').length;
        const othersCount = recommendations.length - emptyLegsCount;
        
        if (emptyLegsCount > 0) {
          aiResponse += `Great news! I found ${emptyLegsCount} empty leg flight${emptyLegsCount > 1 ? 's' : ''} to/from ${destination} with up to 75% savings. All flights are carbon neutral. `;
        }
        
        if (othersCount > 0) {
          aiResponse += `I've also found ${othersCount} other service${othersCount > 1 ? 's' : ''} that match your requirements.`;
        }
      } else {
        aiResponse += `Let me show you our available services for your destination. I'll also check for any empty leg opportunities with significant savings.`;
      }
      
      // Ask about empty legs if not already included
      if (!analysis.needsEmptyLeg && recommendations.filter(r => r.type === 'empty-leg').length === 0) {
        aiResponse += `\n\nWould you be interested in empty leg flights? They offer up to 75% savings compared to regular charter prices and are completely carbon neutral.`;
      }
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        type: 'agent',
        content: aiResponse,
        timestamp: new Date(),
        serviceCards: recommendations.length > 0 ? recommendations : undefined
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
      const analysis = analyzeUserRequest(userMessage.content);
      const recommendations = await generateServiceRecommendations(analysis);
      
      let aiResponse = '';
      
      // Specific response for empty leg requests
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
      } else if (analysis.from && analysis.to) {
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
      } else if (analysis.searchLocation) {
        const emptyLegsCount = recommendations.filter(r => r.type === 'empty-leg').length;
        if (emptyLegsCount > 0) {
          aiResponse = `I found ${emptyLegsCount} empty leg flight${emptyLegsCount > 1 ? 's' : ''} for ${analysis.searchLocation}! These are repositioning flights with up to 75% savings, and all are carbon neutral. Would you like to see the options?`;
        } else {
          aiResponse = `I'd be happy to help you with travel to ${analysis.searchLocation}! Let me know more details like your departure location, dates, and number of passengers. I'll also check for any empty leg opportunities which could save you up to 75%.`;
        }
      } else {
        aiResponse = "I'd be happy to help you plan your travel! Could you tell me more about your trip? For example:\n\n• Where are you traveling from and to?\n• How many passengers?\n• Are you looking for empty leg deals (up to 75% off)?\n• What type of services do you need?\n• Do you have a budget in mind?\n• Do you have a preferred aircraft type?\n\nAll our flights are carbon neutral included!";
      }
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        type: 'agent',
        content: aiResponse,
        timestamp: new Date(),
        serviceCards: recommendations.length > 0 ? recommendations : undefined
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
    { id: 'emptylegs', label: 'Empty Legs', icon: Route },
    { id: 'tokenization', label: 'Tokenization', icon: Shield },
    { id: 'mapx', label: 'MapX', icon: MapPin }
  ];
  
  // Empty Legs Filter Handlers
  const handleEmptyLegsFilterChange = (filterName: string, value: any) => {
    setEmptyLegsFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  const resetEmptyLegsFilters = () => {
    setEmptyLegsFilters({
      minPrice: 0,
      maxPrice: 100000,
      passengers: 1,
      aircraftType: '',
      departureDate: ''
    });
    setEmptyLegsSearchTerm('');
  };
  
  // Empty Legs Component
  const EmptyLegsComponent = () => (
    <div className="h-full flex flex-col">
      {/* Carbon Neutral Notice */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Leaf size={16} className="text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-green-900 mb-1">All Flights Carbon Neutral</h4>
            <p className="text-sm text-green-800 mb-2">
              Every empty leg flight includes carbon offset at no extra cost. Save up to 75% while flying sustainably.
            </p>
            <div className="flex items-center gap-4 text-xs text-green-700">
              <div className="flex items-center gap-1">
                <Percent size={12} />
                <span>Up to 75% Off</span>
              </div>
              <div className="flex items-center gap-1">
                <Leaf size={12} />
                <span>Carbon Neutral</span>
              </div>
              <div className="flex items-center gap-1">
                <Star size={12} />
                <span>FREE with NFT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-gray-900">
            Empty Legs
            {filteredEmptyLegs.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({filteredEmptyLegs.length})
              </span>
            )}
          </h3>
          {lastEmptyLegsUpdate && (
            <p className="text-xs text-gray-500 mt-1">
              Updated {lastEmptyLegsUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAllEmptyLegs(emptyLegsSearchTerm)}
            disabled={emptyLegsLoading}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={emptyLegsLoading ? 'animate-spin' : ''} />
          </button>
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setEmptyLegsViewMode('tabs')}
              className={`p-1.5 rounded transition-colors ${
                emptyLegsViewMode === 'tabs' ? 'bg-white shadow-sm' : 'text-gray-600'
              }`}
              title="Tab View"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setEmptyLegsViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                emptyLegsViewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'
              }`}
              title="Grid View"
            >
              <Grid size={14} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search destinations..."
          value={emptyLegsSearchTerm}
          onChange={(e) => {
            setEmptyLegsSearchTerm(e.target.value);
            fetchAllEmptyLegs(e.target.value);
          }}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-300 focus:border-transparent"
        />
        {emptyLegsSearchTerm && (
          <button
            onClick={() => {
              setEmptyLegsSearchTerm('');
              fetchAllEmptyLegs();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      {/* Filters */}
      <div className="mb-4 bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Filters</h4>
          <button
            onClick={resetEmptyLegsFilters}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Reset all
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Price Range */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Min Price</label>
            <div className="relative">
              <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                min="0"
                value={emptyLegsFilters.minPrice}
                onChange={(e) => handleEmptyLegsFilterChange('minPrice', parseInt(e.target.value) || 0)}
                className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Max Price</label>
            <div className="relative">
              <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                min="0"
                value={emptyLegsFilters.maxPrice}
                onChange={(e) => handleEmptyLegsFilterChange('maxPrice', parseInt(e.target.value) || 100000)}
                className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg"
              />
            </div>
          </div>
          
          {/* Passengers */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Passengers</label>
            <select
              value={emptyLegsFilters.passengers}
              onChange={(e) => handleEmptyLegsFilterChange('passengers', parseInt(e.target.value) || 1)}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16].map(num => (
                <option key={num} value={num}>{num}+</option>
              ))}
            </select>
          </div>
          
          {/* Aircraft Type */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Aircraft Type</label>
            <input
              type="text"
              placeholder="e.g. Gulfstream"
              value={emptyLegsFilters.aircraftType}
              onChange={(e) => handleEmptyLegsFilterChange('aircraftType', e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
            />
          </div>
          
          {/* Departure Date */}
          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Departure Date</label>
            <input
              type="date"
              value={emptyLegsFilters.departureDate}
              onChange={(e) => handleEmptyLegsFilterChange('departureDate', e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
            />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {emptyLegsLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 text-sm">Loading empty legs...</p>
          </div>
        ) : filteredEmptyLegs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane size={24} className="text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">No Empty Legs Found</h3>
            <p className="text-gray-600 text-xs">
              {emptyLegsSearchTerm || 
               emptyLegsFilters.minPrice > 0 || 
               emptyLegsFilters.maxPrice < 100000 || 
               emptyLegsFilters.passengers > 1 || 
               emptyLegsFilters.aircraftType || 
               emptyLegsFilters.departureDate
                ? 'Try adjusting your search terms or filters.' 
                : 'Check back later for new opportunities.'
              }
            </p>
            {(emptyLegsSearchTerm || 
              emptyLegsFilters.minPrice > 0 || 
              emptyLegsFilters.maxPrice < 100000 || 
              emptyLegsFilters.passengers > 1 || 
              emptyLegsFilters.aircraftType || 
              emptyLegsFilters.departureDate) && (
              <button
                onClick={resetEmptyLegsFilters}
                className="mt-3 text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {emptyLegsViewMode === 'tabs' ? (
              // Tab View
              <div className="space-y-2">
                {filteredEmptyLegs.slice(0, 20).map((emptyLeg) => (
                  <div
                    key={emptyLeg.id}
                    onClick={() => {
                      const serviceCard = convertEmptyLegToServiceCard(emptyLeg);
                      addToCart(serviceCard);
                    }}
                    className={`p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border ${
                      isNFTFreeEligible(emptyLeg) ? 'border-green-200 bg-green-50' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-blue-900">
                          {emptyLeg.from_iata || emptyLeg.from}
                        </span>
                        <ArrowRight size={12} className="text-gray-400" />
                        <span className="text-xs font-medium text-blue-900">
                          {emptyLeg.to_iata || emptyLeg.to}
                        </span>
                        {isNFTFreeEligible(emptyLeg) && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                            FREE
                          </span>
                        )}
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                          <Leaf size={8} className="inline mr-1" />
                          Carbon Neutral
                        </span>
                      </div>
                      <span className="text-xs font-medium text-gray-900">
                        {isNFTFreeEligible(emptyLeg) ? 'FREE*' : `$${emptyLeg.price_usd?.toLocaleString()}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDateTime(emptyLeg.departure_date, emptyLeg.departure_time)}</span>
                      <span>{emptyLeg.aircraft_type} • {emptyLeg.capacity} seats</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEmptyLegs.slice(0, 12).map((emptyLeg) => (
                  <div
                    key={emptyLeg.id}
                    onClick={() => {
                      const serviceCard = convertEmptyLegToServiceCard(emptyLeg);
                      addToCart(serviceCard);
                    }}
                    className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group border ${
                      isNFTFreeEligible(emptyLeg) ? 'border-green-200' : 'border-gray-100'
                    }`}
                  >
                    <div className="relative h-32 overflow-hidden">
                      <img
                        src={emptyLeg.image_url || getDefaultImage()}
                        alt={`${emptyLeg.from} to ${emptyLeg.to}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = getDefaultImage();
                        }}
                      />
                      
                      {isNFTFreeEligible(emptyLeg) && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                          <Star size={10} className="fill-current" />
                          FREE
                        </div>
                      )}
                      
                      {/* Carbon Neutral Badge */}
                      <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                        <Leaf size={10} />
                        Carbon Neutral
                      </div>
                      
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                        {formatDateTime(emptyLeg.departure_date, emptyLeg.departure_time)}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="mb-3">
                        <div className="flex items-center justify-center gap-2 bg-blue-50 rounded-lg p-2 mb-2">
                          <span className="text-sm font-bold text-blue-900">
                            {emptyLeg.from_iata || emptyLeg.from}
                          </span>
                          <ArrowRight size={12} className="text-blue-600" />
                          <span className="text-sm font-bold text-blue-900">
                            {emptyLeg.to_iata || emptyLeg.to}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 text-center">
                          {emptyLeg.from_city || emptyLeg.from} → {emptyLeg.to_city || emptyLeg.to}
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-gray-100 rounded-lg p-2 text-center">
                          <Plane size={14} className="mx-auto mb-1 text-gray-500" />
                          <div className="text-xs text-gray-700 font-medium truncate">
                            {emptyLeg.aircraft_type}
                          </div>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-2 text-center">
                          <Users size={14} className="mx-auto mb-1 text-gray-500" />
                          <div className="text-xs text-gray-700 font-medium">
                            {emptyLeg.capacity} seats
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-lg font-bold ${
                          isNFTFreeEligible(emptyLeg) ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {isNFTFreeEligible(emptyLeg) ? 'FREE*' : `$${emptyLeg.price_usd?.toLocaleString()}`}
                        </div>
                        {!isNFTFreeEligible(emptyLeg) && (
                          <div className="text-xs text-gray-500 line-through">
                            Regular: ${((emptyLeg.price_usd || 0) * 3).toLocaleString()}
                          </div>
                        )}
                        <div className="text-xs text-green-600 font-medium mt-1">
                          Save up to 75% • Carbon Neutral Included
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
  
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
      case 'emptylegs':
        return <EmptyLegsComponent />;
        
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
          fontFamily: 'DM Sans, sans-serif',
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
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: '400',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        }}>
          <Header onShowDashboard={() => {}} nftBenefits={[]} />
          
          <Hero />

          <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
            <div className="w-full max-w-4xl mx-auto text-center">
              <div className="mb-10">
                <div className="max-w-3xl mx-auto">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                    
                    <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                      <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={landingInput}
                        onChange={(e) => setLandingInput(e.target.value)}
                        onKeyDown={handleLandingKeyDown}
                        placeholder="New York, NY 10038, United States"
                        className="flex-1 text-sm bg-transparent border-0 outline-none placeholder-gray-400 text-gray-900"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      />
                      <button 
                        onClick={() => setLandingInput("")}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Clear search"
                      >
                        <X size={14} className="text-gray-400" />
                      </button>
                      <button
                        onClick={handleStartSearch}
                        disabled={!landingInput.trim() && selectedServices.length === 0}
                        className="ml-2 bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed font-medium text-sm whitespace-nowrap"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        Search
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 justify-center mt-6">
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
                            style={{ fontFamily: 'DM Sans, sans-serif' }}
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
                      
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 rounded-full hover:border-gray-300" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        <SlidersHorizontal size={12} />
                        Filter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-10">
                {[
                  { title: 'Empty legs to Switzerland?', icon: Route },
                  { title: 'Cheap flights to London?', icon: Plane },
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
                      className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 text-left transition-colors border border-gray-100 hover:border-gray-200"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      <div className="mb-2">
                        <IconComponent size={14} className="text-gray-500" />
                      </div>
                      <h3 className="text-xs font-medium text-gray-900" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        {item.title}
                      </h3>
                    </button>
                  );
                })}
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Powered by PrivateCharterX
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-gray-400" style={{ fontFamily: 'DM Sans, sans-serif' }}>
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
      <div className="w-full max-w-5xl h-[85vh] max-h-[85vh] bg-white rounded-2xl shadow-xl overflow-hidden relative flex flex-col">
        
        <button
          onClick={() => {
            setShowMainModal(false);
            setMessages([]);
            setCartItems([]);
            setSelectedServices([]);
            setLandingInput('');
          }}
          className="absolute top-4 right-4 z-50 p-2 hover:bg-gray-100 rounded-full transition-colors bg-white shadow-lg"
        >
          <X size={20} className="text-gray-600" />
        </button>
        
        <div className="flex h-full">
          
          <div className={`border-r border-gray-100 flex flex-col bg-white/80 backdrop-blur-sm transition-all duration-300 ${
            sidebarCollapsed ? 'w-14' : 'w-60'
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
                    {item.id === 'emptylegs' && !sidebarCollapsed && (
                      <span className="ml-auto text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded">
                        Save 75%
                      </span>
                    )}
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
                            <button className="p-1 hover:bg-gray-100 rounded transition-colors" onClick={() => setLandingInput("")}>
                              <X size={14} className="text-gray-400" />
                            </button>
                          )}
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {/* Date and time picker fields removed. Only search input and clear button remain. */}
                          </span>
                        </div>
                      </div>
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
                      placeholder="Ask about empty legs, destinations, or any travel needs..."
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
            <div className="w-72 border-l border-gray-100 flex flex-col bg-white/80 backdrop-blur-sm">
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
                    item.type === 'empty-leg' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'
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