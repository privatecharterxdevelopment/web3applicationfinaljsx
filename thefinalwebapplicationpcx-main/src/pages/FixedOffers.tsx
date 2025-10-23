import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, Clock, Info, X, ExternalLink, Search, Send, Plus, ArrowRight, Grid, List, Check, ChevronLeft, ChevronRight, RefreshCw, Wifi, Car, Utensils, Bed, Camera, Euro, DollarSign, PoundSterling } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { createClient } from '@supabase/supabase-js';
import { createRequest } from '../services/requests';
import { supabase } from '../lib/supabase';
import { airportsStaticService } from '../services/airportsStaticService';

export interface FixedOffer {
  id: string;
  title: string;
  description: string;
  origin: string;
  destination?: string;
  origin_continent?: string;
  destination_continent?: string;
  intermediate_stops?: string[];
  price?: number;
  currency?: string;
  departure_date?: string;
  return_date?: string;
  image_url?: string;
  aircraft_type?: string;
  aircraft_category?: string;
  passengers?: number;
  duration?: string;
  is_featured?: boolean;
  is_empty_leg?: boolean;
  created_at: string;
  updated_at?: string;
  price_on_request?: string;
  // Extended fields
  includes_helicopter?: boolean;
  helicopter_details?: string;
  includes_safari?: boolean;
  safari_details?: string;
  includes_yacht?: boolean;
  yacht_details?: string;
  accommodation?: string;
  activities?: string[];
  inclusions?: string[];
  exclusions?: string[];
  min_passengers?: number;
  max_passengers?: number;
  cancellation_policy?: string;
  weather_dependency?: boolean;
  includes_wifi?: boolean;
  includes_catering?: boolean;
  includes_ground_transport?: boolean;
  includes_accommodation?: boolean;
  includes_concierge?: boolean;
  includes_photography?: boolean;
  package_type?: string;
  difficulty_level?: string;
  age_restriction?: string;
  equipment_provided?: boolean;
  guide_included?: boolean;
  insurance_included?: boolean;
}

const currencies = [
  { code: 'EUR', symbol: '€', icon: Euro },
  { code: 'USD', symbol: '$', icon: DollarSign },
  { code: 'GBP', symbol: '£', icon: PoundSterling },
];

// Function to get continent from airport code or city name
const getContinentFromAirport = async (location: string | null | undefined): Promise<string> => {
  if (!location) return '';

  // First try to find by airport code (3-4 characters)
  if (location.length >= 3 && location.length <= 4) {
    const airport = await airportsStaticService.getAirportByCode(location);
    if (airport?.continent) {
      return airport.continent;
    }
  }

  // If not found by code, try searching by city/location name
  const airports = await airportsStaticService.searchAirports(location, 5);
  const airportWithContinent = airports.find(airport => airport.continent);

  return airportWithContinent?.continent || '';
};

