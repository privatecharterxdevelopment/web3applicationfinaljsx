import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Plane, Users, MapPin, Clock, Luggage, ArrowRight, ArrowLeft,
  AlertCircle, Check, ChevronRight, Wallet, Loader2, User, Mail, Phone,
  Sparkles, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Popular airports for autocomplete
const POPULAR_AIRPORTS = [
  { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'UK' },
  { code: 'JFK', name: 'John F. Kennedy', city: 'New York', country: 'USA' },
  { code: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'USA' },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
  { code: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'UAE' },
  { code: 'SIN', name: 'Changi', city: 'Singapore', country: 'Singapore' },
  { code: 'HKG', name: 'Hong Kong Intl', city: 'Hong Kong', country: 'China' },
  { code: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'Germany' },
  { code: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'ZRH', name: 'Zurich', city: 'Zurich', country: 'Switzerland' },
  { code: 'GVA', name: 'Geneva', city: 'Geneva', country: 'Switzerland' },
  { code: 'MUC', name: 'Munich', city: 'Munich', country: 'Germany' },
  { code: 'BCN', name: 'Barcelona El Prat', city: 'Barcelona', country: 'Spain' },
  { code: 'MAD', name: 'Madrid Barajas', city: 'Madrid', country: 'Spain' },
  { code: 'FCO', name: 'Fiumicino', city: 'Rome', country: 'Italy' },
  { code: 'MXP', name: 'Malpensa', city: 'Milan', country: 'Italy' },
  { code: 'VIE', name: 'Vienna Intl', city: 'Vienna', country: 'Austria' },
  { code: 'IST', name: 'Istanbul', city: 'Istanbul', country: 'Turkey' },
  { code: 'ORD', name: "O'Hare", city: 'Chicago', country: 'USA' },
  { code: 'MIA', name: 'Miami Intl', city: 'Miami', country: 'USA' },
  { code: 'SFO', name: 'San Francisco', city: 'San Francisco', country: 'USA' },
  { code: 'ATL', name: 'Hartsfield-Jackson', city: 'Atlanta', country: 'USA' },
  { code: 'BOS', name: 'Logan Intl', city: 'Boston', country: 'USA' },
  { code: 'SEA', name: 'Seattle-Tacoma', city: 'Seattle', country: 'USA' },
  { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', country: 'Canada' },
  { code: 'SYD', name: 'Sydney Kingsford', city: 'Sydney', country: 'Australia' },
  { code: 'NRT', name: 'Narita', city: 'Tokyo', country: 'Japan' },
  { code: 'ICN', name: 'Incheon', city: 'Seoul', country: 'South Korea' },
  { code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thailand' },
  { code: 'DOH', name: 'Hamad Intl', city: 'Doha', country: 'Qatar' },
];

interface AvailableService {
  id: string;
  type: string; // 'baggage'
  passengerIds: string[];
  segmentIds: string[];
  totalAmount: number;
  totalCurrency: string;
  metadata?: {
    type: string; // 'checked' or 'carry_on'
    maximumWeightKg?: number;
    maximumHeightCm?: number;
    maximumLengthCm?: number;
    maximumDepthCm?: number;
  };
}

interface FlightOffer {
  offerId: string;
  airline: {
    name: string;
    iataCode: string;
    logoUrl: string | null;
  };
  flightNumber: string;
  departure: {
    airport: string;
    airportName: string;
    city: string;
    time: string;
    terminal: string | null;
  };
  arrival: {
    airport: string;
    airportName: string;
    city: string;
    time: string;
    terminal: string | null;
  };
  duration: string;
  durationMinutes: number;
  stops: number;
  price: {
    amount: number;
    currency: string;
    perPassenger?: number;
  };
  cabinClass: string;
  cabinClassName?: string;
  baggage?: {
    checkedBags: number;
    cabinBags: number;
    checkedBagWeight?: number;
  };
  conditions?: {
    refundable: boolean;
    changeable: boolean;
  };
  segments?: any[];
  returnJourney?: any;
  rawOffer?: any;
  expiresAt?: string;
  availableServices?: AvailableService[];
}

interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  passengers: number;
  cabinClass: string;
  journeyType: 'one-way' | 'return';
}

interface Passenger {
  givenName: string;
  familyName: string;
  gender: 'male' | 'female';
  email: string;
  phone: string;
  bornOn: string;
}

type BookingStep = 'review' | 'passengers' | 'payment';

const STEPS: { id: BookingStep; label: string }[] = [
  { id: 'review', label: 'Review' },
  { id: 'passengers', label: 'Passengers' },
  { id: 'payment', label: 'Payment' },
];

interface FlightSearchDashboardProps {
  onShowLoginModal?: () => void;
}

export default function FlightSearchDashboard({ onShowLoginModal }: FlightSearchDashboardProps) {
  const { user } = useAuth();

  // Search state
  const [searchParams, setSearchParams] = useState<SearchParams>({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    cabinClass: 'economy',
    journeyType: 'return',
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [flights, setFlights] = useState<FlightOffer[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Booking state
  const [selectedFlight, setSelectedFlight] = useState<FlightOffer | null>(null);
  const [currentStep, setCurrentStep] = useState<BookingStep>('review');
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]); // IDs of selected extra services
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [loadedServices, setLoadedServices] = useState<AvailableService[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const FLIGHTS_PER_PAGE = 10;

  // Featured destinations state
  interface FeaturedDestination {
    id: string;
    origin: string;
    originCity: string;
    destination: string;
    destinationCity: string;
    country: string;
    image: string;
    price: number | null;
    currency: string;
    isLoading: boolean;
  }

  const [featuredDestinations, setFeaturedDestinations] = useState<FeaturedDestination[]>([
    {
      id: 'zrh-jfk',
      origin: 'ZRH',
      originCity: 'Zürich',
      destination: 'JFK',
      destinationCity: 'New York',
      country: 'USA',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80',
      price: null,
      currency: 'USD',
      isLoading: true
    },
    {
      id: 'zrh-bcn',
      origin: 'ZRH',
      originCity: 'Zürich',
      destination: 'BCN',
      destinationCity: 'Barcelona',
      country: 'Spain',
      image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
      price: null,
      currency: 'USD',
      isLoading: true
    },
    {
      id: 'zrh-dxb',
      origin: 'ZRH',
      originCity: 'Zürich',
      destination: 'DXB',
      destinationCity: 'Dubai',
      country: 'UAE',
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
      price: null,
      currency: 'USD',
      isLoading: true
    },
    {
      id: 'zrh-bkk',
      origin: 'ZRH',
      originCity: 'Zürich',
      destination: 'BKK',
      destinationCity: 'Bangkok',
      country: 'Thailand',
      image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80',
      price: null,
      currency: 'USD',
      isLoading: true
    }
  ]);

  // Fetch featured destination prices on mount
  useEffect(() => {
    const fetchFeaturedPrices = async () => {
      // Get a date 14 days from now for sample pricing
      const departureDate = new Date();
      departureDate.setDate(departureDate.getDate() + 14);
      const departureDateStr = departureDate.toISOString().split('T')[0];

      const returnDate = new Date(departureDate);
      returnDate.setDate(returnDate.getDate() + 7);
      const returnDateStr = returnDate.toISOString().split('T')[0];

      // Fetch prices for each destination
      for (const dest of featuredDestinations) {
        try {
          const { data } = await supabase.functions.invoke('search-flights', {
            body: {
              origin: dest.origin,
              destination: dest.destination,
              departureDate: departureDateStr,
              returnDate: returnDateStr,
              passengers: 1,
              cabinClass: 'economy'
            }
          });

          if (data?.success && data.offers?.length > 0) {
            // Get the lowest price
            const lowestPrice = Math.min(...data.offers.map((o: any) => o.price.amount));
            setFeaturedDestinations(prev =>
              prev.map(d =>
                d.id === dest.id
                  ? { ...d, price: lowestPrice, currency: data.offers[0].price.currency, isLoading: false }
                  : d
              )
            );
          } else {
            setFeaturedDestinations(prev =>
              prev.map(d => (d.id === dest.id ? { ...d, isLoading: false } : d))
            );
          }
        } catch (err) {
          console.error(`Failed to fetch price for ${dest.destination}:`, err);
          setFeaturedDestinations(prev =>
            prev.map(d => (d.id === dest.id ? { ...d, isLoading: false } : d))
          );
        }
      }
    };

    // Only fetch if we haven't searched yet
    if (!hasSearched) {
      fetchFeaturedPrices();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle featured destination click
  const handleFeaturedClick = async (dest: FeaturedDestination) => {
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 14);
    const returnDate = new Date(departureDate);
    returnDate.setDate(returnDate.getDate() + 7);

    const newParams = {
      origin: dest.origin,
      destination: dest.destination,
      departureDate: departureDate.toISOString().split('T')[0],
      returnDate: returnDate.toISOString().split('T')[0],
      passengers: 1,
      cabinClass: 'economy',
      journeyType: 'return' as const
    };

    setSearchParams(newParams);

    // Search directly with the new params
    setIsSearching(true);
    setHasSearched(true);
    setSearchError(null);
    setSelectedFlight(null);
    setCurrentPage(1);

    try {
      const { data, error } = await supabase.functions.invoke('search-flights', {
        body: {
          origin: newParams.origin,
          destination: newParams.destination,
          departureDate: newParams.departureDate,
          returnDate: newParams.returnDate,
          passengers: newParams.passengers,
          cabinClass: newParams.cabinClass
        }
      });

      if (error) throw new Error(error.message || 'Failed to search flights');
      if (!data?.success) throw new Error(data?.error || 'No flights found');

      setFlights(data.offers || []);
    } catch (err: any) {
      console.error('Flight search error:', err);
      setSearchError(err.message || 'Failed to search flights. Please try again.');
      setFlights([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Airport autocomplete
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const originRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);

  // Initialize passengers when flight is selected
  useEffect(() => {
    if (selectedFlight) {
      const initialPassengers: Passenger[] = [];
      for (let i = 0; i < searchParams.passengers; i++) {
        initialPassengers.push({
          givenName: i === 0 ? (user?.user_metadata?.full_name?.split(' ')[0] || '') : '',
          familyName: i === 0 ? (user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '') : '',
          gender: 'male',
          email: i === 0 ? (user?.email || '') : '',
          phone: '',
          bornOn: '',
        });
      }
      setPassengers(initialPassengers);
    }
  }, [selectedFlight, searchParams.passengers, user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setShowOriginDropdown(false);
      }
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        setShowDestinationDropdown(false);
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
    setSearchParams(prev => ({ ...prev, [field]: airport.code }));
    if (field === 'origin') {
      setShowOriginDropdown(false);
    } else {
      setShowDestinationDropdown(false);
    }
  };

  const isValidIATACode = (code: string) => /^[A-Za-z]{3}$/.test(code);

  const findAirportCode = (input: string): string | null => {
    const lowerInput = input.toLowerCase().trim();
    const airport = POPULAR_AIRPORTS.find(
      a => a.code.toLowerCase() === lowerInput ||
           a.city.toLowerCase() === lowerInput ||
           a.name.toLowerCase() === lowerInput
    );
    return airport?.code || null;
  };

  const handleSearch = async () => {
    if (!searchParams.origin || !searchParams.destination || !searchParams.departureDate) {
      setSearchError('Please enter origin, destination, and departure date');
      return;
    }

    let originCode = searchParams.origin.trim();
    let destinationCode = searchParams.destination.trim();

    if (!isValidIATACode(originCode)) {
      const foundCode = findAirportCode(originCode);
      if (foundCode) {
        originCode = foundCode;
        setSearchParams(prev => ({ ...prev, origin: foundCode }));
      } else {
        setSearchError('Please select an origin airport from the dropdown');
        return;
      }
    }

    if (!isValidIATACode(destinationCode)) {
      const foundCode = findAirportCode(destinationCode);
      if (foundCode) {
        destinationCode = foundCode;
        setSearchParams(prev => ({ ...prev, destination: foundCode }));
      } else {
        setSearchError('Please select a destination airport from the dropdown');
        return;
      }
    }

    setIsSearching(true);
    setHasSearched(true);
    setSearchError(null);
    setSelectedFlight(null);
    setCurrentPage(1);

    try {
      const { data, error } = await supabase.functions.invoke('search-flights', {
        body: {
          origin: originCode.toUpperCase(),
          destination: destinationCode.toUpperCase(),
          departureDate: searchParams.departureDate,
          returnDate: searchParams.journeyType !== 'one-way' && searchParams.returnDate ? searchParams.returnDate : undefined,
          passengers: searchParams.passengers,
          cabinClass: searchParams.cabinClass
        }
      });

      if (error) throw new Error(error.message || 'Failed to search flights');
      if (!data?.success) throw new Error(data?.error || 'No flights found');

      setFlights(data.offers || []);
    } catch (err: any) {
      console.error('Flight search error:', err);
      setSearchError(err.message || 'Failed to search flights. Please try again.');
      setFlights([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFlightSelect = async (flight: FlightOffer) => {
    setSelectedFlight(flight);
    setCurrentStep('review');
    setBookingError(null);
    setSelectedServices([]);
    setLoadedServices([]);
    setIsLoadingServices(true);

    // Fetch available services for this offer
    try {
      const { data, error } = await supabase.functions.invoke('get-flight-services', {
        body: { offerId: flight.offerId }
      });

      if (error) {
        console.error('Error fetching services:', error);
      } else if (data?.success && data.baggageServices) {
        setLoadedServices(data.baggageServices);
        console.log('Loaded baggage services:', data.baggageServices);
      }
    } catch (err) {
      console.error('Failed to fetch flight services:', err);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const handleBackToSearch = () => {
    setSelectedFlight(null);
    setCurrentStep('review');
    setBookingError(null);
  };

  const formatTime = (timeValue: string | undefined | null) => {
    if (!timeValue) return '--:--';
    const date = new Date(timeValue);
    if (isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatFullDate = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Booking step handlers
  const goToStep = (step: BookingStep) => {
    setBookingError(null);
    setCurrentStep(step);
  };

  const handleNext = async () => {
    setBookingError(null);

    if (currentStep === 'review') {
      goToStep('passengers');
    } else if (currentStep === 'passengers') {
      const isValid = passengers.every(p => p.givenName && p.familyName && p.bornOn && p.gender);
      if (!isValid) {
        setBookingError('Please fill in all required passenger details');
        return;
      }
      goToStep('payment');
    } else if (currentStep === 'payment') {
      await handlePayment();
    }
  };

  const handleBack = () => {
    setBookingError(null);
    const stepIndex = STEPS.findIndex(s => s.id === currentStep);
    if (stepIndex > 0) {
      goToStep(STEPS[stepIndex - 1].id);
    } else {
      handleBackToSearch();
    }
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: string) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Payment handler
  const handlePayment = async () => {
    if (!selectedFlight) return;

    // Require login before payment
    if (!user) {
      if (onShowLoginModal) {
        onShowLoginModal();
      }
      return;
    }

    setIsProcessing(true);
    setBookingError(null);

    try {
      // Calculate totals including extras
      const flightPrice = selectedFlight.price.amount;
      const extrasTotal = selectedServices.reduce((sum, serviceId) => {
        const service = loadedServices.find(s => s.id === serviceId);
        return sum + (service?.totalAmount || 0) * 1.20; // 20% markup
      }, 0);
      const subtotalPrice = flightPrice + extrasTotal;
      const vatPrice = Math.round(subtotalPrice * 0.081 * 100) / 100;
      const finalTotal = Math.round((subtotalPrice + vatPrice) * 100) / 100;

      // Get selected services details
      const selectedServicesData = selectedServices.map(serviceId => {
        const service = loadedServices.find(s => s.id === serviceId);
        return {
          id: service?.id,
          type: service?.type,
          amount: service?.totalAmount,
          metadata: service?.metadata
        };
      });

      const { data, error } = await supabase.functions.invoke('create-coingate-payment', {
        body: {
          serviceType: 'commercial_flight',
          serviceId: selectedFlight.offerId,
          userId: user?.id || 'guest',
          email: passengers[0].email || user?.email || '',
          contactName: `${passengers[0].givenName} ${passengers[0].familyName}`,
          contactPhone: passengers[0].phone,
          passengers: searchParams.passengers,
          priceUSD: finalTotal,
          serviceTitle: `${selectedFlight.departure.airport} → ${selectedFlight.arrival.airport}`,
          serviceDescription: `${selectedFlight.airline.name} ${selectedFlight.flightNumber} on ${formatDate(selectedFlight.departure.time)}${selectedServices.length > 0 ? ` + ${selectedServices.length}x Extra Gepäck` : ''}`,
          isGuestCheckout: !user,
          flightData: {
            offerId: selectedFlight.offerId,
            origin: selectedFlight.departure.airport,
            destination: selectedFlight.arrival.airport,
            departure_date: selectedFlight.departure.time,
            return_date: selectedFlight.returnJourney?.departure?.time || null,
            airline: selectedFlight.airline.name,
            flightNumber: selectedFlight.flightNumber,
            cabinClass: selectedFlight.cabinClass,
            passengers: passengers.map(p => ({
              givenName: p.givenName,
              familyName: p.familyName,
              gender: p.gender,
              email: p.email,
              bornOn: p.bornOn
            })),
            segments: selectedFlight.segments,
            baggage: selectedFlight.baggage,
            conditions: selectedFlight.conditions,
            // Extra services (baggage)
            selectedServices: selectedServicesData
          }
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to create payment');

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setBookingError(err.message || 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get extra baggage options from loaded services
  const extraBaggageOptions = loadedServices;

  // Calculate extra services total
  const selectedServicesTotal = selectedServices.reduce((sum, serviceId) => {
    const service = loadedServices.find(s => s.id === serviceId);
    return sum + (service?.totalAmount || 0);
  }, 0);

  // Pricing calculations
  const basePrice = selectedFlight?.price.amount || 0;
  const extrasPrice = Math.round(selectedServicesTotal * 1.20 * 100) / 100; // 20% markup on extras
  const subtotal = basePrice + extrasPrice;
  const vatAmount = Math.round(subtotal * 0.081 * 100) / 100;
  const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;
  const pvcxReward = (totalAmount * 0.015).toFixed(2);
  const currency = selectedFlight?.price.currency === 'USD' ? '$' : (selectedFlight?.price.currency || '$');

  // Toggle service selection
  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // ========== BOOKING VIEW ==========
  if (selectedFlight) {
    return (
      <div className="w-full">
        {/* Back Button & Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{currentStep === 'review' ? 'Back to search' : 'Back'}</span>
          </button>

          <div className="text-sm text-gray-500">
            {selectedFlight.departure.airport} → {selectedFlight.arrival.airport}
            <span className="mx-2">·</span>
            {formatDate(selectedFlight.departure.time)}
          </div>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isPast = STEPS.findIndex(s => s.id === currentStep) > index;

            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                      isActive || isPast
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isPast ? <Check size={14} /> : index + 1}
                  </div>
                  <span className={`text-sm ${isActive ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-12 h-px ${isPast ? 'bg-gray-900' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Error Message */}
        {bookingError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{bookingError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Review */}
            {currentStep === 'review' && (
              <>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200">
                      {selectedFlight.airline.logoUrl ? (
                        <img src={selectedFlight.airline.logoUrl} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        <Plane size={20} className="text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedFlight.airline.name}</h3>
                      <p className="text-sm text-gray-500">{selectedFlight.flightNumber} · {selectedFlight.cabinClassName || selectedFlight.cabinClass}</p>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{formatTime(selectedFlight.departure.time)}</p>
                      <p className="text-base font-medium text-gray-700 mt-1">{selectedFlight.departure.airport}</p>
                      <p className="text-sm text-gray-500">{selectedFlight.departure.city}</p>
                    </div>
                    <div className="flex-1 mx-6 flex flex-col items-center">
                      <p className="text-sm text-gray-500 mb-2">{selectedFlight.duration}</p>
                      <div className="w-full flex items-center">
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                        <div className="flex-1 h-px bg-gray-300" />
                        <Plane size={14} className="text-gray-400 rotate-90 mx-1" />
                        <div className="flex-1 h-px bg-gray-300" />
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {selectedFlight.stops === 0 ? 'Direct' : `${selectedFlight.stops} stop`}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{formatTime(selectedFlight.arrival.time)}</p>
                      <p className="text-base font-medium text-gray-700 mt-1">{selectedFlight.arrival.airport}</p>
                      <p className="text-sm text-gray-500">{selectedFlight.arrival.city}</p>
                    </div>
                  </div>

                  <p className="text-center text-sm text-gray-500">
                    {formatFullDate(selectedFlight.departure.time)}
                  </p>
                </div>

                {/* Return Journey */}
                {selectedFlight.returnJourney && (
                  <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Return Flight</p>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{formatTime(selectedFlight.returnJourney.departure?.time)}</p>
                        <p className="text-sm text-gray-600">{selectedFlight.returnJourney.departure?.airport}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-px bg-gray-300" />
                        <Plane size={12} className="text-gray-400 rotate-90" />
                        <div className="w-6 h-px bg-gray-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{formatTime(selectedFlight.returnJourney.arrival?.time)}</p>
                        <p className="text-sm text-gray-600">{selectedFlight.returnJourney.arrival?.airport}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Flight Details */}
                <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 border-b border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Passengers</p>
                    <p className="text-sm font-medium text-gray-900">{searchParams.passengers} Adult{searchParams.passengers > 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Cabin</p>
                    <p className="text-sm font-medium text-gray-900">{selectedFlight.cabinClassName || selectedFlight.cabinClass}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Flexibility</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedFlight.conditions?.refundable ? 'Refundable' : 'Non-refundable'}
                    </p>
                  </div>
                </div>

                {/* Included Baggage */}
                <div className="p-6">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Inkludiertes Gepäck</p>
                  <div className="space-y-2">
                    {/* Cabin Baggage */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Check size={14} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedFlight.baggage?.cabinBags || 1}x Handgepäck
                        </p>
                        <p className="text-xs text-gray-500">Cabin bag inkludiert</p>
                      </div>
                    </div>

                    {/* Checked Baggage - if included */}
                    {(selectedFlight.baggage?.checkedBags || 0) > 0 ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Check size={14} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedFlight.baggage?.checkedBags}x Aufgabegepäck
                          </p>
                          <p className="text-xs text-gray-500">
                            {selectedFlight.baggage?.checkedBagWeight
                              ? `${selectedFlight.baggage.checkedBagWeight}kg pro Stück`
                              : '23kg pro Stück'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Luggage size={14} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Kein Aufgabegepäck</p>
                          <p className="text-xs text-gray-400">Nicht im Preis inkludiert</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Extra Baggage Options */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Luggage size={18} />
                    Extra Gepäck hinzufügen
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">Optional: Zusätzliches Aufgabegepäck buchen</p>
                </div>
                <div className="p-4">
                  {isLoadingServices ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 size={24} className="animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">Gepäck-Optionen werden geladen...</span>
                    </div>
                  ) : extraBaggageOptions.length > 0 ? (
                    <div className="space-y-2">
                      {extraBaggageOptions.map((service) => {
                        const isSelected = selectedServices.includes(service.id);
                        const priceWithMarkup = Math.round(service.totalAmount * 1.20 * 100) / 100;
                        return (
                          <button
                            key={service.id}
                            onClick={() => toggleService(service.id)}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                              isSelected
                                ? 'border-gray-900 bg-gray-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                              }`}>
                                {isSelected && <Check size={12} className="text-white" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  1x Aufgabegepäck
                                </p>
                                <p className="text-xs text-gray-500">
                                  {service.metadata?.maximumWeightKg
                                    ? `${service.metadata.maximumWeightKg}kg`
                                    : '23kg'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                +{currency}{priceWithMarkup.toFixed(2)}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-sm text-gray-500">
                      <p>Für diesen Flug ist kein zusätzliches Gepäck buchbar.</p>
                      <p className="text-xs text-gray-400 mt-1">Das inkludierte Gepäck ist oben aufgeführt.</p>
                    </div>
                  )}
                </div>
              </div>
              </>
            )}

            {/* Step 2: Passengers */}
            {currentStep === 'passengers' && (
              <div className="space-y-4">
                {passengers.map((passenger, index) => (
                  <div key={index} className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">Passenger {index + 1}</h3>
                        <p className="text-xs text-gray-500">
                          {index === 0 ? 'Lead passenger' : 'Enter details as on travel document'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={passenger.givenName}
                          onChange={(e) => updatePassenger(index, 'givenName', e.target.value)}
                          placeholder="As on passport"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={passenger.familyName}
                          onChange={(e) => updatePassenger(index, 'familyName', e.target.value)}
                          placeholder="As on passport"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={passenger.gender}
                          onChange={(e) => updatePassenger(index, 'gender', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Date of Birth <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={passenger.bornOn}
                          onChange={(e) => updatePassenger(index, 'bornOn', e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {index === 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            <Mail size={12} className="inline mr-1" /> Email
                          </label>
                          <input
                            type="email"
                            value={passenger.email}
                            onChange={(e) => updatePassenger(index, 'email', e.target.value)}
                            placeholder="For booking confirmation"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            <Phone size={12} className="inline mr-1" /> Phone
                          </label>
                          <input
                            type="tel"
                            value={passenger.phone}
                            onChange={(e) => updatePassenger(index, 'phone', e.target.value)}
                            placeholder="+1 234 567 8900"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 'payment' && (
              <div className="space-y-4">
                {/* Flight Summary */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200">
                      {selectedFlight.airline.logoUrl ? (
                        <img src={selectedFlight.airline.logoUrl} alt="" className="w-6 h-6 object-contain" />
                      ) : (
                        <Plane size={16} className="text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedFlight.airline.name}</p>
                      <p className="text-xs text-gray-500">{selectedFlight.flightNumber} · {formatDate(selectedFlight.departure.time)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">{selectedFlight.departure.airport}</p>
                      <p className="text-xs text-gray-500">{formatTime(selectedFlight.departure.time)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-px bg-gray-300" />
                      <Plane size={12} className="text-gray-400 rotate-90" />
                      <div className="w-8 h-px bg-gray-300" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">{selectedFlight.arrival.airport}</p>
                      <p className="text-xs text-gray-500">{formatTime(selectedFlight.arrival.time)}</p>
                    </div>
                  </div>
                </div>

                {/* Travelers */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Travelers</p>
                  <div className="space-y-2">
                    {passengers.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                            <User size={12} className="text-gray-500" />
                          </div>
                          <span className="text-sm text-gray-900">{p.givenName} {p.familyName}</span>
                        </div>
                        <span className="text-xs text-gray-500">Adult</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Wallet size={18} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Pay with Cryptocurrency</p>
                      <p className="text-sm text-gray-500 mt-1">
                        70+ cryptocurrencies including BTC, ETH, USDC, USDT
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  By proceeding, you agree to our Terms of Service.
                  {!selectedFlight.conditions?.refundable && ' This booking is non-refundable.'}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - Price Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 sticky top-4">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Price Summary</h3>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Flug ({searchParams.passengers} × {currency}{(basePrice / searchParams.passengers).toFixed(0)})
                  </span>
                  <span className="text-gray-900">{currency}{basePrice.toLocaleString()}</span>
                </div>

                {/* Extra Services */}
                {extrasPrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Extra Gepäck ({selectedServices.length}x)
                    </span>
                    <span className="text-gray-900">{currency}{extrasPrice.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">MwSt. (8.1%)</span>
                  <span className="text-gray-900">{currency}{vatAmount.toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">Total</span>
                    <span className="text-xl font-bold text-gray-900">
                      {currency}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* PVCX Reward */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mt-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-gray-600" />
                    <span className="text-sm text-gray-600">Reward</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">+{pvcxReward} PVCX</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <button
                  onClick={handleNext}
                  disabled={isProcessing}
                  className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : currentStep === 'payment' ? (
                    <>
                      Proceed to Payment
                      <ChevronRight size={18} />
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>
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
      {/* Header */}
      <h2 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight mb-2">Commercial Flights</h2>
      <p className="text-gray-500 text-sm mb-6">Search and book flights with crypto payments</p>

      {/* Journey Type Pills */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'one-way', label: 'One way' },
          { id: 'return', label: 'Return' },
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => setSearchParams(prev => ({ ...prev, journeyType: type.id as any }))}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              searchParams.journeyType === type.id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow p-2 mb-6">
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
                  setSearchParams(prev => ({ ...prev, origin: e.target.value }));
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
                  setSearchParams(prev => ({ ...prev, destination: e.target.value }));
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
          <div className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200">
            <label className="block text-xs font-medium text-gray-900 mb-1">Departure</label>
            <input
              type="date"
              value={searchParams.departureDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSearchParams(prev => ({ ...prev, departureDate: e.target.value }))}
              className="w-full text-sm text-gray-600 bg-transparent outline-none"
            />
          </div>

          {/* Return Date */}
          {searchParams.journeyType !== 'one-way' && (
            <div className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200">
              <label className="block text-xs font-medium text-gray-900 mb-1">Return</label>
              <input
                type="date"
                value={searchParams.returnDate}
                min={searchParams.departureDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => setSearchParams(prev => ({ ...prev, returnDate: e.target.value }))}
                className="w-full text-sm text-gray-600 bg-transparent outline-none"
              />
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
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <option key={num} value={num}>{num} adult{num > 1 ? 's' : ''}</option>
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

      {/* Error Message */}
      {searchError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{searchError}</p>
        </div>
      )}

      {/* Featured Destinations - Swiss/Edelweiss Style */}
      {!hasSearched && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Popular Destinations from Zurich</h3>
              <p className="text-sm text-gray-500">Prices for round trip, incl. taxes</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {featuredDestinations.map((dest) => (
              <button
                key={dest.id}
                onClick={() => handleFeaturedClick(dest)}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl text-left"
              >
                {/* Full Background Image */}
                <img
                  src={dest.image}
                  alt={dest.destinationCity}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

                {/* Content */}
                <div className="relative h-full flex flex-col justify-between p-4">
                  {/* Top - Route */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/70 tracking-wide">
                      {dest.origin} → {dest.destination}
                    </span>
                  </div>

                  {/* Bottom - City & Price */}
                  <div>
                    <h4 className="text-2xl font-bold text-white mb-0.5 tracking-tight">
                      {dest.destinationCity}
                    </h4>
                    <p className="text-sm text-white/60 mb-3">{dest.country}</p>

                    {/* Price */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-white/50 mb-0.5">from</p>
                        {dest.isLoading ? (
                          <div className="w-20 h-7 bg-white/20 rounded animate-pulse" />
                        ) : dest.price ? (
                          <p className="text-2xl font-bold text-white">
                            <span className="text-base font-normal text-white/70">
                              {dest.currency === 'USD' ? '$' : dest.currency}
                            </span>
                            {dest.price.toLocaleString()}
                          </p>
                        ) : (
                          <p className="text-sm text-white/50">—</p>
                        )}
                      </div>

                      {/* Arrow */}
                      <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <ArrowRight size={16} className="text-white group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

{/* Trust Badge - Hidden per request
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Check size={16} className="text-green-500" />
              <span>Real Live Prices</span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-gray-400" />
              <span>70+ Cryptocurrencies</span>
            </div>
            <div className="flex items-center gap-2">
              <Plane size={16} className="text-gray-400" />
              <span>300+ Airlines</span>
            </div>
          </div>
          */}
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <div>
          {isSearching ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-16 h-16">
                <video autoPlay loop muted playsInline className="w-full h-full object-contain">
                  <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          ) : flights.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Plane size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No flights found</h3>
              <p className="text-gray-500">Try different dates or destinations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(() => {
                const totalPages = Math.ceil(flights.length / FLIGHTS_PER_PAGE);
                const startIndex = (currentPage - 1) * FLIGHTS_PER_PAGE;
                const endIndex = startIndex + FLIGHTS_PER_PAGE;
                const paginatedFlights = flights.slice(startIndex, endIndex);

                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-500">
                        {flights.length} flight{flights.length !== 1 ? 's' : ''} found
                        {flights.length > FLIGHTS_PER_PAGE && (
                          <span className="ml-1">· Showing {startIndex + 1}-{Math.min(endIndex, flights.length)}</span>
                        )}
                      </p>
                    </div>

                    {paginatedFlights.map((flight) => (
                      <div
                        key={flight.offerId}
                        onClick={() => handleFlightSelect(flight)}
                        className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {flight.airline?.logoUrl ? (
                              <img src={flight.airline.logoUrl} alt={flight.airline.name} className="w-10 h-10 object-contain" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <Plane size={20} className="text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">{formatTime(flight.departure?.time)}</span>
                                <ArrowRight size={14} className="text-gray-400" />
                                <span className="font-semibold text-gray-900">{formatTime(flight.arrival?.time)}</span>
                              </div>
                              <div className="text-sm text-gray-500">
                                {flight.departure?.city || flight.departure?.airport} ({flight.departure?.airport}) - {flight.arrival?.city || flight.arrival?.airport} ({flight.arrival?.airport})
                              </div>
                            </div>
                          </div>

                          <div className="text-center hidden sm:block">
                            <div className="text-xs text-gray-500 mb-1">{flight.duration}</div>
                            <div className="text-xs text-gray-400">
                              {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              {flight.price.currency} {flight.price.amount.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">{flight.airline?.name}</div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-4">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ArrowLeft size={16} />
                        </button>

                        {/* Page numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                              // Show first, last, current, and adjacent pages
                              if (page === 1 || page === totalPages) return true;
                              if (Math.abs(page - currentPage) <= 1) return true;
                              return false;
                            })
                            .map((page, idx, arr) => (
                              <React.Fragment key={page}>
                                {idx > 0 && arr[idx - 1] !== page - 1 && (
                                  <span className="px-2 text-gray-400">...</span>
                                )}
                                <button
                                  onClick={() => setCurrentPage(page)}
                                  className={`w-9 h-9 text-sm rounded-lg transition-colors ${
                                    currentPage === page
                                      ? 'bg-gray-900 text-white'
                                      : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            ))}
                        </div>

                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
