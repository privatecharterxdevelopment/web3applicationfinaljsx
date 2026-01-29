import React, { useState, useRef, useEffect } from 'react';
import {
  Plane, Users, MapPin, Search, ChevronRight, ChevronLeft, ArrowRight, ArrowLeft,
  Loader2, X, Check, Briefcase, PawPrint, Mail, Clock, Info, Car, Shield,
  Wifi, UtensilsCrossed, Armchair, Luggage, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { jetCategories, calculateTotalFlightTime, calculateTotalPrice, calculateRequiredStops } from '../data/jets';
import { calculateDistance } from './Landingpagenew/AIChat/utils/priceCalculator';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';

// Popular airports for autocomplete
const POPULAR_AIRPORTS = [
  { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'UK', lat: 51.4700, lng: -0.4543 },
  { code: 'JFK', name: 'John F. Kennedy', city: 'New York', country: 'USA', lat: 40.6413, lng: -73.7781 },
  { code: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'USA', lat: 33.9425, lng: -118.4081 },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France', lat: 49.0097, lng: 2.5479 },
  { code: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'UAE', lat: 25.2532, lng: 55.3657 },
  { code: 'SIN', name: 'Changi', city: 'Singapore', country: 'Singapore', lat: 1.3644, lng: 103.9915 },
  { code: 'HKG', name: 'Hong Kong Intl', city: 'Hong Kong', country: 'China', lat: 22.3080, lng: 113.9185 },
  { code: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lng: 8.5622 },
  { code: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lng: 4.7683 },
  { code: 'ZRH', name: 'Zurich', city: 'Zurich', country: 'Switzerland', lat: 47.4647, lng: 8.5492 },
  { code: 'GVA', name: 'Geneva', city: 'Geneva', country: 'Switzerland', lat: 46.2370, lng: 6.1092 },
  { code: 'MUC', name: 'Munich', city: 'Munich', country: 'Germany', lat: 48.3537, lng: 11.7750 },
  { code: 'BCN', name: 'Barcelona El Prat', city: 'Barcelona', country: 'Spain', lat: 41.2974, lng: 2.0833 },
  { code: 'MAD', name: 'Madrid Barajas', city: 'Madrid', country: 'Spain', lat: 40.4983, lng: -3.5676 },
  { code: 'FCO', name: 'Fiumicino', city: 'Rome', country: 'Italy', lat: 41.8003, lng: 12.2389 },
  { code: 'MXP', name: 'Malpensa', city: 'Milan', country: 'Italy', lat: 45.6306, lng: 8.7281 },
  { code: 'VIE', name: 'Vienna Intl', city: 'Vienna', country: 'Austria', lat: 48.1103, lng: 16.5697 },
  { code: 'IST', name: 'Istanbul', city: 'Istanbul', country: 'Turkey', lat: 41.2753, lng: 28.7519 },
  { code: 'ORD', name: "O'Hare", city: 'Chicago', country: 'USA', lat: 41.9742, lng: -87.9073 },
  { code: 'MIA', name: 'Miami Intl', city: 'Miami', country: 'USA', lat: 25.7959, lng: -80.2870 },
  { code: 'SFO', name: 'San Francisco', city: 'San Francisco', country: 'USA', lat: 37.6213, lng: -122.3790 },
  { code: 'NRT', name: 'Narita', city: 'Tokyo', country: 'Japan', lat: 35.7720, lng: 140.3929 },
  { code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thailand', lat: 13.6900, lng: 100.7501 },
  { code: 'DOH', name: 'Hamad Intl', city: 'Doha', country: 'Qatar', lat: 25.2731, lng: 51.6081 },
  { code: 'NCE', name: 'Nice Côte d\'Azur', city: 'Nice', country: 'France', lat: 43.6584, lng: 7.2159 },
  { code: 'IBZ', name: 'Ibiza', city: 'Ibiza', country: 'Spain', lat: 38.8729, lng: 1.3731 },
  { code: 'MYK', name: 'Mykonos', city: 'Mykonos', country: 'Greece', lat: 37.4351, lng: 25.3481 },
  { code: 'OLB', name: 'Costa Smeralda', city: 'Sardinia', country: 'Italy', lat: 40.8987, lng: 9.5176 },
];

// Category descriptions and details
const CATEGORY_INFO: Record<string, {
  description: string;
  idealFor: string[];
  features: string[];
  image: string;
  badges: { icon: 'seats' | 'catering' | 'wifi' | 'luggage' | 'lavatory'; label: string }[];
}> = {
  'Very Light Jet': {
    description: 'Very light jets (VLJs) are the most efficient option for short-haul flights. Compact yet comfortable, these aircraft are ideal for quick regional trips with smaller groups.',
    idealFor: ['Short regional flights (up to 2 hours)', 'City hopping', 'Small groups of 3-5 passengers', 'Budget-conscious travelers'],
    features: ['Seating for 4-5 passengers', 'Economical fuel consumption', 'Access to smaller airports', 'Modern avionics', 'Quick turnaround times'],
    image: 'https://auth.privatecharterx.com/storage/v1/object/sign/gb/Whisk_3d340ab606ec1168ba14d410daf13589eg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9XaGlza18zZDM0MGFiNjA2ZWMxMTY4YmExNGQ0MTBkYWYxMzU4OWVnLnBuZyIsImlhdCI6MTc2OTUxNjI4OSwiZXhwIjoyMjAwNzMzMzg4OX0.SYEgyJlza5h1YIOuv-RsuWgWcdgu5d8k66fNzK0kP_M',
    badges: [
      { icon: 'seats', label: '4-5 seats' },
      { icon: 'luggage', label: '4-6 bags' },
    ],
  },
  'Light Jet': {
    description: 'Light jets are perfect for short to medium-range trips, offering an efficient and cost-effective private aviation experience. Ideal for business executives and small groups seeking comfort without excess.',
    idealFor: ['Regional flights (up to 3 hours)', 'Business day trips', 'Small groups of 4-7 passengers', 'Cost-conscious travelers'],
    features: ['Comfortable seating for 5-9 passengers', 'Stand-up cabin on most models', 'Wi-Fi connectivity', 'Refreshment center', 'Enclosed lavatory'],
    image: 'https://auth.privatecharterx.com/storage/v1/object/sign/gb/Whisk_b4c91ab433866d595ea44910e70da6b5eg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9XaGlza19iNGM5MWFiNDMzODY2ZDU5NWVhNDQ5MTBlNzBkYTZiNWVnLnBuZyIsImlhdCI6MTc2OTUxNjIzOSwiZXhwIjoyMjAwNzMzMzgzOX0.vtn4i21XJEFhn6Gsj7a285DHWWg5z0OqCAos27HS9bk',
    badges: [
      { icon: 'seats', label: '5-9 seats' },
      { icon: 'luggage', label: '6-8 bags' },
      { icon: 'catering', label: 'Light catering' },
      { icon: 'wifi', label: 'Wi-Fi' },
    ],
  },
  'Super Midsize': {
    description: 'Super midsize jets bridge the gap between light jets and large cabin aircraft, offering enhanced range, speed, and cabin comfort. The perfect balance of performance and luxury.',
    idealFor: ['Transcontinental flights', 'Groups of 7-9 passengers', 'Flights requiring more luggage space', 'Longer meetings onboard'],
    features: ['Spacious stand-up cabin', 'Full refreshment galley', 'Enhanced entertainment systems', 'Lie-flat seating options', 'Extended baggage capacity'],
    image: 'https://auth.privatecharterx.com/storage/v1/object/sign/gb/Whisk_33494738b05b3fdbcf0491d0d295df1ceg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9XaGlza18zMzQ5NDczOGIwNWIzZmRiY2YwNDkxZDBkMjk1ZGYxY2VnLnBuZyIsImlhdCI6MTc2OTUxNTcwNiwiZXhwIjoyMDQxNDc4NjQ1MDZ9.Ex94DwBwuEgMc7k0qJeCkwOlrtVlXYXNh9naKdsgI-k',
    badges: [
      { icon: 'seats', label: '8-10 seats' },
      { icon: 'luggage', label: '10-12 bags' },
      { icon: 'catering', label: 'Full catering' },
      { icon: 'wifi', label: 'Wi-Fi' },
    ],
  },
  'Large Jet': {
    description: 'Large cabin jets represent the pinnacle of private aviation, offering intercontinental range with uncompromising luxury. Multiple cabin zones, full amenities, and bedroom configurations available.',
    idealFor: ['Intercontinental travel', 'Large groups up to 19 passengers', 'Ultra-long flights (10+ hours)', 'Maximum comfort requirements'],
    features: ['Multiple cabin zones', 'Full-size galley with catering', 'Bedroom & shower on select models', 'Conference/dining area', 'Entertainment suite'],
    image: 'https://auth.privatecharterx.com/storage/v1/object/sign/gb/Whisk_e3d9adf0d2f173fbf96497f7d7fab6bbeg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9XaGlza19lM2Q5YWRmMGQyZjE3M2ZiZjk2NDk3ZjdkN2ZhYjZiYmVnLnBuZyIsImlhdCI6MTc2OTUxNTcyOCwiZXhwIjoyMDI1NTUzMjYyOTI4fQ.TC1MDBAfWniu_zNroOJ68O_waO8Ad8xY7kDJp_wIXGo',
    badges: [
      { icon: 'seats', label: '12-19 seats' },
      { icon: 'luggage', label: '15+ bags' },
      { icon: 'catering', label: 'Gourmet catering' },
      { icon: 'wifi', label: 'Hi-speed Wi-Fi' },
    ],
  },
};

interface SearchParams {
  origin: string;
  originCoords: { lat: number; lng: number } | null;
  destination: string;
  destinationCoords: { lat: number; lng: number } | null;
  departureDate: string;
  returnDate: string;
  passengers: number;
  luggage: number;
  hasPet: boolean;
  journeyType: 'one-way' | 'return';
}

interface CategoryPricing {
  category: string;
  minPrice: number;
  maxPrice: number;
  minCapacity: number;
  maxCapacity: number;
  avgFlightHours: number;
  distance: number;
}

interface QuoteFormData {
  name: string;
  email: string;
  phone: string;
  departureTime: string;
  returnTime: string;
  pickupAddress: string;
  dropoffAddress: string;
  specialRequests: string;
}

export default function PrivateJetSearchDashboard({ onShowLoginModal }: { onShowLoginModal?: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Search state
  const [searchParams, setSearchParams] = useState<SearchParams>({
    origin: '',
    originCoords: null,
    destination: '',
    destinationCoords: null,
    departureDate: '',
    returnDate: '',
    passengers: 2,
    luggage: 2,
    hasPet: false,
    journeyType: 'one-way',
  });

  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [categoryPricing, setCategoryPricing] = useState<CategoryPricing[]>([]);
  const [calculatedDistance, setCalculatedDistance] = useState<number>(0);

  // Airport autocomplete
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const originRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);

  // Date picker
  const [showDepartureDatePicker, setShowDepartureDatePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [departureDateMonth, setDepartureDateMonth] = useState(new Date());
  const [returnDateMonth, setReturnDateMonth] = useState(new Date());
  const departureDateRef = useRef<HTMLDivElement>(null);
  const returnDateRef = useRef<HTMLDivElement>(null);

  // Detail view state
  const [selectedCategory, setSelectedCategory] = useState<CategoryPricing | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [quoteForm, setQuoteForm] = useState<QuoteFormData>({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    departureTime: '09:00',
    returnTime: '18:00',
    pickupAddress: '',
    dropoffAddress: '',
    specialRequests: '',
  });
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);

  // Pending request (saved during login)
  const [pendingRequest, setPendingRequest] = useState<any>(null);

  // Load pending request from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pendingJetQuote');
    if (saved && user) {
      const parsed = JSON.parse(saved);
      setPendingRequest(parsed);
      // Auto-submit if user just logged in
      if (parsed && user) {
        localStorage.removeItem('pendingJetQuote');
        // Restore form data
        setSearchParams(parsed.searchParams);
        setSelectedCategory(parsed.category);
        setQuoteForm(parsed.quoteForm);
        setShowDetailView(true);
        setHasSearched(true);
        setCategoryPricing(parsed.categoryPricing || []);
        setCalculatedDistance(parsed.distance || 0);
      }
    }
  }, [user]);

  // Update form when user logs in
  useEffect(() => {
    if (user) {
      setQuoteForm(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setShowOriginDropdown(false);
      }
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        setShowDestinationDropdown(false);
      }
      if (departureDateRef.current && !departureDateRef.current.contains(event.target as Node)) {
        setShowDepartureDatePicker(false);
      }
      if (returnDateRef.current && !returnDateRef.current.contains(event.target as Node)) {
        setShowReturnDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter airports based on search input
  const getFilteredAirports = (query: string) => {
    if (!query) return POPULAR_AIRPORTS.slice(0, 8);
    const lowerQuery = query.toLowerCase();
    return POPULAR_AIRPORTS.filter(
      airport =>
        airport.code.toLowerCase().includes(lowerQuery) ||
        airport.name.toLowerCase().includes(lowerQuery) ||
        airport.city.toLowerCase().includes(lowerQuery) ||
        airport.country.toLowerCase().includes(lowerQuery)
    ).slice(0, 8);
  };

  const handleAirportSelect = (airport: typeof POPULAR_AIRPORTS[0], field: 'origin' | 'destination') => {
    if (field === 'origin') {
      setSearchParams(prev => ({
        ...prev,
        origin: airport.code,
        originCoords: { lat: airport.lat, lng: airport.lng }
      }));
      setShowOriginDropdown(false);
    } else {
      setSearchParams(prev => ({
        ...prev,
        destination: airport.code,
        destinationCoords: { lat: airport.lat, lng: airport.lng }
      }));
      setShowDestinationDropdown(false);
    }
  };

  const findAirport = (input: string) => {
    const lowerInput = input.toLowerCase().trim();
    return POPULAR_AIRPORTS.find(
      a => a.code.toLowerCase() === lowerInput ||
           a.city.toLowerCase() === lowerInput ||
           a.name.toLowerCase() === lowerInput
    );
  };

  // Calculate prices for categories based on route
  const calculateCategoryPrices = () => {
    if (!searchParams.originCoords || !searchParams.destinationCoords) {
      setSearchError('Please select airports from the dropdown');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const distance = calculateDistance(searchParams.originCoords, searchParams.destinationCoords);
    setCalculatedDistance(Math.round(distance));

    // Group jets by category and calculate pricing
    const categories: Record<string, { jets: any[], prices: number[], capacities: number[], flightHours: number[] }> = {};

    jetCategories.forEach(jet => {
      if (!categories[jet.category]) {
        categories[jet.category] = { jets: [], prices: [], capacities: [], flightHours: [] };
      }

      const stops = calculateRequiredStops(distance, jet.range);
      const flightHours = calculateTotalFlightTime(distance, jet.speed, stops);
      let estimatedPrice = calculateTotalPrice(distance, jet.speed, jet.pricePerHour, stops);

      if (searchParams.journeyType === 'return') {
        estimatedPrice *= 2;
      }

      categories[jet.category].jets.push(jet);
      categories[jet.category].prices.push(estimatedPrice);
      categories[jet.category].capacities.push(jet.capacity);
      categories[jet.category].flightHours.push(flightHours);
    });

    // Filter out Very Light Jet if distance requires fuel stops for VLJs
    // VLJs have a max range of ~1,700-2,100 km, so only show if distance fits
    const MIN_VLJ_RANGE = 1693; // Eclipse 550 has the shortest range
    const showVeryLightJet = distance <= MIN_VLJ_RANGE;

    const categoryPricingData: CategoryPricing[] = Object.entries(categories)
      .filter(([category]) => {
        // Only include Very Light Jet if no fuel stops needed
        if (category === 'Very Light Jet' && !showVeryLightJet) {
          return false;
        }
        return true;
      })
      .map(([category, data]) => ({
        category,
        minPrice: Math.min(...data.prices),
        maxPrice: Math.max(...data.prices),
        minCapacity: Math.min(...data.capacities),
        maxCapacity: Math.max(...data.capacities),
        avgFlightHours: Math.round((data.flightHours.reduce((a, b) => a + b, 0) / data.flightHours.length) * 10) / 10,
        distance: Math.round(distance),
      }));

    // Sort by price
    categoryPricingData.sort((a, b) => a.minPrice - b.minPrice);

    // Add a minimum delay for smooth loading animation
    setTimeout(() => {
      setCategoryPricing(categoryPricingData);
      setHasSearched(true);
      setIsSearching(false);
    }, 800);
  };

  const handleSearch = () => {
    if (!searchParams.origin || !searchParams.destination) {
      setSearchError('Please enter origin and destination');
      return;
    }

    if (!searchParams.departureDate) {
      setSearchError('Please select a departure date');
      return;
    }

    // Try to find airports if coords not set
    if (!searchParams.originCoords) {
      const airport = findAirport(searchParams.origin);
      if (airport) {
        setSearchParams(prev => ({
          ...prev,
          origin: airport.code,
          originCoords: { lat: airport.lat, lng: airport.lng }
        }));
      } else {
        setSearchError('Please select an origin airport from the dropdown');
        return;
      }
    }

    if (!searchParams.destinationCoords) {
      const airport = findAirport(searchParams.destination);
      if (airport) {
        setSearchParams(prev => ({
          ...prev,
          destination: airport.code,
          destinationCoords: { lat: airport.lat, lng: airport.lng }
        }));
      } else {
        setSearchError('Please select a destination airport from the dropdown');
        return;
      }
    }

    calculateCategoryPrices();
  };

  // Handle "Get a Quote" click
  const handleGetQuote = (category: CategoryPricing) => {
    setSelectedCategory(category);
    setShowDetailView(true);
  };

  // Save request to localStorage and prompt login
  const saveRequestAndLogin = () => {
    const requestData = {
      searchParams,
      category: selectedCategory,
      quoteForm,
      categoryPricing,
      distance: calculatedDistance,
      timestamp: Date.now(),
    };
    localStorage.setItem('pendingJetQuote', JSON.stringify(requestData));

    if (onShowLoginModal) {
      onShowLoginModal();
    } else {
      navigate('/login?redirect=/jets');
    }
  };

  // Submit quote request
  const handleSubmitQuote = async () => {
    if (!selectedCategory) return;

    // Check if logged in
    if (!user) {
      saveRequestAndLogin();
      return;
    }

    if (!quoteForm.email || !quoteForm.name) {
      alert('Please fill in your name and email');
      return;
    }

    setIsSubmittingQuote(true);

    try {
      const requestData = {
        user_id: user.id,
        type: 'private_jet_charter',
        status: 'pending',
        client_email: quoteForm.email,
        data: {
          source: 'jets_page',
          // Route
          from_city: searchParams.origin,
          to_city: searchParams.destination,
          departure_date: searchParams.departureDate,
          departure_time: quoteForm.departureTime,
          return_date: searchParams.returnDate || null,
          return_time: quoteForm.returnTime || null,
          trip_type: searchParams.journeyType,
          distance_km: calculatedDistance,
          // Passengers & extras
          passengers: searchParams.passengers,
          luggage: searchParams.luggage,
          has_pet: searchParams.hasPet,
          // Aircraft category
          aircraft_category: selectedCategory.category,
          capacity_range: `${selectedCategory.minCapacity}-${selectedCategory.maxCapacity}`,
          estimated_flight_hours: selectedCategory.avgFlightHours,
          // Pricing
          price_range_min: selectedCategory.minPrice,
          price_range_max: selectedCategory.maxPrice,
          currency: 'USD',
          // Ground transport (included)
          ground_transport_included: true,
          pickup_address: quoteForm.pickupAddress || null,
          dropoff_address: quoteForm.dropoffAddress || null,
          // Contact
          client_name: quoteForm.name,
          client_phone: quoteForm.phone,
          special_requests: quoteForm.specialRequests,
          // Meta
          request_date: new Date().toISOString(),
        }
      };

      const { data: insertedRequest, error: dbError } = await supabase
        .from('user_requests')
        .insert([requestData])
        .select()
        .single();

      if (dbError) throw dbError;

      // Clear any saved pending request
      localStorage.removeItem('pendingJetQuote');

      // Send email notification
      try {
        await supabase.functions.invoke('send-request-email', {
          body: {
            to: quoteForm.email,
            cc: 'bookings@privatecharterx.com',
            requestData: {
              id: insertedRequest.id,
              type: 'private_jet_charter',
              category: selectedCategory.category,
              from: searchParams.origin,
              to: searchParams.destination,
              date: searchParams.departureDate,
              time: quoteForm.departureTime,
              passengers: searchParams.passengers,
              luggage: searchParams.luggage,
              hasPet: searchParams.hasPet,
              priceRange: `$${selectedCategory.minPrice.toLocaleString()} - $${selectedCategory.maxPrice.toLocaleString()}`,
              groundTransport: 'Included',
              pickupAddress: quoteForm.pickupAddress,
              dropoffAddress: quoteForm.dropoffAddress,
              clientName: quoteForm.name,
              clientEmail: quoteForm.email,
              clientPhone: quoteForm.phone,
              specialRequests: quoteForm.specialRequests,
            }
          }
        });
      } catch (emailErr) {
        console.warn('Email send failed:', emailErr);
      }

      setQuoteSubmitted(true);

    } catch (err) {
      console.error('Quote submission error:', err);
      alert('Failed to submit quote request. Please try again.');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Calculate arrival time based on departure time and flight hours
  const calculateArrivalTime = (departureTime: string, flightHours: number): string => {
    if (!departureTime) return '--:--';
    const [hours, minutes] = departureTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + Math.round(flightHours * 60);
    const arrivalHours = Math.floor(totalMinutes / 60) % 24;
    const arrivalMinutes = totalMinutes % 60;
    return `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`;
  };

  // Check if arrival is next day
  const isNextDay = (departureTime: string, flightHours: number): boolean => {
    if (!departureTime) return false;
    const [hours, minutes] = departureTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + Math.round(flightHours * 60);
    return totalMinutes >= 24 * 60;
  };

  // ========== DETAIL VIEW ==========
  if (showDetailView && selectedCategory) {
    const categoryInfo = CATEGORY_INFO[selectedCategory.category];

    if (quoteSubmitted) {
      return (
        <div className="w-full max-w-2xl mx-auto py-8 sm:py-16 px-4 sm:px-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Check className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900 mb-2 sm:mb-3">Quote Request Submitted!</h2>
            <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
              Thank you for your request. Our aviation team will review your requirements and get back to you within 2 hours with a detailed quote.
            </p>
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 text-left">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <p className="text-gray-500">Route</p>
                  <p className="font-medium text-gray-900">{searchParams.origin} → {searchParams.destination}</p>
                </div>
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="font-medium text-gray-900 truncate">{selectedCategory.category}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">{searchParams.departureDate}</p>
                </div>
                <div>
                  <p className="text-gray-500">Estimated Price</p>
                  <p className="font-medium text-gray-900 text-xs sm:text-sm">${selectedCategory.minPrice.toLocaleString()} - ${selectedCategory.maxPrice.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400 mb-4 sm:mb-6">
              A confirmation email has been sent to {quoteForm.email}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <button
                onClick={() => navigate('/dashboard?tab=requests')}
                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                View My Requests
              </button>
              <button
                onClick={() => {
                  setShowDetailView(false);
                  setSelectedCategory(null);
                  setQuoteSubmitted(false);
                }}
                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                New Search
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        {/* Back Button & Route Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
          <button
            onClick={() => {
              setShowDetailView(false);
              setSelectedCategory(null);
            }}
            className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
            <span>Back to results</span>
          </button>

          <div className="text-xs sm:text-sm text-gray-500">
            {searchParams.origin} → {searchParams.destination}
            <span className="mx-1 sm:mx-2">·</span>
            {formatDate(searchParams.departureDate)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Flight Card - Similar to Commercial */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-14 h-10 sm:w-20 sm:h-14 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <img
                      src={categoryInfo?.image}
                      alt={selectedCategory.category}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{selectedCategory.category}</h3>
                    <p className="text-xs sm:text-sm text-gray-500">Private Charter · {selectedCategory.minCapacity}-{selectedCategory.maxCapacity} pax</p>
                  </div>
                </div>

                {/* Route Visualization */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center min-w-0">
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{quoteForm.departureTime || '09:00'}</p>
                    <p className="text-sm sm:text-base font-medium text-gray-700 mt-1 truncate">{searchParams.origin}</p>
                    <p className="text-xs sm:text-sm text-gray-500">Departure</p>
                  </div>
                  <div className="flex-1 mx-2 sm:mx-6 flex flex-col items-center">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">~{selectedCategory.avgFlightHours}h</p>
                    <div className="w-full flex items-center">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-300" />
                      <div className="flex-1 h-px bg-gray-300" />
                      <Plane size={12} className="text-gray-400 rotate-90 mx-0.5 sm:mx-1 sm:w-[14px] sm:h-[14px]" />
                      <div className="flex-1 h-px bg-gray-300" />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-300" />
                    </div>
                    <p className="text-[10px] sm:text-sm text-gray-500 mt-1 sm:mt-2">{calculatedDistance.toLocaleString()} km</p>
                  </div>
                  <div className="text-center min-w-0">
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {calculateArrivalTime(quoteForm.departureTime, selectedCategory.avgFlightHours)}
                    </p>
                    <p className="text-sm sm:text-base font-medium text-gray-700 mt-1 truncate">{searchParams.destination}</p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Est. Arrival
                      {isNextDay(quoteForm.departureTime, selectedCategory.avgFlightHours) && (
                        <span className="text-orange-500 ml-1">(+1)</span>
                      )}
                    </p>
                  </div>
                </div>

                <p className="text-center text-xs sm:text-sm text-gray-500">
                  {formatFullDate(searchParams.departureDate)}
                </p>
              </div>

              {/* Return Journey */}
              {searchParams.journeyType === 'return' && searchParams.returnDate && (
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 sm:mb-3">Return Flight</p>
                  <div className="flex items-center justify-between">
                    <div className="text-center min-w-0">
                      <p className="text-base sm:text-lg font-bold text-gray-900">{quoteForm.returnTime || '18:00'}</p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{searchParams.destination}</p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 mx-2">
                      <div className="w-4 sm:w-6 h-px bg-gray-300" />
                      <Plane size={10} className="text-gray-400 rotate-90 sm:w-3 sm:h-3" />
                      <div className="w-4 sm:w-6 h-px bg-gray-300" />
                    </div>
                    <div className="text-center min-w-0">
                      <p className="text-base sm:text-lg font-bold text-gray-900">
                        {calculateArrivalTime(quoteForm.returnTime || '18:00', selectedCategory.avgFlightHours)}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{searchParams.origin}</p>
                      {isNextDay(quoteForm.returnTime || '18:00', selectedCategory.avgFlightHours) && (
                        <p className="text-[10px] sm:text-xs text-orange-500">(+1)</p>
                      )}
                    </div>
                  </div>
                  <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-2">{formatDate(searchParams.returnDate)}</p>
                </div>
              )}

              {/* Flight Details Grid */}
              <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 border-b border-gray-100">
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide mb-1">Passengers</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{searchParams.passengers} pax</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide mb-1">Luggage</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{searchParams.luggage} bags</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide mb-1">Pet</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{searchParams.hasPet ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide mb-1">Trip Type</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{searchParams.journeyType === 'return' ? 'Return' : 'One Way'}</p>
                </div>
              </div>

              {/* Ground Transport */}
              <div className="p-4 sm:p-6">
                <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 sm:mb-3">Included Services</p>
                <div className="flex items-center gap-3 sm:gap-4 bg-gray-50 rounded-xl p-3 sm:p-4">
                  {/* Car Image */}
                  <div className="w-16 h-10 sm:w-20 sm:h-12 flex-shrink-0 flex items-center justify-center">
                    <img
                      src="https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/2022-mercedes-benz-s-class-removebg-preview.png"
                      alt="Mercedes S-Class"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* Text - vertically centered */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Luxury Ground Transport</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Mercedes S-Class or equivalent · Airport pickup & drop-off included</p>
                  </div>
                  {/* Green Checkmark - right side */}
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check size={14} className="text-green-600 sm:w-4 sm:h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Category Details */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <h4 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Info size={16} className="sm:w-[18px] sm:h-[18px]" />
                  About {selectedCategory.category}
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{categoryInfo?.description}</p>
              </div>
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 sm:mb-3">Ideal For</p>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {categoryInfo?.idealFor.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                        <Check size={12} className="text-gray-400 flex-shrink-0 mt-0.5 sm:w-[14px] sm:h-[14px]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 sm:mb-3">Features</p>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {categoryInfo?.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                        <Check size={12} className="text-gray-400 flex-shrink-0 mt-0.5 sm:w-[14px] sm:h-[14px]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact Details Form */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users size={14} className="text-gray-600 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">Contact Details</h3>
                  <p className="text-[10px] sm:text-xs text-gray-500">Enter your details for the quote request</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={quoteForm.name}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={quoteForm.email}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={quoteForm.phone}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 234 567 8900"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Preferred Departure Time</label>
                  <input
                    type="time"
                    value={quoteForm.departureTime}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, departureTime: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              {searchParams.journeyType === 'return' && (
                <div className="mt-3 sm:mt-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Preferred Return Time</label>
                  <input
                    type="time"
                    value={quoteForm.returnTime}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, returnTime: e.target.value }))}
                    className="w-full sm:w-1/2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              )}

              {/* Ground Transport Addresses */}
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                  <Car size={12} className="text-gray-400 sm:w-[14px] sm:h-[14px]" />
                  Ground Transport Addresses
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-1.5">Pickup Address</label>
                    <input
                      type="text"
                      value={quoteForm.pickupAddress}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, pickupAddress: e.target.value }))}
                      placeholder="Hotel, office, or home address"
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-1.5">Drop-off Address</label>
                    <input
                      type="text"
                      value={quoteForm.dropoffAddress}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, dropoffAddress: e.target.value }))}
                      placeholder="Final destination address"
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div className="mt-3 sm:mt-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Special Requests</label>
                <textarea
                  value={quoteForm.specialRequests}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                  placeholder="Catering preferences, special assistance, etc."
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right: Price Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 lg:sticky lg:top-4">
              <div className="p-4 sm:p-5 border-b border-gray-100">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Price Summary</h3>
              </div>

              <div className="p-4 sm:p-5 space-y-2 sm:space-y-3">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Aircraft Category</span>
                  <span className="text-gray-900 font-medium truncate ml-2">{selectedCategory.category}</span>
                </div>

                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Est. Flight Time</span>
                  <span className="text-gray-900">~{selectedCategory.avgFlightHours}h</span>
                </div>

                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Distance</span>
                  <span className="text-gray-900">{calculatedDistance.toLocaleString()} km</span>
                </div>

                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Ground Transport</span>
                  <span className="text-green-600 font-medium">Included</span>
                </div>

                <div className="pt-2 sm:pt-3 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs sm:text-sm">Estimated Price</span>
                  </div>
                  <div className="flex justify-between items-baseline mt-1">
                    <span className="text-[10px] sm:text-xs text-gray-400">Range</span>
                    <span className="text-lg sm:text-xl font-bold text-gray-900">
                      ${selectedCategory.minPrice.toLocaleString()} - ${selectedCategory.maxPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Login Notice */}
                {!user && (
                  <div className="flex items-start gap-2 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-xl mt-3 sm:mt-4">
                    <Shield size={14} className="text-amber-600 flex-shrink-0 mt-0.5 sm:w-4 sm:h-4" />
                    <p className="text-[10px] sm:text-xs text-amber-800">
                      Sign in required to submit quote request. Your details will be saved.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="p-4 sm:p-5 pt-0">
                <button
                  onClick={handleSubmitQuote}
                  disabled={isSubmittingQuote}
                  className="w-full py-2.5 sm:py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingQuote ? (
                    <>
                      <Loader2 size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" />
                      <span>Submitting...</span>
                    </>
                  ) : !user ? (
                    <>
                      <span>Sign in & Submit</span>
                      <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </>
                  ) : (
                    <>
                      <span>Submit Quote Request</span>
                      <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </>
                  )}
                </button>

                <p className="text-[10px] sm:text-xs text-gray-400 text-center mt-2 sm:mt-3">
                  Our team responds within 2 hours with final pricing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== SEARCH VIEW ==========
  return (
    <div className="w-full">
      {/* Animation Styles */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>

      {/* Header */}
      <h2 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight mb-2">Private Jets</h2>
      <p className="text-gray-500 text-sm mb-6">Charter a private jet with ground transport included</p>

      {/* Journey Type Segmented Control */}
      <div className="inline-flex p-1 bg-gray-100 rounded-xl mb-6">
        {[
          { id: 'one-way', label: 'One way' },
          { id: 'return', label: 'Return' },
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => setSearchParams(prev => ({ ...prev, journeyType: type.id as any }))}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              searchParams.journeyType === type.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow p-2 mb-4">
        <div className="flex flex-col sm:flex-row">
          {/* Origin */}
          <div ref={originRef} className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200 relative">
            <label className="block text-xs font-medium text-gray-900 mb-1">From</label>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="City or airport..."
                value={searchParams.origin}
                onChange={(e) => {
                  setSearchParams(prev => ({ ...prev, origin: e.target.value, originCoords: null }));
                  setShowOriginDropdown(true);
                }}
                onFocus={() => setShowOriginDropdown(true)}
                className="w-full text-sm text-gray-600 placeholder-gray-400 bg-transparent outline-none"
              />
            </div>
            {showOriginDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-64 overflow-y-auto">
                {getFilteredAirports(searchParams.origin).map((airport) => (
                  <button
                    key={airport.code}
                    onClick={() => handleAirportSelect(airport, 'origin')}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-gray-700">{airport.code}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{airport.name}</p>
                      <p className="text-xs text-gray-500 truncate">{airport.city}, {airport.country}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Destination */}
          <div ref={destinationRef} className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200 relative">
            <label className="block text-xs font-medium text-gray-900 mb-1">To</label>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="City or airport..."
                value={searchParams.destination}
                onChange={(e) => {
                  setSearchParams(prev => ({ ...prev, destination: e.target.value, destinationCoords: null }));
                  setShowDestinationDropdown(true);
                }}
                onFocus={() => setShowDestinationDropdown(true)}
                className="w-full text-sm text-gray-600 placeholder-gray-400 bg-transparent outline-none"
              />
            </div>
            {showDestinationDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-64 overflow-y-auto">
                {getFilteredAirports(searchParams.destination).map((airport) => (
                  <button
                    key={airport.code}
                    onClick={() => handleAirportSelect(airport, 'destination')}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-gray-700">{airport.code}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{airport.name}</p>
                      <p className="text-xs text-gray-500 truncate">{airport.city}, {airport.country}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Departure Date */}
          <div ref={departureDateRef} className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200 relative">
            <label className="block text-xs font-medium text-gray-900 mb-1">Departure</label>
            <button
              type="button"
              onClick={() => {
                setShowDepartureDatePicker(!showDepartureDatePicker);
                setShowReturnDatePicker(false);
              }}
              className="w-full flex items-center gap-2 text-left"
            >
              <Calendar size={14} className="text-gray-400 flex-shrink-0" />
              <span className={`text-sm ${searchParams.departureDate ? 'text-gray-900' : 'text-gray-400'}`}>
                {searchParams.departureDate
                  ? format(new Date(searchParams.departureDate), 'MMM d, yyyy')
                  : 'Select date'}
              </span>
            </button>

            {/* Departure Date Picker Dropdown */}
            {showDepartureDatePicker && (
              <div className="absolute left-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-4 w-72">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setDepartureDateMonth(addMonths(departureDateMonth, -1))}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft size={16} className="text-gray-600" />
                  </button>
                  <span className="text-sm font-semibold text-gray-900">
                    {format(departureDateMonth, 'MMMM yyyy')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDepartureDateMonth(addMonths(departureDateMonth, 1))}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight size={16} className="text-gray-600" />
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const monthStart = startOfMonth(departureDateMonth);
                    const monthEnd = endOfMonth(departureDateMonth);
                    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
                    const startDay = monthStart.getDay();
                    const paddingDays = Array(startDay).fill(null);

                    return [...paddingDays, ...days].map((day, idx) => {
                      if (!day) return <div key={`empty-${idx}`} />;

                      const isSelected = searchParams.departureDate && isSameDay(day, new Date(searchParams.departureDate));
                      const isPast = isBefore(day, startOfDay(new Date()));
                      const isTodayDate = isToday(day);

                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          disabled={isPast}
                          onClick={() => {
                            setSearchParams(prev => ({ ...prev, departureDate: format(day, 'yyyy-MM-dd') }));
                            setShowDepartureDatePicker(false);
                          }}
                          className={`
                            aspect-square flex items-center justify-center text-sm rounded-lg transition-all
                            ${isSelected
                              ? 'bg-gray-900 text-white font-medium'
                              : isPast
                                ? 'text-gray-300 cursor-not-allowed'
                                : isTodayDate
                                  ? 'bg-gray-100 text-gray-900 font-medium hover:bg-gray-200'
                                  : 'text-gray-700 hover:bg-gray-100'
                            }
                          `}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Return Date */}
          {searchParams.journeyType === 'return' && (
            <div ref={returnDateRef} className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200 relative">
              <label className="block text-xs font-medium text-gray-900 mb-1">Return</label>
              <button
                type="button"
                onClick={() => {
                  setShowReturnDatePicker(!showReturnDatePicker);
                  setShowDepartureDatePicker(false);
                }}
                className="w-full flex items-center gap-2 text-left"
              >
                <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                <span className={`text-sm ${searchParams.returnDate ? 'text-gray-900' : 'text-gray-400'}`}>
                  {searchParams.returnDate
                    ? format(new Date(searchParams.returnDate), 'MMM d, yyyy')
                    : 'Select date'}
                </span>
              </button>

              {/* Return Date Picker Dropdown */}
              {showReturnDatePicker && (
                <div className="absolute left-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-4 w-72">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => setReturnDateMonth(addMonths(returnDateMonth, -1))}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft size={16} className="text-gray-600" />
                    </button>
                    <span className="text-sm font-semibold text-gray-900">
                      {format(returnDateMonth, 'MMMM yyyy')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setReturnDateMonth(addMonths(returnDateMonth, 1))}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight size={16} className="text-gray-600" />
                    </button>
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const monthStart = startOfMonth(returnDateMonth);
                      const monthEnd = endOfMonth(returnDateMonth);
                      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
                      const startDay = monthStart.getDay();
                      const paddingDays = Array(startDay).fill(null);
                      const minDate = searchParams.departureDate ? new Date(searchParams.departureDate) : new Date();

                      return [...paddingDays, ...days].map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} />;

                        const isSelected = searchParams.returnDate && isSameDay(day, new Date(searchParams.returnDate));
                        const isPast = isBefore(day, startOfDay(minDate));
                        const isTodayDate = isToday(day);

                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            disabled={isPast}
                            onClick={() => {
                              setSearchParams(prev => ({ ...prev, returnDate: format(day, 'yyyy-MM-dd') }));
                              setShowReturnDatePicker(false);
                            }}
                            className={`
                              aspect-square flex items-center justify-center text-sm rounded-lg transition-all
                              ${isSelected
                                ? 'bg-gray-900 text-white font-medium'
                                : isPast
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : isTodayDate
                                    ? 'bg-gray-100 text-gray-900 font-medium hover:bg-gray-200'
                                    : 'text-gray-700 hover:bg-gray-100'
                              }
                            `}
                          >
                            {format(day, 'd')}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Passengers */}
          <div className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200">
            <label className="block text-xs font-medium text-gray-900 mb-1">Passengers</label>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-gray-400 flex-shrink-0" />
              <select
                value={searchParams.passengers}
                onChange={(e) => setSearchParams(prev => ({ ...prev, passengers: parseInt(e.target.value) }))}
                className="w-full text-sm text-gray-600 bg-transparent outline-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((num) => (
                  <option key={num} value={num}>{num} pax</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Button */}
          <div className="flex items-center justify-center p-2">
            <button
              onClick={handleSearch}
              disabled={!searchParams.origin || !searchParams.destination || !searchParams.departureDate || isSearching}
              className="w-full sm:w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search size={18} className="text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Additional Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200">
          <Briefcase size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">Luggage</span>
          <button
            onClick={() => setSearchParams(prev => ({ ...prev, luggage: Math.max(0, prev.luggage - 1) }))}
            className="w-6 h-6 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 text-xs flex items-center justify-center"
          >−</button>
          <span className="text-sm font-medium text-gray-900 w-4 text-center">{searchParams.luggage}</span>
          <button
            onClick={() => setSearchParams(prev => ({ ...prev, luggage: prev.luggage + 1 }))}
            className="w-6 h-6 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 text-xs flex items-center justify-center"
          >+</button>
        </div>

        <button
          onClick={() => setSearchParams(prev => ({ ...prev, hasPet: !prev.hasPet }))}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
            searchParams.hasPet
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          <PawPrint size={14} />
          <span className="text-xs">Pet onboard</span>
        </button>
      </div>

      {/* Error Message */}
      {searchError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <Info size={20} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{searchError}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isSearching && (
        <div className="space-y-4">
          {/* Searching indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative">
              <Loader2 className="w-5 h-5 text-gray-900 animate-spin" />
            </div>
            <span className="text-sm text-gray-600">Finding the best aircraft for your route...</span>
          </div>

          {/* Skeleton Cards */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden opacity-0 animate-slideUp"
              style={{
                animationDelay: `${i * 100}ms`,
                animationFillMode: 'forwards'
              }}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image Skeleton with shimmer */}
                <div className="sm:w-56 h-36 sm:h-44 flex-shrink-0 animate-shimmer" />

                {/* Content Skeleton */}
                <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-32 rounded animate-shimmer" />
                    <div className="h-4 w-24 rounded animate-shimmer" />
                    <div className="flex gap-2">
                      <div className="h-6 w-20 rounded-full animate-shimmer" />
                      <div className="h-6 w-20 rounded-full animate-shimmer" style={{ animationDelay: '0.1s' }} />
                      <div className="h-6 w-24 rounded-full animate-shimmer" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                    <div className="space-y-2">
                      <div className="h-3 w-16 rounded animate-shimmer" />
                      <div className="h-7 w-28 rounded animate-shimmer" />
                    </div>
                    <div className="h-10 w-28 rounded-xl animate-shimmer" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results - Categories Only */}
      {hasSearched && !isSearching && (
        <div className="space-y-4">
          {/* Route Summary */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-4 animate-fadeIn">
            <span className="font-medium text-gray-900">{searchParams.origin}</span>
            <ArrowRight className="w-4 h-4" />
            <span className="font-medium text-gray-900">{searchParams.destination}</span>
            <span className="text-gray-400">·</span>
            <span>{calculatedDistance.toLocaleString()} km</span>
            <span className="text-gray-400">·</span>
            <span>{searchParams.journeyType === 'return' ? 'Return' : 'One Way'}</span>
            <span className="text-gray-400">·</span>
            <span>{searchParams.passengers} pax</span>
            {searchParams.luggage > 0 && (
              <>
                <span className="text-gray-400">·</span>
                <span>{searchParams.luggage} bags</span>
              </>
            )}
            {searchParams.hasPet && (
              <>
                <span className="text-gray-400">·</span>
                <span className="flex items-center gap-1"><PawPrint className="w-3 h-3" /> Pet</span>
              </>
            )}
          </div>

          {/* Category Cards with Staggered Animation */}
          {categoryPricing.map((category, index) => {
            const info = CATEGORY_INFO[category.category];

            // Helper to render badge icon
            const renderBadgeIcon = (iconType: string) => {
              switch (iconType) {
                case 'seats': return <Armchair size={12} />;
                case 'catering': return <UtensilsCrossed size={12} />;
                case 'wifi': return <Wifi size={12} />;
                case 'luggage': return <Luggage size={12} />;
                default: return null;
              }
            };

            return (
              <div
                key={category.category}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-300 opacity-0 animate-slideUp"
                style={{
                  animationDelay: `${index * 150}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="sm:w-56 h-36 sm:h-auto flex-shrink-0 bg-white flex items-center justify-center p-4">
                    <img
                      src={info?.image}
                      alt={category.category}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{category.category}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          ~{category.avgFlightHours}h flight
                        </span>
                      </div>
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {info?.badges.map((badge, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700"
                          >
                            {renderBadgeIcon(badge.icon)}
                            {badge.label}
                          </span>
                        ))}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-900 text-white rounded-full text-xs">
                          <Car size={12} />
                          Transfer included
                        </span>
                      </div>
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Estimated from</p>
                        <p className="text-xl font-semibold text-gray-900">
                          ${category.minPrice.toLocaleString()}
                        </p>
                        {category.minPrice !== category.maxPrice && (
                          <p className="text-xs text-gray-400">up to ${category.maxPrice.toLocaleString()}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleGetQuote(category)}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                      >
                        Get a Quote
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!hasSearched && (
        <div className="flex-1 flex items-center justify-center py-16">
          <div className="text-center">
            <Plane className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search for your route</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Enter your departure and destination to see estimated prices for different aircraft categories.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
