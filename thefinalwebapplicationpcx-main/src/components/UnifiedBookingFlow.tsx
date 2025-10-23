// src/components/UnifiedBookingFlow.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  MapPin,
  Clock,
  Users,
  Leaf,
  Shield,
  CreditCard,
  Building2,
  Bitcoin,
  X,
  Calendar,
  Plane,
  ArrowUpDown,
  Briefcase,
  Dog,
  Star,
  Car,
  Anchor,
  Flower,
  HeartHandshake,
  Home,
  Sparkles,
  Wine,
  Gift,
  Camera,
  Music,
  Luggage,
  Utensils,
  Heart,
  Accessibility,
  UserCheck,
  Coffee,
  Stethoscope,
  Wallet
} from 'lucide-react';
import { useAccount, useConnect } from 'wagmi';
import { web3Service } from '../lib/web3.ts';
import { airportsStaticService as airportsService, type AirportSearchResult } from '../services/airportsStaticService';
// Alternative: import { airportsService } from '../services/airportsService';
import { bookingService } from '../services/bookingService';
import type { BookingFormData } from '../types/booking';
import FlightDetailsStep from './booking-steps/FlightDetailsStep';
import AircraftSelectionStep from './booking-steps/AircraftSelectionStep';
import ServicesStep from './booking-steps/ServicesStep';
import CarbonOffsetStep from './booking-steps/CarbonOffsetStep';
import BookingSummaryStep from './booking-steps/BookingSummaryStep';
import BookingProgress from './booking-steps/BookingProgress';


// Partner logos for carousel - removed

// Date utilities
const formatDate = (date: Date | null, format: string): string => {
  if (!date) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  if (format === 'MMM d, yyyy') {
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  } else if (format === 'MMMM yyyy') {
    return `${fullMonths[date.getMonth()]} ${date.getFullYear()}`;
  } else if (format === 'MMM d') {
    return `${months[date.getMonth()]} ${date.getDate()}`;
  } else if (format === 'd') {
    return date.getDate().toString();
  }
  return date.toString();
};

const isSameDay = (date1: Date | null, date2: Date | null): boolean => {
  if (!date1 || !date2) return false;
  return date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();
};

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isAfter = (date1: Date, date2: Date): boolean => {
  return date1.getTime() > date2.getTime();
};

const addMonths = (date: Date, months: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const endOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const startOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

const endOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + 6;
  return new Date(d.setDate(diff));
};

const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// Service categories for main page carousel
const serviceCategories = [
  { id: 'private-jet', name: 'Private Jet Charter', action: () => { } },
  { id: 'helicopter', name: 'Helicopter Charter', action: () => { } },
  { id: 'empty-legs', name: 'Empty Legs', action: () => { } },
  { id: 'adventures', name: 'Adventures', action: () => { } },
  { id: 'luxury-cars', name: 'Luxury Cars', action: () => { } },
  { id: 'group-charter', name: 'Group Charter', action: () => { } },
  { id: 'concierge', name: 'Concierge', action: () => { } },
  { id: 'co2-certificate', name: 'CO₂ Certificate', action: () => { } },
  { id: 'nft-membership', name: 'NFT Membership', action: () => window.open('https://opensea.io/collection/privatecharterx-membership-card', '_blank') },
];

// Aviation-focused services for flight details page
const aviationServices = [
  { id: 'catering', name: 'Catering', icon: Utensils, desc: 'Gourmet in-flight dining. Hot catering available for light jets and above.' },
  { id: 'flowers', name: 'Flower Arrangements', icon: Flower, desc: 'Premium bouquets' },
  { id: 'wine', name: 'Wine & Spirits', icon: Wine, desc: 'Curated wine selection' },
  { id: 'medical', name: 'Medical Assistance', icon: Stethoscope, desc: 'Medical support' },
  { id: 'transport-assist', name: 'Transport Assistance', icon: UserCheck, desc: 'Special transport help' },
  { id: 'accessibility', name: 'Accessibility Services', icon: Accessibility, desc: 'Mobility assistance' },
  { id: 'pet-care', name: 'Pet Care', icon: Dog, desc: 'Professional pet care' },
];