// Mock data for fallback when Supabase is unavailable
const mockFixedOffers: FixedOffer[] = [
  {
    id: 'mock-1',
    title: 'Alpine Adventure to Geneva',
    description: 'Experience the breathtaking Swiss Alps with a luxury private journey to Geneva.\n\nThis exclusive package includes helicopter transfers to premier ski resorts, luxury accommodation at the Four Seasons Hotel des Bergues, and guided mountain excursions.\n\nPerfect for those seeking adventure combined with ultimate luxury.',
    origin: 'London',
    destination: 'Geneva',
    intermediate_stops: ['Paris'],
    price: 25000,
    currency: 'EUR',
    image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
    passengers: 6,
    duration: '3 days',
    is_featured: true,
    is_empty_leg: false,
    created_at: new Date().toISOString(),
    includes_helicopter: true,
    includes_wifi: true,
    includes_catering: true,
    includes_accommodation: true,
    includes_ground_transport: true,
    activities: ['Helicopter skiing', 'Mountain hiking', 'Luxury spa treatments', 'Fine dining experiences'],
    inclusions: ['Private transportation', 'Helicopter transfers', '3-night luxury accommodation', 'All meals included', 'Professional guide'],
    min_passengers: 2,
    max_passengers: 6,
    package_type: 'Adventure',
    difficulty_level: 'Moderate',
    guide_included: true,
    equipment_provided: true,
    cancellation_policy: '48-hour cancellation policy applies'
  },
  {
    id: 'mock-2',
    title: 'Safari Expedition to Kenya',
    description: 'Embark on an unforgettable African safari adventure with luxury private transportation.\n\nWitness the Great Migration, stay in exclusive safari lodges, and enjoy game drives in the Maasai Mara.\n\nThis once-in-a-lifetime experience combines wildlife adventure with five-star comfort.',
    origin: 'London',
    destination: 'Nairobi',
    price: 45000,
    currency: 'EUR',
    image_url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
    passengers: 12,
    duration: '7 days',
    is_featured: false,
    is_empty_leg: false,
    created_at: new Date().toISOString(),
    includes_safari: true,
    includes_accommodation: true,
    includes_photography: true,
    includes_wifi: true,
    includes_catering: true,
    activities: ['Game drives', 'Hot air balloon safari', 'Cultural village visits', 'Photography workshops'],
    inclusions: ['Private transportation', 'Safari lodge accommodation', 'All game drives', 'Professional safari guide', 'Photography equipment'],
    min_passengers: 4,
    max_passengers: 12,
    package_type: 'Safari',
    difficulty_level: 'Easy',
    guide_included: true,
    equipment_provided: true,
    insurance_included: true
  },
  {
    id: 'mock-3',
    title: 'Mediterranean Yacht Charter',
    description: 'Discover the French Riviera in ultimate luxury aboard your private yacht.\n\nTravel to Nice and board a spectacular 150ft yacht for a week of Mediterranean bliss.\n\nExplore Monaco, Cannes, and Saint-Tropez with complete freedom and privacy.',
    origin: 'London',
    destination: 'Nice',
    price: 65000,
    currency: 'EUR',
    image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    passengers: 14,
    duration: '7 days',
    is_featured: true,
    is_empty_leg: false,
    created_at: new Date().toISOString(),
    includes_yacht: true,
    includes_accommodation: true,
    includes_concierge: true,
    includes_wifi: true,
    includes_catering: true,
    activities: ['Yacht cruising', 'Water sports', 'Fine dining', 'Casino visits', 'Shopping in Monaco'],
    inclusions: ['Private transportation', 'Luxury yacht charter', 'Professional crew', 'Gourmet meals', 'Water sports equipment'],
    min_passengers: 6,
    max_passengers: 14,
    package_type: 'Luxury',
    difficulty_level: 'Easy',
    guide_included: true,
    insurance_included: true
  },
  {
    id: 'mock-4',
    title: 'Dubai Desert Adventure',
    description: 'Experience the magic of Dubai with desert adventures and city luxury.\n\nStay at the Burj Al Arab, enjoy desert camping under the stars, and explore the modern marvels of this incredible city.\n\nPerfect blend of adventure and urban sophistication.',
    origin: 'London',
    destination: 'Dubai',
    price: 35000,
    currency: 'EUR',
    image_url: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?auto=format&fit=crop&w=800&q=80',
    passengers: 8,
    duration: '5 days',
    is_featured: false,
    is_empty_leg: true,
    created_at: new Date().toISOString(),
    includes_accommodation: true,
    includes_ground_transport: true,
    includes_wifi: true,
    includes_catering: true,
    activities: ['Desert safari', 'Camel riding', 'Dune bashing', 'City tours', 'Shopping experiences'],
    inclusions: ['Private transportation', 'Luxury hotel accommodation', 'Desert camping experience', 'All transfers', 'Professional guide'],
    min_passengers: 2,
    max_passengers: 8,
    package_type: 'Adventure',
    difficulty_level: 'Moderate',
    guide_included: true,
    equipment_provided: true
  },
  {
    id: 'mock-5',
    title: 'New York Business Express',
    description: 'Fast-track business trip to New York with luxury accommodations.\n\nPerfect for business meetings, includes helicopter transfers and premium hotel stays.\n\nEfficient and luxurious travel solution for busy executives.',
    origin: 'London',
    destination: 'New York',
    price: 28000,
    currency: 'EUR',
    image_url: 'https://images.unsplash.com/photo-1496588152823-86ff7695e68f?auto=format&fit=crop&w=800&q=80',
    passengers: 10,
    duration: '3 days',
    is_featured: false,
    is_empty_leg: false,
    created_at: new Date().toISOString(),
    includes_helicopter: true,
    includes_accommodation: true,
    includes_ground_transport: true,
    includes_wifi: true,
    includes_catering: true,
    includes_concierge: true,
    activities: ['Business meetings', 'City tours', 'Fine dining', 'Broadway shows'],
    inclusions: ['Private transportation', 'Luxury hotel', 'Helicopter transfers', 'Ground transportation', 'Concierge services'],
    min_passengers: 1,
    max_passengers: 10,
    package_type: 'Business',
    difficulty_level: 'Easy',
    guide_included: false,
    insurance_included: true
  },
  {
    id: 'mock-6',
    title: 'Aspen Ski Adventure',
    description: 'Ultimate ski experience in Aspen with private luxury transportation.\n\nStay at exclusive mountain resorts, enjoy helicopter skiing, and experience world-class slopes.\n\nPerfect winter adventure for skiing enthusiasts.',
    origin: 'Los Angeles',
    destination: 'Aspen',
    price_on_request: 'true',
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1551524164-687a55dd1126?auto=format&fit=crop&w=800&q=80',
    passengers: 8,
    duration: '5 days',
    is_featured: true,
    is_empty_leg: false,
    created_at: new Date().toISOString(),
    includes_helicopter: true,
    includes_accommodation: true,
    includes_equipment: true,
    includes_wifi: true,
    includes_catering: true,
    activities: ['Helicopter skiing', 'Resort skiing', 'Spa treatments', 'Mountain dining', 'Après-ski entertainment'],
    inclusions: ['Private transportation', 'Luxury resort accommodation', 'Ski equipment rental', 'Helicopter skiing', 'Mountain guide'],
    min_passengers: 2,
    max_passengers: 8,
    package_type: 'Adventure',
    difficulty_level: 'Moderate',
    guide_included: true,
    equipment_provided: true,
    weather_dependency: true
  }
];