// Luxury lifestyle services for services page with emojis as images
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

// Jet categories - sorted by size with realistic market pricing
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
    imageLink: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/cessna-550-bravo.png',
    examples: ['Cessna Citation CJ2/CJ3', 'Embraer Phenom 300', 'Hawker 400XP']
  },
  {
    id: 'midsize',
    name: 'Mid-Size Jet',
    description: 'Spacious comfort',
    capacity: 8,
    range: 3500,
    speed: 800,
    pricePerHour: 8800,
    co2PerHour: 1.8,
    co2OffsetPerHour: 144,
    imageLink: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/Thumb-beechjet.png',
    examples: ['Cessna Citation XLS+', 'Hawker 800XP', 'Learjet 60XR']
  },
  {
    id: 'super-mid',
    name: 'Super Mid-Size',
    description: 'Enhanced luxury',
    capacity: 10,
    range: 4500,
    speed: 850,
    pricePerHour: 11000,
    co2PerHour: 2.2,
    co2OffsetPerHour: 176,
    imageLink: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/cxplus-360-8.png',
    examples: ['Cessna Citation Sovereign+', 'Embraer Praetor 500', 'Bombardier Challenger 350']
  },
  {
    id: 'heavy',
    name: 'Heavy Jet',
    description: 'Ultimate comfort',
    capacity: 14,
    range: 6000,
    speed: 900,
    pricePerHour: 14000,
    co2PerHour: 3.1,
    co2OffsetPerHour: 248,
    imageLink: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/24396-Dassault%20Falcon%202000LXS.jpg',
    examples: ['Gulfstream G550/G650', 'Bombardier Global 5000/6000', 'Dassault Falcon 8X']
  },
  {
    id: 'long-haul',
    name: 'Long Haul Jet',
    description: 'Intercontinental range',
    capacity: 16,
    range: 12000,
    speed: 950,
    pricePerHour: 16800,
    co2PerHour: 4.5,
    co2OffsetPerHour: 360,
    imageLink: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/G280-Specs-Aircraft-Gold.png',
    examples: ['Gulfstream G700/G800', 'Bombardier Global 7500/8000', 'Dassault Falcon 10X']
  },
  {
    id: 'business-airliner',
    name: 'Business Airliner',
    description: 'VIP airliners',
    capacity: 25,
    range: 12000,
    speed: 900,
    pricePerHour: 19500,
    co2PerHour: 6.0,
    co2OffsetPerHour: 480,
    imageLink: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/Embraer%20Legacy%201000.jpg',
    examples: ['Airbus ACJ319/320', 'Boeing BBJ737', 'Embraer Lineage 1000'],
    priceOnRequest: true
  }
];

// Helicopter categories - Commercial charter helicopters with realistic specifications
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

const paymentMethods = [
  { id: 'bank', name: 'Bank Transfer', icon: Building2, fee: 0 },
  { id: 'card', name: 'Credit Card', icon: CreditCard, fee: 2.9 },
  { id: 'crypto', name: 'Cryptocurrency', icon: Bitcoin, fee: 1.5 }
];

// Partner Logo Carousel Component - removed

// Calendar Component
interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

const CalendarComponent = ({ selectedDate, onDateSelect }: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dates = [];
  let day = startDate;
  while (day <= endDate) {
    dates.push(new Date(day));
    day = addDays(day, 1);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="font-medium text-gray-900">
          {formatDate(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth((prev: Date) => addMonths(prev, -1))}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ChevronLeft size={16} className="text-gray-400" />
          </button>
          <button
            onClick={() => setCurrentMonth((prev: Date) => addMonths(prev, 1))}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {dates.map(date => {
            const isSelected = selectedDate && isSameDay(selectedDate, date);
            const isToday = isSameDay(today, date);
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isPast = !isAfter(date, today) && !isToday;

            return (
              <button
                key={date.toISOString()}
                onClick={() => !isPast && isCurrentMonth && onDateSelect(date)}
                disabled={isPast || !isCurrentMonth}
                className={`
                  p-2 rounded-lg text-sm transition-all
                  ${isSelected ? 'bg-black text-white' : ''}
                  ${!isSelected && isToday ? 'bg-gray-100 font-medium' : ''}
                  ${!isSelected && !isToday && isCurrentMonth && !isPast ? 'hover:bg-gray-50' : ''}
                  ${!isCurrentMonth || isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                  ${isCurrentMonth && !isPast && !isSelected ? 'text-gray-700' : ''}
                `}
              >
                {formatDate(date, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function UnifiedBookingFlow() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRouteSlider, setShowRouteSlider] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [activeTab, setActiveTab] = useState('custom');
  const [selectedAviationServices, setSelectedAviationServices] = useState<string[]>([]);
  const [selectedLuxuryServices, setSelectedLuxuryServices] = useState<string[]>([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [nftBenefits, setNftBenefits] = useState<string[]>([]);
  const [showSameAirportPopup, setShowSameAirportPopup] = useState(false);
  const [showLoginRequired, setShowLoginRequired] = useState(false);
  const aviationServiceSliderRef = useRef<HTMLDivElement>(null);
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { isAuthenticated, user } = useAuth();

  // Check URL parameters on component mount to pre-select service type
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');
    if (serviceParam === 'helicopter') {
      setSelectedVehicleType('helicopter');
    }
  }, []);

  // Flight Details State
  const [originInput, setOriginInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [origin, setOrigin] = useState<AirportSearchResult | null>(null);
  const [destination, setDestination] = useState<AirportSearchResult | null>(null);
  const [stops, setStops] = useState<AirportSearchResult[]>([]);
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

  const [showStopsDropdown, setShowStopsDropdown] = useState(false);
  const [stopInput, setStopInput] = useState('');
  const [stopAirports, setStopAirports] = useState<AirportSearchResult[]>([]);
  const [isLoadingStopAirports, setIsLoadingStopAirports] = useState(false);

  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Other states
  const [selectedJet, setSelectedJet] = useState<typeof jetCategories[0] | null>(null);
  const [selectedHelicopter, setSelectedHelicopter] = useState<typeof helicopterCategories[0] | null>(null);
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

  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
      loadNftData(address);
    } else {
      setDiscountPercent(0);
      setNftBenefits([]);
    }
  }, [isConnected, address]);

  const loadNftData = async (addr: string) => {
    try {
      const eligibility = await web3Service.checkDiscountEligibility(addr);
      setDiscountPercent(eligibility.discountPercent);
      setNftBenefits(eligibility.benefits || []);
    } catch (error) {
      console.error('Failed to load NFT data:', error);
      setDiscountPercent(0);
      setNftBenefits([]);
    }
  };

  // Airport search functions
  const searchOriginAirports = async (query: string) => {
    setIsLoadingOriginAirports(true);
    try {
      const results = await airportsService.searchAirports(query);
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
      const results = await airportsService.searchAirports(query);
      setDestAirports(results);
    } catch (error) {
      console.error('Error searching destination airports:', error);
      setDestAirports([]);
    } finally {
      setIsLoadingDestAirports(false);
    }
  };

  const searchStopAirports = async (query: string) => {
    setIsLoadingStopAirports(true);
    try {
      const results = await airportsService.searchAirports(query);
      setStopAirports(results);
    } catch (error) {
      console.error('Error searching stop airports:', error);
      setStopAirports([]);
    } finally {
      setIsLoadingStopAirports(false);
    }
  };

  const addStop = (airport: AirportSearchResult) => {
    setStops([...stops, airport]);
    setStopInput('');
    setShowStopsDropdown(false);
  };

  const calculateDistance = () => {
    if (!origin || !destination) return 0;
    const R = 6371;
    const dLat = (destination.lat - origin.lat) * Math.PI / 180;
    const dLon = (destination.lng - origin.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate flight hours and pricing based on selected vehicle
  const selectedAircraft = selectedVehicleType === 'helicopter' ? selectedHelicopter : selectedJet;

  const handleBookingSubmission = async () => {
    // Check authentication first
    if (!isAuthenticated || !user) {
      setShowLoginRequired(true);
      return;
    }
    setIsSubmittingBooking(true);
    setBookingError(null);
    try {
      // Prepare booking data from component state
      const bookingData: BookingFormData = {
        origin,
        destination,
        departureDate,
        departureTime,
        passengers,
        luggage,
        pets,
        selectedJet: selectedAircraft,
        selectedAviationServices,
        selectedLuxuryServices,
        carbonOption,
        walletAddress,
        selectedPayment,
        contact,
        totalPrice,
        discountPercent
      };
      // Validate data
      const validation = bookingService.validateBookingData(bookingData);
      if (!validation.isValid) {
        setBookingError(validation.errors.join(', '));
        return;
      }
      // Submit booking request
      const { data, error } = await bookingService.createBookingRequest(bookingData);
      if (error) {
        setBookingError('Failed to submit booking request. Please try again.');
        console.error('Booking submission error:', error);
        return;
      }
      console.log('Booking request submitted successfully:', data);
      setIsComplete(true);
    } catch (error) {
      setBookingError('An unexpected error occurred. Please try again.');
      console.error('Booking submission error:', error);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const distance = calculateDistance();

  // Calculate flight hours and pricing based on selected vehicle
  const flightHours = selectedAircraft ? Math.max(1, distance / selectedAircraft.speed) : 0;
  const basePrice = selectedAircraft ? Math.round(flightHours * selectedAircraft.pricePerHour) : 0;
  const discountedBase = Math.round(basePrice * (1 - discountPercent / 100));
  const carbonFee = carbonOption === 'full' && selectedAircraft ? Math.round(flightHours * selectedAircraft.co2OffsetPerHour) : 0;
  const paymentMethod = paymentMethods.find(p => p.id === selectedPayment);
  const paymentFee = Math.round((discountedBase + carbonFee) * (paymentMethod?.fee || 0) / 100);
  const totalPrice = discountedBase + carbonFee + paymentFee;

  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleLocationSelect = (airport: AirportSearchResult, type: 'origin' | 'destination') => {
    const displayName = airport.name;
    // Check for same airport selection - only block for private jet, allow for helicopter
    if (selectedVehicleType === 'private-jet') {
      if (type === 'origin' && destination && airport.code === destination.code) {
        setShowSameAirportPopup(true);
        return;
      }
      if (type === 'destination' && origin && airport.code === origin.code) {
        setShowSameAirportPopup(true);
        return;
      }
    }
    if (type === 'origin') {
      setOriginInput(displayName);
      setOrigin(airport);
      setShowOriginDropdown(false);
    } else {
      setDestInput(displayName);
      setDestination(airport);
      setShowDestDropdown(false);
    }
  };

  const handleVehicleTypeSelect = (type: 'private-jet' | 'helicopter') => {
    setSelectedVehicleType(type);
    // Reset selected aircraft when switching types
    setSelectedJet(null);
    setSelectedHelicopter(null);
  };

  const handlePopularRouteSelect = async (route: any) => {
    try {
      // Parse route codes (e.g., "ZRH-NCE" -> ["ZRH", "NCE"])
      const [originCode, destCode] = route.route.split('-');

      // Get airport details by code
      const originAirport = await airportsService.getAirportByCode(originCode);
      const destAirport = await airportsService.getAirportByCode(destCode);

      if (originAirport && destAirport) {
        // Set airports and input values
        setOrigin(originAirport);
        setDestination(destAirport);
        setOriginInput(originAirport.name);
        setDestInput(destAirport.name);
      }
    } catch (error) {
      console.error('Error loading popular route:', error);
    }
  };

  const scrollServices = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 300;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return origin && destination && departureDate && departureTime; // Flight Details step
      case 1: return selectedVehicleType === 'helicopter' ? selectedHelicopter : selectedJet; // Aircraft step
      case 2: return true; // Services are optional
      case 3: return contact.name && contact.email && contact.phone; // Carbon step requires contact
      case 4: return true; // Summary step
      default: return false;
    }
  };

  // Determine if a step is available to navigate to
  const getStepAvailability = (stepIndex: number) => {
    // Always allow going back to completed steps
    if (stepIndex < currentStep) return true;
    // Current step is always available
    if (stepIndex === currentStep) return true;
    // Future steps are only available if all previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      switch (i) {
        case 0:
          if (!origin || !destination || !departureDate || !departureTime) return false;
          break;
        case 1:
          if (!(selectedVehicleType === 'helicopter' ? selectedHelicopter : selectedJet)) return false;
          break;
        case 2:
          // Services are optional, always allow
          break;
        case 3:
          if (!contact.name || !contact.email || !contact.phone) return false;
          break;
      }
    }
    return true;
  };

  // Check if flight exceeds helicopter max flight time
  const exceedsHelicopterMaxTime = () => {
    if (selectedVehicleType !== 'helicopter' || !selectedHelicopter) return false;
    const flightTimeMinutes = flightHours * 60;
    return flightTimeMinutes > selectedHelicopter.maxFlightTime;
  };

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.airport-dropdown')) {
        setShowOriginDropdown(false);
        setShowDestDropdown(false);
        setShowStopsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Render current step content
  const renderCurrentStep = () => {
    const stepContent = (() => {
      switch (currentStep) {
        case 0: // Flight Details (combines route and details)
          return (
            <FlightDetailsStep
              origin={origin}
              destination={destination}
              stops={stops}
              selectedVehicleType={selectedVehicleType}
              distance={distance}
              showStopsDropdown={showStopsDropdown}
              setShowStopsDropdown={setShowStopsDropdown}
              stopInput={stopInput}
              setStopInput={setStopInput}
              stopAirports={stopAirports}
              isLoadingStopAirports={isLoadingStopAirports}
              searchStopAirports={searchStopAirports}
              addStop={addStop}
              setStops={setStops}
              formatPrice={formatPrice}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              popularRoutes={[]}
              setDepartureDate={setDepartureDate}
              CalendarComponent={CalendarComponent}
              departureDate={departureDate}
              departureTime={departureTime}
              setDepartureTime={setDepartureTime}
              passengers={passengers}
              setPassengers={setPassengers}
              luggage={luggage}
              setLuggage={setLuggage}
              pets={pets}
              setPets={setPets}
              selectedAviationServices={selectedAviationServices}
              setSelectedAviationServices={setSelectedAviationServices}
              aviationServices={aviationServices}
              aviationServiceSliderRef={aviationServiceSliderRef}
              scrollServices={scrollServices}
            />
          );

        case 1: // Aircraft Selection - Just filter categories but don't block
          return (
            <AircraftSelectionStep
              distance={distance}
              selectedVehicleType={selectedVehicleType}
              passengers={passengers}
              jetCategories={jetCategories.filter(jet => {
                // More than 2 stops: Show only Midsize, Heavy, Long Haul, and Business Airliner
                if (stops.length > 2) {
                  return ['midsize', 'heavy', 'long-haul', 'business-airliner'].includes(jet.id);
                }
                // Long distance or 2+ stops: Hide very light and light jets
                if (distance > 3000 || stops.length >= 2) {
                  return !['very-light', 'light'].includes(jet.id);
                }
                return true;
              })}
              helicopterCategories={helicopterCategories}
              selectedJet={selectedJet}
              selectedHelicopter={selectedHelicopter}
              setSelectedJet={setSelectedJet}
              setSelectedHelicopter={setSelectedHelicopter}
              setSelectedVehicleType={setSelectedVehicleType}
              formatPrice={formatPrice}
            />
          );

        case 2: // Services
          return (
            <ServicesStep
              luxuryServices={luxuryServices}
              selectedLuxuryServices={selectedLuxuryServices}
              setSelectedLuxuryServices={setSelectedLuxuryServices}
            />
          );

        case 3: // Carbon Offset
          return (
            <CarbonOffsetStep
              carbonOption={carbonOption}
              setCarbonOption={setCarbonOption}
              selectedAircraft={selectedAircraft}
              flightHours={flightHours}
              formatPrice={formatPrice}
              isConnected={isConnected}
              address={address}
              walletAddress={walletAddress}
              setWalletAddress={setWalletAddress}
              connect={connect}
              connectors={[...connectors]}
              paymentMethods={paymentMethods}
              selectedPayment={selectedPayment}
              setSelectedPayment={setSelectedPayment}
              contact={contact}
              setContact={setContact}
            />
          );

        case 4: // Booking Summary
          return (
            <div className="space-y-6">
              <BookingSummaryStep
                origin={origin}
                destination={destination}
                stops={stops}
                departureDate={departureDate}
                departureTime={departureTime}
                passengers={passengers}
                luggage={luggage}
                pets={pets}
                selectedVehicleType={selectedVehicleType}
                selectedAircraft={selectedAircraft}
                formatDate={formatDate}
                selectedAviationServices={selectedAviationServices}
                selectedLuxuryServices={selectedLuxuryServices}
                aviationServices={aviationServices}
                luxuryServices={luxuryServices}
                discountPercent={discountPercent}
                nftBenefits={nftBenefits}
                basePrice={basePrice}
                discountedBase={discountedBase}
                carbonFee={carbonFee}
                paymentFee={paymentFee}
                totalPrice={totalPrice}
                formatPrice={formatPrice}
                carbonOption={carbonOption}
                flightHours={flightHours}
                walletAddress={walletAddress}
              />

              {/* Pricing Disclaimer */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-medium text-gray-900 mb-4">Pricing Disclaimer</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Variable Hourly Rates Include:</h4>
                    <ul className="space-y-1">
                      <li className="flex items-start">
                        <span className="mr-2">✔</span>
                        <span>Fuel costs (jet fuel consumption based on aircraft type)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✔</span>
                        <span>Crew expenses (pilot fees per flight hour)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✔</span>
                        <span>Maintenance reserves (scheduled inspections and wear)</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Notes:</h4>
                    <ul className="space-y-1">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Final pricing depends on route, fuel prices, and operational requirements.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Fixed fees (landing/handling) are calculated per flight.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>All prices are subject to availability and market fluctuations.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Price may increase due to multi-stop flights.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );

        default:
          return <div>Invalid step</div>;
      }
    })();

    // Show BookingProgress above all steps except the first one
    if (currentStep > 0) {
      return (
        <div className="space-y-6">
          <BookingProgress
            origin={origin}
            destination={destination}
            stops={stops}
            distance={distance}
            departureDate={departureDate}
            departureTime={departureTime}
            selectedVehicleType={selectedVehicleType}
            selectedAircraft={selectedAircraft}
            formatDate={formatDate}
            steps={steps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            getStepAvailability={getStepAvailability}
          />
          {stepContent}
        </div>
      );
    }

    return stepContent;
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white rounded-3xl p-8 shadow-sm">
          <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-light text-black mb-3">Request Sent Successfully</h1>
          <p className="text-gray-500 mb-8">
            Your charter inquiry has been submitted. We'll contact you shortly at {contact.email || 'your email'} with availability and final pricing.
          </p>
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Route</span>
                <span className="font-medium text-gray-900">
                  {origin?.code}
                  {stops.map(stop => ` → ${stop.code}`).join('')}
                  {` → ${destination?.code}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vehicle</span>
                <span className="font-medium text-gray-900">{selectedAircraft?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-900">{departureDate && formatDate(departureDate, 'MMM d, yyyy')}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Estimated Total</span>
                  <span className="text-xl font-medium text-gray-900">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Book Another Flight
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        /* FORCE GREEN CO2 BUBBLES - HIGHEST PRIORITY */
        .co2-bubble,
        .co2-display,
        .carbon-offset,
        .co2-info,
        [class*="co2"],
        [class*="carbon"],
        [class*="CO2"],
        [class*="Carbon"] {
          background-color: #dcfce7 !important;
          color: #166534 !important;
          border: 1px solid #bbf7d0 !important;
        }
        
        /* Aircraft images - show on web, hide on mobile */
        .aircraft-image {
          width: 200px;
          height: 120px;
          object-fit: contain;
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 8px;
          display: none; /* Hidden by default */
        }
        
        /* Show aircraft images only on desktop/web */
        @media (min-width: 769px) {
          .aircraft-image {
            display: block !important;
          }
          .aircraft-emoji {
            display: none !important;
          }
        }
        
        /* Show emoji on mobile, hide images */
        @media (max-width: 768px) {
          .aircraft-image {
            display: none !important;
          }
          .aircraft-emoji {
            display: block !important;
          }
        }
        
        /* Aircraft examples bubble - mobile optimized */
        .aircraft-examples {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 8px 12px;
          margin-top: 8px;
          font-size: 0.75rem;
          color: #6c757d;
          line-height: 1.4;
        }
        
        @media (max-width: 768px) {
          .aircraft-examples {
            font-size: 0.7rem;
            padding: 6px 10px;
            margin-top: 6px;
          }
        }
      `}</style>

      <div className="bg-gray-50">
        {/* Initial Search Bar */}
        {!isModalOpen && (
          <div className="flex items-start justify-center p-4">
            <div className="w-full max-w-5xl">
              {/* Removed hero title and description for a tighter fit */}

              {/* Service Categories Carousel */}
              <div className="mb-6">
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setSelectedVehicleType('private-jet')}
                    className={`px-4 py-2 text-sm rounded-full transition-colors whitespace-nowrap ${selectedVehicleType === 'private-jet' ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                  >
                    Private Jet Charter
                  </button>
                  <button
                    onClick={() => setSelectedVehicleType('helicopter')}
                    className={`px-4 py-2 text-sm rounded-full transition-colors whitespace-nowrap ${selectedVehicleType === 'helicopter' ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                  >
                    Helicopter Charter
                  </button>
                </div>
              </div>

              {/* Search Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 max-w-2xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative airport-dropdown">
                    <div className="relative">
                      <input
                        type="text"
                        value={originInput}
                        onChange={(e) => {
                          setOriginInput(e.target.value);
                          setShowOriginDropdown(true);
                          searchOriginAirports(e.target.value);
                          // Clear selected airport if input doesn't match
                          if (origin && e.target.value !== origin.name) {
                            setOrigin(null);
                          }
                        }}
                        onFocus={() => {
                          setShowOriginDropdown(true);
                          if (originInput.length === 0) {
                            searchOriginAirports('');
                          } else {
                            searchOriginAirports(originInput);
                          }
                        }}
                        onBlur={() => {
                          // Restore full name if input is empty and airport was selected
                          if (origin && originInput === '') {
                            setOriginInput(origin.name);
                          }
                          setTimeout(() => setShowOriginDropdown(false), 150);
                        }}
                        placeholder="From"
                        className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none focus:bg-white transition-all ${origin && !showOriginDropdown ? 'pr-16' : ''}`}
                      />
                      {origin && !showOriginDropdown && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                          {origin.code}
                          <button
                            onClick={() => {
                              setOriginInput('');
                              setOrigin(null);
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                    {showOriginDropdown && (
                      <div className="absolute bottom-full mb-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto z-10">
                        {isLoadingOriginAirports ? (
                          <div className="px-4 py-3 text-center text-gray-500">Searching...</div>
                        ) : originAirports.length > 0 ? (
                          originAirports.map(airport => (
                            <button
                              key={airport.code}
                              onClick={() => handleLocationSelect(airport, 'origin')}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0"
                            >
                              <div className="font-medium text-gray-900">{airport.name}</div>
                              <div className="text-xs text-gray-400">{airport.code} • {airport.city}{airport.state ? `, ${airport.state}` : ''}, {airport.country}</div>
                            </button>
                          ))
                        ) : originInput.length >= 2 && (
                          <div className="px-4 py-3 text-center text-gray-500">No airports found</div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      // Swap origin and destination
                      const tempOrigin = origin;
                      const tempOriginInput = originInput;
                      setOrigin(destination);
                      setDestination(tempOrigin);
                      setOriginInput(destInput);
                      setDestInput(tempOriginInput);
                    }}
                    className="p-3 hover:bg-gray-50 rounded-xl transition-colors hidden md:block"
                  >
                    <ArrowUpDown size={18} className="text-gray-400" />
                  </button>

                  <div className="flex-1 relative airport-dropdown">
                    <div className="relative">
                      <input
                        type="text"
                        value={destInput}
                        onChange={(e) => {
                          setDestInput(e.target.value);
                          setShowDestDropdown(true);
                          searchDestAirports(e.target.value);
                          // Clear selected airport if input doesn't match
                          if (destination && e.target.value !== destination.name) {
                            setDestination(null);
                          }
                        }}
                        onFocus={() => {
                          setShowDestDropdown(true);
                          if (destInput.length === 0) {
                            searchDestAirports('');
                          } else {
                            searchDestAirports(destInput);
                          }
                        }}
                        onBlur={() => {
                          // Restore full name if input is empty and airport was selected
                          if (destination && destInput === '') {
                            setDestInput(destination.name);
                          }
                          setTimeout(() => setShowDestDropdown(false), 150);
                        }}
                        placeholder="To"
                        className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none focus:bg-white transition-all ${destination && !showDestDropdown ? 'pr-16' : ''}`}
                      />
                      {destination && !showDestDropdown && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                          {destination.code}
                          <button
                            onClick={() => {
                              setDestInput('');
                              setDestination(null);
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                    {showDestDropdown && (
                      <div className="absolute bottom-full mb-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto z-10">
                        {isLoadingDestAirports ? (
                          <div className="px-4 py-3 text-center text-gray-500">Searching...</div>
                        ) : destAirports.length > 0 ? (
                          destAirports.map(airport => (
                            <button
                              key={airport.code}
                              onClick={() => handleLocationSelect(airport, 'destination')}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0"
                            >
                              <div className="font-medium text-gray-900">{airport.name}</div>
                              <div className="text-xs text-gray-400">{airport.code} • {airport.city}{airport.state ? `, ${airport.state}` : ''}, {airport.country}</div>
                            </button>
                          ))
                        ) : destInput.length >= 2 && (
                          <div className="px-4 py-3 text-center text-gray-500">No airports found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Continue Button */}
                {origin && destination && (
                  <div className="mt-8">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="w-full bg-black text-white py-3 px-6 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      Continue to Route Details
                      <ArrowRight size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Partner Logo Carousel removed */}
            </div>
          </div>
        )}

        {/* Booking Flow */}
        {isModalOpen && (
          <div className="py-8">
            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 md:px-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Content container with smooth transitions */}
                <div className="p-6 md:p-8">
                  <div className="transition-all duration-500 ease-in-out">
                    {renderCurrentStep()}
                  </div>

                  {/* Error Display */}
                  {bookingError && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="text-sm text-red-800">{bookingError}</div>
                    </div>
                  )}
                </div>

                {/* Navigation - Fixed at bottom of card */}
                <div className="bg-gray-50 border-t border-gray-100 p-6 md:p-8">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : setIsModalOpen(false)}
                      className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 text-gray-600 hover:text-gray-900 transition-colors rounded-xl hover:bg-white"
                    >
                      <ChevronLeft size={18} />
                      <span className="hidden md:inline">Back</span>
                    </button>

                    {currentStep < steps.length - 1 ? (
                      <button
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={!canProceed()}
                        className={`flex items-center gap-2 px-6 md:px-8 py-2 md:py-3 rounded-xl font-medium transition-all ${canProceed()
                          ? 'bg-black text-white hover:bg-gray-800'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                      >
                        Continue
                        <ArrowRight size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={handleBookingSubmission}
                        disabled={!canProceed() || isSubmittingBooking}
                        className={`flex items-center gap-2 px-6 md:px-8 py-2 md:py-3 rounded-xl font-medium transition-all ${canProceed() && !isSubmittingBooking
                          ? 'bg-black text-white hover:bg-gray-800'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                      >
                        {isSubmittingBooking ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="hidden md:inline">Submitting...</span>
                            <span className="md:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden md:inline">Confirm Booking</span>
                            <span className="md:hidden">Confirm</span>
                            <Check size={18} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom spacing */}
            <div className="h-16"></div>
          </div>
        )}
        {/* Same Airport Warning Popup */}
        {showSameAirportPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Same Airport Selected</h3>
                <p className="text-gray-600">
                  You cannot select the same airport for origin and destination. Please choose a different destination airport or swap to helicopter request instead.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSameAirportPopup(false);
                    setSelectedVehicleType('helicopter');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Switch to Helicopter
                </button>
                <button
                  onClick={() => setShowSameAirportPopup(false)}
                  className="flex-1 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Choose Different Airport
                </button>
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
    </>
  );
}