// FIXED: Enhanced Supabase fetch function with improved filtering
const fetchFixedOffers = async (params: {
  page: number;
  limit: number;
  category?: string;
  searchTerm?: string;
}): Promise<{
  data: FixedOffer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  console.log('🔍 Starting fetch with params:', params);

  // First try Supabase connection
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    console.log('🧪 Testing Supabase connection...');
    const connectionTest = await supabase.from('fixed_offers').select('count', { count: 'exact' }).limit(1);

    if (connectionTest.error) {
      throw new Error(`Supabase connection failed: ${connectionTest.error.message}`);
    }

    console.log('✅ Supabase connected, fetching real data...');

    // Build and execute query with improved filtering
    let query = supabase.from('fixed_offers').select('*', { count: 'exact' });

    // Apply search filter first
    if (params.searchTerm?.trim()) {
      const search = params.searchTerm.trim();
      query = query.or(`title.ilike.%${search}%,origin.ilike.%${search}%,destination.ilike.%${search}%,description.ilike.%${search}%,package_type.ilike.%${search}%`);
    }

    // Apply category filter using continent-based filtering
    if (params.category && params.category !== 'all') {
      switch (params.category) {
        case 'europe':
          query = query.or('destination_continent.eq.Europe,origin_continent.eq.Europe');
          break;
        case 'africa':
          query = query.or('destination_continent.eq.Africa,origin_continent.eq.Africa');
          break;
        case 'asia':
          query = query.or('destination_continent.eq.Asia,origin_continent.eq.Asia');
          break;
        case 'usa':
        case 'north-america':
          query = query.or('destination_continent.eq.North America,origin_continent.eq.North America');
          break;
        case 'south-america':
          query = query.or('destination_continent.eq.South America,origin_continent.eq.South America');
          break;
        case 'oceania':
          query = query.or('destination_continent.eq.Oceania,origin_continent.eq.Oceania');
          break;
      }
    }

    query = query.order('created_at', { ascending: false });

    const from = (params.page - 1) * params.limit;
    const to = from + params.limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    console.log(`✅ Supabase query successful: ${data?.length || 0} items`);

    return {
      data: data || [],
      total: count || 0,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil((count || 0) / params.limit)
    };

  } catch (supabaseError) {
    console.warn('⚠️ Supabase unavailable, using mock data:', supabaseError);

    // Enhance mock data with continent information
    const enhancedOffers = await Promise.all(
      mockFixedOffers.map(async (offer) => {
        const originContinent = await getContinentFromAirport(offer.origin);
        const destinationContinent = offer.destination ? await getContinentFromAirport(offer.destination) : '';

        return {
          ...offer,
          origin_continent: originContinent,
          destination_continent: destinationContinent
        };
      })
    );

    // Fallback to enhanced mock data with continent-based filtering
    let filteredOffers = [...enhancedOffers];

    // Apply search filter
    if (params.searchTerm?.trim()) {
      const search = params.searchTerm.trim().toLowerCase();
      filteredOffers = filteredOffers.filter(offer =>
        offer.title.toLowerCase().includes(search) ||
        offer.origin.toLowerCase().includes(search) ||
        offer.destination?.toLowerCase().includes(search) ||
        offer.description.toLowerCase().includes(search) ||
        offer.package_type?.toLowerCase().includes(search) ||
        offer.activities?.some(activity => activity.toLowerCase().includes(search))
      );
    }

    // Apply category filter using continent data
    if (params.category && params.category !== 'all') {
      console.log(`🏷️ Filtering by category: ${params.category}`);
      switch (params.category) {
        case 'europe':
          filteredOffers = filteredOffers.filter(offer => {
            const isEurope = offer.origin_continent === 'Europe' || offer.destination_continent === 'Europe';
            console.log(`Europe filter - ${offer.title}: ${isEurope} (origin: ${offer.origin_continent}, dest: ${offer.destination_continent})`);
            return isEurope;
          });
          break;
        case 'africa':
          filteredOffers = filteredOffers.filter(offer => {
            const isAfrica = offer.origin_continent === 'Africa' || offer.destination_continent === 'Africa';
            console.log(`Africa filter - ${offer.title}: ${isAfrica} (origin: ${offer.origin_continent}, dest: ${offer.destination_continent})`);
            return isAfrica;
          });
          break;
        case 'asia':
          filteredOffers = filteredOffers.filter(offer => {
            const isAsia = offer.origin_continent === 'Asia' || offer.destination_continent === 'Asia';
            console.log(`Asia filter - ${offer.title}: ${isAsia} (origin: ${offer.origin_continent}, dest: ${offer.destination_continent})`);
            return isAsia;
          });
          break;
        case 'usa':
        case 'north-america':
          filteredOffers = filteredOffers.filter(offer => {
            const isNorthAmerica = offer.origin_continent === 'North America' || offer.destination_continent === 'North America';
            console.log(`North America filter - ${offer.title}: ${isNorthAmerica} (origin: ${offer.origin_continent}, dest: ${offer.destination_continent})`);
            return isNorthAmerica;
          });
          break;
        case 'south-america':
          filteredOffers = filteredOffers.filter(offer => {
            const isSouthAmerica = offer.origin_continent === 'South America' || offer.destination_continent === 'South America';
            console.log(`South America filter - ${offer.title}: ${isSouthAmerica} (origin: ${offer.origin_continent}, dest: ${offer.destination_continent})`);
            return isSouthAmerica;
          });
          break;
        case 'oceania':
          filteredOffers = filteredOffers.filter(offer => {
            const isOceania = offer.origin_continent === 'Oceania' || offer.destination_continent === 'Oceania';
            console.log(`Oceania filter - ${offer.title}: ${isOceania} (origin: ${offer.origin_continent}, dest: ${offer.destination_continent})`);
            return isOceania;
          });
          break;
      }

      console.log(`📦 After ${params.category} filter: ${filteredOffers.length} packages remain`);
      filteredOffers.forEach(offer => console.log(`- ${offer.title} (${offer.destination})`));
    }

    // Apply pagination
    const total = filteredOffers.length;
    const from = (params.page - 1) * params.limit;
    const paginatedData = filteredOffers.slice(from, from + params.limit);

    console.log(`📦 Mock data filtered: ${paginatedData.length} items (${total} total after filters)`);

    return {
      data: paginatedData,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit)
    };
  }
};

const FixedOffers: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [fixedOffers, setFixedOffers] = useState<FixedOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [totalOffers, setTotalOffers] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState<FixedOffer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedDepartureDate, setSelectedDepartureDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPassengers, setSelectedPassengers] = useState(2);
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
  const [activeTab, setActiveTab] = useState('overview');
  const [dateSelectionMode, setDateSelectionMode] = useState<'departure' | 'return'>('departure');
  const [showCalendar, setShowCalendar] = useState(false);

  // FIXED: Enhanced filter handlers
  const handleSearchChange = (value: string) => {
    console.log('🔍 Search changed to:', value);
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const filterOffersByCategory = (category: string) => {
    console.log('🏷️ Filtering by category:', category);
    setFilterCategory(category);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    console.log('🧹 Clearing all filters');
    setSearchTerm('');
    setFilterCategory('all');
    setCurrentPage(1);
  };

  // Debug function (remove in production)
  const debugFilterState = () => {
    console.log('🔍 Current filter state:', {
      searchTerm,
      filterCategory,
      currentPage,
      totalOffers,
      offersShown: fixedOffers.length
    });
  };

  // Enhanced fetch with detailed logging
  useEffect(() => {
    console.log('🔄 useEffect triggered - fetching data...');
    console.log('🔄 Current state:', { currentPage, filterCategory, searchTerm });
    fetchFixedOffersData();
  }, [currentPage, filterCategory, searchTerm]);

  const fetchFixedOffersData = async () => {
    console.log('🚀 fetchFixedOffersData called');

    try {
      console.log('⏳ Setting loading state');
      setIsLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        searchTerm: searchTerm.trim() || undefined
      };

      console.log('📋 Fetch params:', params);

      const result = await fetchFixedOffers(params);

      console.log('📦 Setting offers data:', result);
      setFixedOffers(result.data);
      setTotalOffers(result.total);
      setConnectionStatus('connected');
      console.log('✅ Data loaded successfully:', result.data.length, 'offers');

    } catch (error) {
      console.error('💥 fetchFixedOffersData failed:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to load packages';
      setError(`Database connection issue: ${errorMessage}`);
      setFixedOffers([]);
      setTotalOffers(0);
      setConnectionStatus('disconnected');

      console.log('ℹ️ Using offline mode with sample data');
    } finally {
      console.log('🔄 Setting loading to false');
      setIsLoading(false);
    }
  };

  // Manual debug fetch
  const debugFetch = async () => {
    console.log('🧪 Manual debug fetch triggered');
    await fetchFixedOffersData();
  };

  // Helper function to render description with line breaks
  const renderDescription = (description: string) => {
    return description.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < description.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const getInclusionIcon = (inclusion: string) => {
    const text = inclusion.toLowerCase();
    if (text.includes('wifi') || text.includes('internet')) return <Wifi size={16} className="text-blue-600" />;
    if (text.includes('transport') || text.includes('transfer')) return <Car size={16} className="text-green-600" />;
    if (text.includes('meal') || text.includes('catering') || text.includes('dining')) return <Utensils size={16} className="text-orange-600" />;
    if (text.includes('accommodation') || text.includes('hotel') || text.includes('lodge')) return <Bed size={16} className="text-purple-600" />;
    if (text.includes('photo') || text.includes('camera')) return <Camera size={16} className="text-pink-600" />;
    return <Check size={16} className="text-green-600" />;
  };

  // Enhanced inclusions rendering
  const renderInclusions = (offer: FixedOffer) => {
    const dynamicInclusions = [];

    if (offer.includes_wifi) dynamicInclusions.push('High-speed WiFi');
    if (offer.includes_catering) dynamicInclusions.push('Gourmet catering');
    if (offer.includes_ground_transport) dynamicInclusions.push('Ground transportation');
    if (offer.includes_accommodation) dynamicInclusions.push('Luxury accommodation');
    if (offer.includes_concierge) dynamicInclusions.push('Concierge services');
    if (offer.includes_photography) dynamicInclusions.push('Professional photography');
    if (offer.includes_helicopter) dynamicInclusions.push('Helicopter experience');
    if (offer.includes_yacht) dynamicInclusions.push('Yacht charter');
    if (offer.includes_safari) dynamicInclusions.push('Safari experience');
    if (offer.guide_included) dynamicInclusions.push('Professional guide');
    if (offer.equipment_provided) dynamicInclusions.push('Equipment provided');
    if (offer.insurance_included) dynamicInclusions.push('Travel insurance');

    const allInclusions = [...dynamicInclusions, ...(offer.inclusions || [])];
    const uniqueInclusions = [...new Set(allInclusions)];

    return uniqueInclusions;
  };

  // Enhanced Calendar functionality
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isDateAvailable = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const isDateSelected = (date: Date) => {
    const dateStr = date.toDateString();
    return selectedDepartureDate?.toDateString() === dateStr;
  };

  const isDeparture = (date: Date) => {
    return selectedDepartureDate?.toDateString() === date.toDateString();
  };

  const handleDateClick = (date: Date) => {
    if (!isDateAvailable(date)) return;
    setSelectedDepartureDate(date);
    setShowCalendar(false);
  };

  const resetDateSelection = () => {
    setSelectedDepartureDate(null);
    setDateSelectionMode('departure');
  };

  // Currency conversion (mock rates - in real app, fetch from API)
  const convertPrice = (price: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return price;

    // Mock conversion rates (EUR as base)
    const rates: { [key: string]: number } = {
      'EUR': 1,
      'USD': 1.09,
      'GBP': 0.86
    };

    const eurPrice = price / rates[fromCurrency];
    return Math.round(eurPrice * rates[toCurrency]);
  };

  const getCurrencySymbol = (code: string) => {
    return currencies.find(c => c.code === code)?.symbol || code;
  };

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleOfferClick = (offer: FixedOffer) => {
    setSelectedOffer(offer);
    setShowModal(true);
    setSelectedPassengers(offer.min_passengers || 2);
    resetDateSelection();
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOffer(null);
    resetDateSelection();
    setMessage('');
    setShowSuccess(false);
    setActiveTab('overview');
    setShowCalendar(false);
  };

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

  const handleSendRequest = async () => {
    if (!selectedOffer || !user) {
      if (!isAuthenticated) {
        alert('Please log in to book this package');
        return;
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const userName = user.name ||
        user.full_name ||
        `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
        'Unknown User';

      // Enhanced request data with all booking details
      const requestData = {
        user_id: user.id,
        type: 'fixed_offer',
        status: 'pending',
        client_name: userName,
        client_email: user.email,
        client_phone: user.phone || user.phone_number || null,
        data: {
          // Basic offer information
          offer_id: selectedOffer.id,
          offer_title: selectedOffer.title,
          offer_description: selectedOffer.description,
          origin: selectedOffer.origin,
          destination: selectedOffer.destination,

          // Selected booking details
          departure_date: selectedDepartureDate?.toISOString(),
          departure_date_formatted: selectedDepartureDate?.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          passengers: selectedPassengers,
          selected_currency: selectedCurrency,

          // Price information
          original_price: selectedOffer.price,
          original_currency: selectedOffer.currency || 'EUR',
          converted_price: selectedOffer.price ? convertPrice(selectedOffer.price, selectedOffer.currency || 'EUR', selectedCurrency) : null,
          price_on_request: selectedOffer.price_on_request || (!selectedOffer.price),

          // Additional details
          message: message,
          duration: selectedOffer.duration,
          package_type: selectedOffer.package_type,
          difficulty_level: selectedOffer.difficulty_level,

          // Inclusions and features
          includes_wifi: selectedOffer.includes_wifi,
          includes_catering: selectedOffer.includes_catering,
          includes_ground_transport: selectedOffer.includes_ground_transport,
          includes_accommodation: selectedOffer.includes_accommodation,
          includes_concierge: selectedOffer.includes_concierge,
          includes_photography: selectedOffer.includes_photography,
          includes_helicopter: selectedOffer.includes_helicopter,
          includes_yacht: selectedOffer.includes_yacht,
          includes_safari: selectedOffer.includes_safari,
          guide_included: selectedOffer.guide_included,
          equipment_provided: selectedOffer.equipment_provided,
          insurance_included: selectedOffer.insurance_included,

          // Complete offer details for reference
          full_offer_details: selectedOffer,

          // Client information
          client_info: {
            name: userName,
            email: user.email,
            phone: user.phone || user.phone_number,
            user_id: user.id
          },

          // Booking metadata
          booking_timestamp: new Date().toISOString(),
          booking_source: 'fixed_offers_modal',
          view_mode: viewMode,
          search_term_used: searchTerm,
          filter_category_used: filterCategory
        }
      };

      console.log('📤 Submitting enhanced request:', requestData);

      // Use the createRequest service with Supabase
      await createRequest({
        userId: user.id,
        type: 'fixed_offer',
        data: requestData.data
      });

      console.log('✅ Request submitted successfully with all booking details');
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        setShowModal(false);
        resetDateSelection();
        setMessage('');
      }, 3000);

    } catch (error) {
      console.error('💥 Error submitting request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to submit request: ${errorMessage}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDefaultImage = () => {
    return 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80';
  };

  const totalPages = Math.ceil(totalOffers / itemsPerPage);

  // Dynamic tabs based on available data - SIMPLIFIED TO 2 TABS
  const getDynamicTabs = (offer: FixedOffer | null) => {
    if (!offer) return [];

    const tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'booking', label: 'Book Now' }
    ];

    return tabs;
  };

  const tabs = getDynamicTabs(selectedOffer);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="flex-1 pt-[88px]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          {/* Hero Section - MATCHING HELICOPTER CHARTER STYLE */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-4 tracking-tighter">
              Enjoy Adventure Packages Worldwide
            </h1>

            <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto font-light">
              Experience extraordinary destinations with our curated luxury adventure packages. From alpine expeditions to safari adventures, discover the world's most exclusive travel experiences.
            </p>
          </div>

          {/* Search Bar - N26 Style */}
          <div className="mb-8">
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={20} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search destinations, origins, or experiences..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="block w-full pl-12 pr-12 py-4 text-lg border-0 rounded-2xl bg-white shadow-sm ring-1 ring-gray-300 focus:ring-2 focus:ring-black focus:ring-offset-0 transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>



          {/* DEBUG INFO - Updated for mock data */}
          {connectionStatus === 'disconnected' && (
            <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">Demo Mode Active</h4>
                  <p className="text-sm text-blue-600">
                    Database connection unavailable. Showing sample packages for demonstration.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={debugFilterState}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                  >
                    Debug Filters
                  </button>
                  <button
                    onClick={debugFetch}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw size={16} className="mr-2 inline" />
                    Retry Connection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MOBILE OPTIMIZED FILTERS AND VIEW SWITCHER - ADJUSTED ALIGNMENT */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <div className="lg:flex-1">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                Available Packages
              </h2>
              {totalOffers > 0 && (
                <p className="text-sm md:text-base text-gray-600 mt-1">
                  {totalOffers} {totalOffers === 1 ? 'package' : 'packages'} found
                  {(searchTerm || filterCategory !== 'all') && (
                    <span className="ml-2 text-sm">
                      {searchTerm && `for "${searchTerm}"`}
                      {searchTerm && filterCategory !== 'all' && ' in '}
                      {filterCategory !== 'all' && `${filterCategory.charAt(0).toUpperCase() + filterCategory.slice(1)}`}
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Mobile-Optimized Filters and View Mode - MOVED MORE RIGHT */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto lg:flex-shrink-0 lg:ml-8">
              {/* Filters - Mobile Responsive */}
              <div className="flex flex-wrap sm:inline-flex bg-white rounded-full p-1 shadow-sm border border-gray-200 w-full sm:w-auto">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'europe', label: 'Europe' },
                  { key: 'africa', label: 'Africa' },
                  { key: 'asia', label: 'Asia' },
                  { key: 'usa', label: 'USA' }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => filterOffersByCategory(filter.key)}
                    className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 min-w-0 ${filterCategory === filter.key
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-700 hover:text-black hover:bg-gray-50'
                      }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 md:p-3 rounded-lg transition-all duration-200 ${viewMode === 'grid'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <Grid size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 md:p-3 rounded-lg transition-all duration-200 ${viewMode === 'list'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <List size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
              </div>
            </div>
          </div>

          {/* Adventure Packages Display */}
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 text-lg">Loading packages...</p>
            </div>
          ) : fixedOffers.length > 0 ? (
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid-cols-1 max-w-5xl mx-auto'
              } gap-6`}>
              {fixedOffers.map((offer) => (
                <div
                  key={offer.id}
                  className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 cursor-pointer ${viewMode === 'list' ? 'flex flex-row' : 'flex flex-col'
                    }`}
                  onClick={() => handleOfferClick(offer)}
                >
                  <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-80 h-56 flex-shrink-0' : 'h-64'
                    }`}>
                    <img
                      src={offer.image_url || getDefaultImage()}
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        e.currentTarget.src = getDefaultImage();
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Modern badges with backdrop blur */}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      {offer.is_featured && (
                        <span className="bg-black/90 backdrop-blur-md text-white text-xs px-3 py-2 rounded-full font-semibold border border-white/20">
                          Featured
                        </span>
                      )}
                      {offer.is_empty_leg && (
                        <span className="bg-green-600/90 backdrop-blur-md text-white text-xs px-3 py-2 rounded-full font-semibold border border-white/20">
                          Empty Leg
                        </span>
                      )}
                      {offer.package_type && (
                        <span className="bg-gray-900/90 backdrop-blur-md text-white text-xs px-3 py-2 rounded-full font-semibold border border-white/20">
                          {offer.package_type}
                        </span>
                      )}
                    </div>

                    {/* Price overlay on image */}
                    <div className="absolute bottom-4 right-4">
                      {offer.price_on_request ? (
                        <div className="bg-white/95 backdrop-blur-md rounded-xl px-4 py-2 border border-gray-200/50">
                          <div className="text-sm font-bold text-gray-900">Price on Request</div>
                        </div>
                      ) : offer.price && offer.price > 0 ? (
                        <div className="bg-white/95 backdrop-blur-md rounded-xl px-4 py-2 border border-gray-200/50">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-medium text-gray-600">
                              {getCurrencySymbol(selectedCurrency)}
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              {convertPrice(offer.price, offer.currency || 'EUR', selectedCurrency).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 text-center">estimated</div>
                        </div>
                      ) : (
                        <div className="bg-white/95 backdrop-blur-md rounded-xl px-4 py-2 border border-gray-200/50">
                          <div className="text-sm font-bold text-gray-900">On Request</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col bg-white">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-black transition-colors leading-tight">
                      {offer.title}
                    </h3>

                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin size={16} className="mr-2 flex-shrink-0 text-gray-400" />
                      <span className="text-sm font-medium">
                        {offer.destination}
                      </span>
                    </div>

                    {/* Minimalist info badges - REMOVED AIRCRAFT INFO */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <div className="flex items-center text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-full border border-gray-200">
                        <Clock size={12} className="mr-1.5 text-gray-500" />
                        <span className="font-medium">{offer.duration || 'Flexible'}</span>
                      </div>
                      {offer.passengers && (
                        <div className="flex items-center text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-full border border-gray-200">
                          <Users size={12} className="mr-1.5 text-gray-500" />
                          <span className="font-medium">Up to {offer.passengers}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto">
                      <button
                        className="w-full bg-black text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-black"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOfferClick(offer);
                        }}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Info size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No packages found</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
                {searchTerm || filterCategory !== 'all'
                  ? 'No packages match your current search criteria. Try adjusting your filters or search terms.'
                  : 'No packages are currently available. Please check back later or contact us for custom packages.'
                }
              </p>
              {(searchTerm || filterCategory !== 'all') && (
                <button
                  onClick={clearAllFilters}
                  className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors font-medium"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          {/* Pagination Controls - N26 Style */}
          {totalPages > 1 && fixedOffers.length > 0 && !error && (
            <div className="flex justify-center items-center mt-16">
              <div className="flex items-center bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-6 py-4 transition-colors ${currentPage === 1
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex items-center">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`px-6 py-4 text-sm font-medium transition-colors ${currentPage === pageNum
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
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-6 py-4 transition-colors ${currentPage === totalPages
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* ENHANCED MODAL - MATCHING EMPTYLEG SIZE */}
      {showModal && selectedOffer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          {showSuccess ? (
            <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 text-center shadow-lg mx-4">
              <div className="w-20 md:w-24 h-20 md:h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Check size={40} className="md:w-12 md:h-12 text-green-600" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3 md:mb-4">Booking Request Sent</h3>
              <p className="text-sm md:text-base text-gray-600 mb-2 leading-relaxed">
                Thank you for your interest in <strong>{selectedOffer.title}</strong>.
              </p>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                Our team will contact you within 24 hours to confirm your booking.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-lg flex flex-col max-h-[90vh]">
              {/* Header with Hero Image - Compact */}
              <div className="relative">
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                  <X className="w-4 h-4 stroke-2" />
                </button>

                <div className="h-48 bg-gradient-to-br from-gray-900 to-gray-700 relative overflow-hidden rounded-t-2xl">
                  <img
                    src={selectedOffer.image_url || getDefaultImage()}
                    alt={selectedOffer.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = getDefaultImage();
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1.5 rounded-md flex items-center text-sm font-light">
                    <MapPin className="w-4 h-4 mr-2 stroke-1" />
                    {selectedOffer.destination}
                  </div>
                </div>
              </div>

              {/* Content - Compact Layout */}
              <div className="p-5 overflow-y-auto flex-1">
                <div>
                  <h2 className="text-lg font-light text-black mb-2">
                    {selectedOffer.title}
                  </h2>

                  <div className="flex items-center space-x-2 mb-3">
                    {selectedOffer.is_featured && (
                      <div className="bg-gray-100 px-2 py-1 rounded-full flex items-center text-xs text-black font-light">
                        Featured
                      </div>
                    )}
                    {selectedOffer.package_type && (
                      <div className="bg-gray-100 px-2 py-1 rounded-full flex items-center text-xs text-black font-light">
                        {selectedOffer.package_type}
                      </div>
                    )}
                    <div className="bg-gray-100 px-2 py-1 rounded-full flex items-center text-xs text-black font-light">
                      <Clock className="w-3 h-3 mr-1 stroke-1" />
                      {selectedOffer.duration}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="grid grid-cols-2 gap-3 text-sm font-light">
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <div className="text-black">{selectedOffer.duration || 'Flexible'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Passengers:</span>
                        <div className="text-black">{selectedOffer.min_passengers}-{selectedOffer.max_passengers}</div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {selectedOffer.description.split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  </div>

                  {/* Quick inclusions */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-black mb-2">Includes:</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {renderInclusions(selectedOffer).slice(0, 4).map((inclusion, index) => (
                        <div key={index} className="flex items-center text-xs text-gray-600">
                          <Check className="w-3 h-3 mr-1 text-green-600" />
                          <span className="truncate">{inclusion}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Booking section */}
                  <div className="space-y-3">
                    <h3 className="text-base font-light text-black mb-4">Booking details</h3>

                    {/* Date selection - simplified */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Departure Date</label>
                      <button
                        onClick={() => {
                          setDateSelectionMode('departure');
                          setShowCalendar(true);
                        }}
                        className="w-full p-3 border border-gray-200 rounded-xl text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-sm font-medium">
                          {selectedDepartureDate
                            ? selectedDepartureDate.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })
                            : 'Select departure date'
                          }
                        </div>
                      </button>
                    </div>

                    {/* Passengers */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Passengers</label>
                      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                        <span className="text-sm text-gray-700">Number of passengers</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedPassengers(Math.max(selectedOffer.min_passengers || 1, selectedPassengers - 1))}
                            className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-sm font-semibold"
                          >
                            -
                          </button>
                          <span className="text-sm font-semibold w-8 text-center">{selectedPassengers}</span>
                          <button
                            onClick={() => setSelectedPassengers(Math.min(selectedOffer.max_passengers || 12, selectedPassengers + 1))}
                            className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-sm font-semibold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Additional Message</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Any special requirements..."
                        className="w-full h-20 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none text-sm"
                      />
                    </div>

                    {/* Price display */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="text-center">
                        {selectedOffer.price_on_request ? (
                          <div className="text-lg font-semibold text-gray-900">Price on Request</div>
                        ) : selectedOffer.price ? (
                          <>
                            <div className="text-lg font-semibold text-gray-900">
                              {getCurrencySymbol(selectedCurrency)} {convertPrice(selectedOffer.price, selectedOffer.currency || 'EUR', selectedCurrency).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">Total package price</div>
                          </>
                        ) : (
                          <div className="text-lg font-semibold text-gray-900">Price on Request</div>
                        )}
                      </div>
                    </div>

                    {/* Action button */}
                    {!isAuthenticated ? (
                      <button className="w-full bg-black text-white py-3 rounded-xl font-medium transition-colors">
                        Log In to Book
                      </button>
                    ) : (
                      <button
                        onClick={handleSendRequest}
                        disabled={isSubmitting || !selectedDepartureDate}
                        className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            Send Request
                            <Send className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Calendar Modal - Compact */}
                {showCalendar && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[250] p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Select Departure Date</h3>
                        <button
                          onClick={() => setShowCalendar(false)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <h4 className="text-base font-semibold">{formatMonth(currentMonth)}</h4>
                        <button
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                            {day}
                          </div>
                        ))}

                        {getDaysInMonth(currentMonth).map((date, index) => (
                          <button
                            key={index}
                            onClick={() => date && handleDateClick(date)}
                            disabled={!date || !isDateAvailable(date)}
                            className={`
                              aspect-square rounded-lg text-xs font-medium transition-all duration-200 min-h-[2.5rem]
                              ${!date
                                ? 'invisible'
                                : !isDateAvailable(date)
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : isDeparture(date)
                                    ? 'bg-black text-white shadow-lg'
                                    : 'hover:bg-gray-100 text-gray-700'
                              }
                            `}
                          >
                            {date?.getDate()}
                          </button>
                        ))}
                      </div>

                      <div className="text-xs text-gray-500 text-center">
                        Select your departure date for this adventure package
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FixedOffers;
