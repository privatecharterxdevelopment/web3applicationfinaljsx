import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Plane, Users, Calendar, Clock, ChevronRight, ChevronLeft, Check,
  Luggage, ArrowRight, Wallet, Loader2, AlertCircle, User, Shield,
  Sparkles, X, MapPin, CreditCard, Download, Mail, Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import LandingHeader from '../components/Landingpagenew/LandingHeader';
import Footer from '../components/Landingpagenew/Footer';

// Types
interface FlightOffer {
  id: string;
  offerId: string;
  offerRequestId: string;
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
  stopDetails: Array<{
    airport: string;
    city: string;
    duration: string | null;
  }>;
  segments: Array<{
    flightNumber: string;
    aircraft: string | null;
    departure: {
      airport: string;
      airportName: string;
      time: string;
      terminal: string | null;
    };
    arrival: {
      airport: string;
      airportName: string;
      time: string;
      terminal: string | null;
    };
    duration: string | null;
    cabinClass: string;
  }>;
  returnJourney: {
    departure: { airport: string; time: string };
    arrival: { airport: string; time: string };
    duration: string | null;
    stops: number;
  } | null;
  price: {
    amount: number;
    currency: string;
    perPassenger: number;
  };
  baggage: {
    checkedBags: number;
    cabinBags: number;
    checkedBagWeight: number | null;
  };
  cabinClass: string;
  cabinClassName: string;
  expiresAt: string;
  conditions: {
    refundable: boolean;
    changeable: boolean;
  };
  rawOffer: any;
}

interface Passenger {
  givenName: string;
  familyName: string;
  gender: 'male' | 'female';
  email: string;
  phone: string;
  bornOn: string;
  passportNumber?: string;
}

interface SeatSelection {
  passengerId: string;
  segmentId: string;
  seatId: string;
  seatDesignator: string;
  price?: number;
}

interface SeatElement {
  type: 'seat' | 'empty' | 'lavatory' | 'galley' | 'closet' | 'stairs' | 'bassinet';
  designator?: string;
  available?: boolean;
  serviceId?: string | null;
  price?: { amount: number; currency: string } | null;
  isWindow?: boolean;
  isAisle?: boolean;
  isMiddle?: boolean;
  isExtraLegroom?: boolean;
  isExitRow?: boolean;
}

interface SeatRow {
  rowNumber: string;
  sections: Array<{ elements: SeatElement[] }>;
}

interface Cabin {
  cabinClass: string;
  deckNumber: number;
  wingsStart?: string;
  wingsEnd?: string;
  rows: SeatRow[];
}

interface SeatMap {
  segmentId: string;
  flightNumber: string;
  departure: { airport: string; city: string; time: string };
  arrival: { airport: string; city: string; time: string };
  aircraft: string;
  cabins: Cabin[];
}

type BookingStep = 'review' | 'passengers' | 'seats' | 'payment';

const STEPS: { id: BookingStep; label: string; shortLabel: string }[] = [
  { id: 'review', label: 'Review Flight', shortLabel: 'Review' },
  { id: 'passengers', label: 'Passenger Details', shortLabel: 'Passengers' },
  { id: 'seats', label: 'Seat Selection', shortLabel: 'Seats' },
  { id: 'payment', label: 'Review & Pay', shortLabel: 'Payment' },
];

export default function FlightBooking() {
  const { offerId } = useParams<{ offerId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Get flight data from location state or fetch it
  const [flight, setFlight] = useState<FlightOffer | null>(location.state?.flight || null);
  const [passengerCount, setPassengerCount] = useState(
    parseInt(searchParams.get('passengers') || '1')
  );

  // Booking state
  const [currentStep, setCurrentStep] = useState<BookingStep>('review');
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<SeatSelection[]>([]);
  const [seatMaps, setSeatMaps] = useState<SeatMap[]>([]);
  const [seatMapAvailable, setSeatMapAvailable] = useState(false);
  const [isLoadingSeatMap, setIsLoadingSeatMap] = useState(false);
  const [activeSegment, setActiveSegment] = useState(0);
  const [activePassenger, setActivePassenger] = useState(0);

  // UI state
  const [isLoading, setIsLoading] = useState(!flight);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);

  // Initialize passengers
  useEffect(() => {
    const initialPassengers: Passenger[] = [];
    for (let i = 0; i < passengerCount; i++) {
      initialPassengers.push({
        givenName: i === 0 ? (user?.user_metadata?.full_name?.split(' ')[0] || '') : '',
        familyName: i === 0 ? (user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '') : '',
        gender: 'male',
        email: i === 0 ? (user?.email || '') : '',
        phone: '',
        bornOn: '',
        passportNumber: ''
      });
    }
    setPassengers(initialPassengers);
  }, [passengerCount, user]);

  // Fetch flight if not in state
  useEffect(() => {
    if (!flight && offerId) {
      // Try to get from localStorage cache
      const cached = localStorage.getItem(`flight_offer_${offerId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.expiresAt && new Date(parsed.expiresAt) > new Date()) {
            setFlight(parsed);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing cached flight:', e);
        }
      }
      setError('Flight offer not found or expired. Please search again.');
      setIsLoading(false);
    }
  }, [flight, offerId]);

  // Save flight to localStorage when loaded
  useEffect(() => {
    if (flight && offerId) {
      localStorage.setItem(`flight_offer_${offerId}`, JSON.stringify(flight));
    }
  }, [flight, offerId]);

  // Restore booking state after returning from login
  useEffect(() => {
    if (user) {
      const savedState = localStorage.getItem('flight_booking_return');
      if (savedState) {
        try {
          const { step, passengers: savedPassengers, selectedSeats: savedSeats } = JSON.parse(savedState);
          if (step) setCurrentStep(step);
          if (savedPassengers?.length) setPassengers(savedPassengers);
          if (savedSeats?.length) setSelectedSeats(savedSeats);
          // Clear saved state after restoring
          localStorage.removeItem('flight_booking_return');
        } catch (e) {
          console.error('Error restoring booking state:', e);
        }
      }
    }
  }, [user]);

  // Pricing calculations
  const basePrice = flight?.price.amount || 0;
  const vatAmount = Math.round(basePrice * 0.081 * 100) / 100;
  const seatPrice = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
  const totalAmount = Math.round((basePrice + vatAmount + seatPrice) * 100) / 100;
  const pvcxReward = (totalAmount * 0.015).toFixed(2);
  const currency = flight?.price.currency === 'USD' ? '$' : (flight?.price.currency || '$');

  // Helpers
  const formatTime = (isoString: string) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatFullDate = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Step navigation
  const goToStep = (step: BookingStep) => {
    setError(null);
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = async () => {
    setError(null);

    if (currentStep === 'review') {
      // No login required at review step - proceed to passengers
      goToStep('passengers');
    } else if (currentStep === 'passengers') {
      // Validate passengers
      const isValid = passengers.every(p => p.givenName && p.familyName && p.bornOn && p.gender);
      if (!isValid) {
        setError('Please fill in all required passenger details (name, gender, date of birth)');
        return;
      }
      // Check seat map availability
      await fetchSeatMap();
      goToStep('seats');
    } else if (currentStep === 'seats') {
      goToStep('payment');
    } else if (currentStep === 'payment') {
      await handlePayment();
    }
  };

  const handleBack = () => {
    setError(null);
    const stepIndex = STEPS.findIndex(s => s.id === currentStep);
    if (stepIndex > 0) {
      goToStep(STEPS[stepIndex - 1].id);
    }
  };

  // Fetch seat map
  const fetchSeatMap = async () => {
    if (!flight) return;
    setIsLoadingSeatMap(true);

    try {
      const { data, error } = await supabase.functions.invoke('get-seat-map', {
        body: { offerId: flight.offerId }
      });

      if (error) throw error;

      setSeatMapAvailable(data?.available || false);
      setSeatMaps(data?.seatMaps || []);
    } catch (err) {
      console.error('Error fetching seat map:', err);
      setSeatMapAvailable(false);
      setSeatMaps([]);
    } finally {
      setIsLoadingSeatMap(false);
    }
  };

  // Seat selection handlers
  const handleSeatClick = (seat: SeatElement, segmentId: string) => {
    if (!seat.available || !seat.designator) return;

    const passengerId = `passenger-${activePassenger}`;
    const existingSelection = selectedSeats.find(
      s => s.segmentId === segmentId && s.seatDesignator === seat.designator
    );

    if (existingSelection && existingSelection.passengerId !== passengerId) {
      return; // Seat taken by another passenger
    }

    let newSelections = selectedSeats.filter(
      s => !(s.segmentId === segmentId && s.passengerId === passengerId)
    );

    if (!existingSelection) {
      newSelections.push({
        passengerId,
        segmentId,
        seatId: seat.serviceId || '',
        seatDesignator: seat.designator,
        price: seat.price?.amount
      });

      if (activePassenger < passengers.length - 1) {
        setActivePassenger(activePassenger + 1);
      }
    }

    setSelectedSeats(newSelections);
  };

  const isSeatSelected = (seat: SeatElement, segmentId: string) => {
    return selectedSeats.some(s => s.segmentId === segmentId && s.seatDesignator === seat.designator);
  };

  const isCurrentPassengerSeat = (seat: SeatElement, segmentId: string) => {
    const passengerId = `passenger-${activePassenger}`;
    return selectedSeats.some(
      s => s.segmentId === segmentId && s.seatDesignator === seat.designator && s.passengerId === passengerId
    );
  };

  const getSeatClassName = (seat: SeatElement, segmentId: string) => {
    const base = 'w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium transition-all';

    if (seat.type !== 'seat') {
      if (seat.type === 'lavatory') return `${base} bg-blue-50 text-blue-400`;
      if (seat.type === 'galley') return `${base} bg-orange-50 text-orange-400`;
      return `${base} bg-transparent`;
    }

    if (!seat.available) {
      return `${base} bg-gray-100 text-gray-300 cursor-not-allowed`;
    }

    if (isSeatSelected(seat, segmentId)) {
      if (isCurrentPassengerSeat(seat, segmentId)) {
        return `${base} bg-gray-900 text-white ring-2 ring-gray-400`;
      }
      return `${base} bg-gray-700 text-white`;
    }

    if (seat.isExtraLegroom) {
      return `${base} bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer border-2 border-gray-300`;
    }

    return `${base} bg-gray-50 text-gray-600 hover:bg-gray-100 cursor-pointer border border-gray-200`;
  };

  // Payment handler
  const handlePayment = async () => {
    if (!flight) {
      setError('Flight data not available');
      return;
    }

    // Check if user needs to log in (not logged in and not guest checkout)
    if (!user && !isGuestCheckout) {
      setShowLoginModal(true);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('Creating payment for flight:', flight.offerId, 'Amount:', totalAmount, 'Guest:', isGuestCheckout);

      const { data, error } = await supabase.functions.invoke('create-coingate-payment', {
        body: {
          serviceType: 'commercial_flight',
          serviceId: flight.offerId,
          userId: user?.id || 'guest',
          email: passengers[0].email || user?.email || '',
          contactName: `${passengers[0].givenName} ${passengers[0].familyName}`,
          contactPhone: passengers[0].phone,
          passengers: passengerCount,
          priceUSD: totalAmount,
          serviceTitle: `${flight.departure.airport} → ${flight.arrival.airport}`,
          serviceDescription: `${flight.airline.name} ${flight.flightNumber} on ${formatDate(flight.departure.time)}`,
          isGuestCheckout: isGuestCheckout,
          flightData: {
            offerId: flight.offerId,
            origin: flight.departure.airport,
            destination: flight.arrival.airport,
            departure_date: flight.departure.time,
            return_date: flight.returnJourney?.departure.time || null,
            airline: flight.airline.name,
            flightNumber: flight.flightNumber,
            cabinClass: flight.cabinClass,
            passengers: passengers.map(p => ({
              givenName: p.givenName,
              familyName: p.familyName,
              gender: p.gender,
              email: p.email,
              bornOn: p.bornOn
            })),
            segments: flight.segments,
            selectedSeats,
            baggage: flight.baggage,
            conditions: flight.conditions
          }
        }
      });

      console.log('Payment response:', { data, error });

      // Handle Supabase function invoke errors
      if (error) {
        console.error('Supabase function error:', error);
        // Check if error message contains useful info
        const errorMsg = error.message || error.toString();
        if (errorMsg.includes('2XX')) {
          throw new Error('Payment service temporarily unavailable. Please try again.');
        }
        throw new Error(errorMsg);
      }

      // Handle application-level errors
      if (!data) {
        throw new Error('No response from payment service');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment');
      }

      if (data.paymentUrl) {
        console.log('Redirecting to payment:', data.paymentUrl);
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = err.message || 'Failed to process payment. Please try again.';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Update passenger
  const updatePassenger = (index: number, field: keyof Passenger, value: string) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading flight details...</p>
        </div>
      </div>
    );
  }

  // Error state - no flight
  if (!flight) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LandingHeader onGetStarted={() => navigate('/dashboard')} />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Flight Not Found</h1>
          <p className="text-gray-500 mb-6">{error || 'This flight offer may have expired. Please search again.'}</p>
          <button
            onClick={() => navigate('/flight-tickets')}
            className="px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            Search Flights
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // Expiry check
  const expiresAt = new Date(flight.expiresAt);
  const minutesUntilExpiry = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60)));
  const isExpiringSoon = minutesUntilExpiry < 15;

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingHeader onGetStarted={() => navigate('/dashboard')} />

      {/* Progress Header */}
      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Back button and title */}
          <div className="flex items-center justify-between py-4 border-b border-gray-100">
            <button
              onClick={() => currentStep === 'review' ? navigate(-1) : handleBack()}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline">{currentStep === 'review' ? 'Back to search' : 'Previous step'}</span>
            </button>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {flight.departure.airport} → {flight.arrival.airport}
              </p>
              <p className="text-xs text-gray-500">{formatDate(flight.departure.time)}</p>
            </div>
            <div className="w-24" />
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center py-4 gap-2 sm:gap-4">
            {STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isPast = STEPS.findIndex(s => s.id === currentStep) > index;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-gray-900 text-white'
                          : isPast
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isPast ? <Check size={14} /> : index + 1}
                    </div>
                    <span className={`text-sm hidden sm:inline ${isActive ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {step.shortLabel}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-8 sm:w-12 h-px ${isPast ? 'bg-gray-900' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Expiry Warning */}
        {isExpiringSoon && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
            <Clock size={20} className="text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              This price expires in <strong>{minutesUntilExpiry} minutes</strong>. Complete your booking to secure it.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Review */}
            {currentStep === 'review' && (
              <>
                {/* Flight Card */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200">
                        {flight.airline.logoUrl ? (
                          <img src={flight.airline.logoUrl} alt="" className="w-10 h-10 object-contain" />
                        ) : (
                          <Plane size={24} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{flight.airline.name}</h2>
                        <p className="text-sm text-gray-500">{flight.flightNumber} · {flight.cabinClassName}</p>
                      </div>
                    </div>

                    {/* Outbound Route */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">{formatTime(flight.departure.time)}</p>
                        <p className="text-lg font-medium text-gray-700 mt-1">{flight.departure.airport}</p>
                        <p className="text-sm text-gray-500">{flight.departure.city}</p>
                      </div>
                      <div className="flex-1 mx-6 flex flex-col items-center">
                        <p className="text-sm text-gray-500 mb-2">{flight.duration}</p>
                        <div className="w-full flex items-center">
                          <div className="w-2 h-2 rounded-full bg-gray-300" />
                          <div className="flex-1 h-px bg-gray-300 relative">
                            {flight.stops > 0 && (
                              <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 rounded-full bg-gray-400" />
                            )}
                          </div>
                          <Plane size={16} className="text-gray-400 rotate-90 mx-2" />
                          <div className="flex-1 h-px bg-gray-300" />
                          <div className="w-2 h-2 rounded-full bg-gray-300" />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">{formatTime(flight.arrival.time)}</p>
                        <p className="text-lg font-medium text-gray-700 mt-1">{flight.arrival.airport}</p>
                        <p className="text-sm text-gray-500">{flight.arrival.city}</p>
                      </div>
                    </div>

                    <p className="text-center text-sm text-gray-500 mt-4">
                      {formatFullDate(flight.departure.time)}
                    </p>
                  </div>

                  {/* Return Journey */}
                  {flight.returnJourney && (
                    <div className="p-6 border-b border-gray-100 bg-gray-50">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Return Flight</p>
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-xl font-bold text-gray-900">{formatTime(flight.returnJourney.departure.time)}</p>
                          <p className="text-sm text-gray-600">{flight.returnJourney.departure.airport}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-px bg-gray-300" />
                          <Plane size={14} className="text-gray-400 rotate-90" />
                          <div className="w-8 h-px bg-gray-300" />
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-gray-900">{formatTime(flight.returnJourney.arrival.time)}</p>
                          <p className="text-sm text-gray-600">{flight.returnJourney.arrival.airport}</p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {flight.returnJourney.stops === 0 ? 'Non-stop' : `${flight.returnJourney.stops} stop`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Flight Details */}
                  <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Passengers</p>
                      <p className="text-sm font-medium text-gray-900">{passengerCount} Adult{passengerCount > 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Cabin</p>
                      <p className="text-sm font-medium text-gray-900">{flight.cabinClassName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Baggage</p>
                      <p className="text-sm font-medium text-gray-900">
                        {flight.baggage.checkedBags > 0 ? `${flight.baggage.checkedBags} checked` : 'Cabin only'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Flexibility</p>
                      <p className="text-sm font-medium text-gray-900">
                        {flight.conditions.refundable ? 'Refundable' : 'Non-refundable'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Segments Detail */}
                {flight.segments.length > 1 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Flight Segments</h3>
                    <div className="space-y-4">
                      {flight.segments.map((segment, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                            <Plane size={14} className="text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {segment.departure.airport} → {segment.arrival.airport}
                            </p>
                            <p className="text-xs text-gray-500">
                              {segment.flightNumber} · {segment.aircraft || 'Aircraft TBD'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-900">
                              {formatTime(segment.departure.time)} - {formatTime(segment.arrival.time)}
                            </p>
                            <p className="text-xs text-gray-500">{segment.duration}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Step 2: Passengers */}
            {currentStep === 'passengers' && (
              <div className="space-y-6">
                {passengers.map((passenger, index) => (
                  <div key={index} className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User size={18} className="text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          Passenger {index + 1}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {index === 0 ? 'Lead passenger - contact details required' : 'Enter details as shown on travel document'}
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
                            <Mail size={14} className="inline mr-1" />
                            Email
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
                            <Phone size={14} className="inline mr-1" />
                            Phone
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

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Passport Number <span className="text-xs text-gray-400">(for international flights)</span>
                      </label>
                      <input
                        type="text"
                        value={passenger.passportNumber || ''}
                        onChange={(e) => updatePassenger(index, 'passportNumber', e.target.value)}
                        placeholder="Optional"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Seats */}
            {currentStep === 'seats' && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {isLoadingSeatMap ? (
                  <div className="p-12 text-center">
                    <Loader2 size={32} className="text-gray-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading seat map...</p>
                  </div>
                ) : !seatMapAvailable || seatMaps.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plane size={28} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Seat Selection Unavailable</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Seat selection is not available for this flight. Seats will be assigned at check-in.
                    </p>
                    <button
                      onClick={() => goToStep('payment')}
                      className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
                    >
                      Continue to Payment
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Segment Tabs */}
                    {seatMaps.length > 1 && (
                      <div className="p-4 border-b border-gray-100 flex gap-2 overflow-x-auto">
                        {seatMaps.map((map, idx) => (
                          <button
                            key={map.segmentId}
                            onClick={() => setActiveSegment(idx)}
                            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                              activeSegment === idx
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {map.departure.airport} → {map.arrival.airport}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="p-6">
                      {/* Flight info */}
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <Plane size={18} className="text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{seatMaps[activeSegment]?.flightNumber}</p>
                            <p className="text-sm text-gray-500">{seatMaps[activeSegment]?.aircraft}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {seatMaps[activeSegment]?.departure.airport} → {seatMaps[activeSegment]?.arrival.airport}
                        </p>
                      </div>

                      {/* Passenger selector */}
                      <div className="mb-6">
                        <p className="text-sm font-medium text-gray-700 mb-2">Select seat for:</p>
                        <div className="flex gap-2 flex-wrap">
                          {passengers.map((p, idx) => {
                            const hasSelection = selectedSeats.some(
                              s => s.segmentId === seatMaps[activeSegment]?.segmentId && s.passengerId === `passenger-${idx}`
                            );
                            return (
                              <button
                                key={idx}
                                onClick={() => setActivePassenger(idx)}
                                className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                                  activePassenger === idx
                                    ? 'bg-gray-900 text-white'
                                    : hasSelection
                                    ? 'bg-gray-100 text-gray-700 border-2 border-gray-300'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {hasSelection && <Check size={14} />}
                                {p.givenName || `Passenger ${idx + 1}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap gap-4 mb-6 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-50 rounded border border-gray-200" />
                          <span className="text-gray-600">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-100 rounded" />
                          <span className="text-gray-600">Occupied</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-900 rounded" />
                          <span className="text-gray-600">Selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-100 rounded border-2 border-gray-300" />
                          <span className="text-gray-600">Extra legroom</span>
                        </div>
                      </div>

                      {/* Seat Map */}
                      <div className="bg-gray-50 rounded-xl p-6 overflow-x-auto">
                        <div className="flex flex-col items-center min-w-max">
                          <div className="w-24 h-10 bg-gray-200 rounded-t-full mb-6" />

                          {seatMaps[activeSegment]?.cabins.map((cabin, cabinIdx) => (
                            <div key={cabinIdx} className="mb-8">
                              <div className="text-center mb-4">
                                <span className="text-xs font-medium text-gray-500 uppercase px-3 py-1 bg-white rounded-full">
                                  {cabin.cabinClass}
                                </span>
                              </div>

                              {cabin.rows.map((row, rowIdx) => (
                                <div key={rowIdx} className="flex items-center gap-2 mb-1.5">
                                  <div className="w-6 text-center text-xs text-gray-400 font-medium">
                                    {row.rowNumber}
                                  </div>

                                  {row.sections.map((section, secIdx) => (
                                    <React.Fragment key={secIdx}>
                                      <div className="flex gap-1">
                                        {section.elements.map((element, elIdx) => (
                                          <div
                                            key={elIdx}
                                            onClick={() => element.type === 'seat' && handleSeatClick(element, seatMaps[activeSegment].segmentId)}
                                            className={getSeatClassName(element, seatMaps[activeSegment].segmentId)}
                                            title={
                                              element.type === 'seat'
                                                ? `${element.designator}${element.price ? ` - $${element.price.amount}` : ''}`
                                                : element.type
                                            }
                                          >
                                            {element.type === 'seat' ? (
                                              isSeatSelected(element, seatMaps[activeSegment].segmentId) ? (
                                                <Check size={14} />
                                              ) : element.available ? (
                                                element.designator?.slice(-1)
                                              ) : (
                                                <X size={12} />
                                              )
                                            ) : element.type === 'lavatory' ? (
                                              'WC'
                                            ) : element.type === 'galley' ? (
                                              'G'
                                            ) : null}
                                          </div>
                                        ))}
                                      </div>
                                      {secIdx < row.sections.length - 1 && <div className="w-8" />}
                                    </React.Fragment>
                                  ))}

                                  <div className="w-6 text-center text-xs text-gray-400 font-medium">
                                    {row.rowNumber}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}

                          <div className="w-20 h-8 bg-gray-200 rounded-b-lg mt-6" />
                        </div>
                      </div>

                      {/* Selected seats summary */}
                      {selectedSeats.filter(s => s.segmentId === seatMaps[activeSegment]?.segmentId).length > 0 && (
                        <div className="mt-6 p-4 bg-gray-100 rounded-xl">
                          <h4 className="font-medium text-gray-900 mb-2">Selected Seats</h4>
                          <div className="space-y-1">
                            {selectedSeats
                              .filter(s => s.segmentId === seatMaps[activeSegment]?.segmentId)
                              .map((seat, idx) => {
                                const pIdx = parseInt(seat.passengerId.split('-')[1]);
                                return (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                      {passengers[pIdx]?.givenName || `Passenger ${pIdx + 1}`} - Seat {seat.seatDesignator}
                                    </span>
                                    {seat.price && seat.price > 0 && (
                                      <span className="text-gray-900 font-medium">+${seat.price}</span>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Skip option */}
                      <div className="mt-6 text-center">
                        <button
                          onClick={() => {
                            setSelectedSeats([]);
                            goToStep('payment');
                          }}
                          className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                          Skip seat selection (assigned at check-in)
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 4: Payment */}
            {currentStep === 'payment' && (
              <div className="space-y-6">
                {/* Flight Summary */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                          {flight.airline.logoUrl ? (
                            <img src={flight.airline.logoUrl} alt="" className="w-6 h-6 object-contain" />
                          ) : (
                            <Plane size={16} className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{flight.airline.name}</p>
                          <p className="text-xs text-gray-500">{flight.flightNumber} · {flight.cabinClassName}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{formatDate(flight.departure.time)}</span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{flight.departure.airport}</p>
                        <p className="text-sm text-gray-500">{flight.departure.city}</p>
                        <p className="text-sm font-medium text-gray-700 mt-1">{formatTime(flight.departure.time)}</p>
                      </div>
                      <div className="flex-1 mx-6 flex flex-col items-center">
                        <p className="text-xs text-gray-400 mb-1">{flight.duration}</p>
                        <div className="w-full flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          <div className="flex-1 h-px bg-gray-300" />
                          <Plane size={12} className="text-gray-400 mx-1 rotate-90" />
                          <div className="flex-1 h-px bg-gray-300" />
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{flight.stops === 0 ? 'Direct' : `${flight.stops} stop`}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{flight.arrival.airport}</p>
                        <p className="text-sm text-gray-500">{flight.arrival.city}</p>
                        <p className="text-sm font-medium text-gray-700 mt-1">{formatTime(flight.arrival.time)}</p>
                      </div>
                    </div>

                    {flight.returnJourney && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">Return</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium text-gray-700">{flight.returnJourney.departure.airport}</span>
                          <ArrowRight size={12} className="text-gray-400" />
                          <span className="font-medium text-gray-700">{flight.returnJourney.arrival.airport}</span>
                          <span className="text-gray-500">{formatTime(flight.returnJourney.departure.time)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} className="text-gray-400" />
                      <span className="text-gray-600">{passengerCount} passenger{passengerCount > 1 ? 's' : ''}</span>
                    </div>
                    {selectedSeats.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">Seats:</span>
                        <span className="text-gray-700 font-medium">{selectedSeats.map(s => s.seatDesignator).join(', ')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Luggage size={12} className="text-gray-400" />
                      <span className="text-gray-600">{flight.baggage.checkedBags > 0 ? `${flight.baggage.checkedBags} bag` : 'Cabin only'}</span>
                    </div>
                  </div>
                </div>

                {/* Travelers */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Travelers</p>
                  <div className="space-y-3">
                    {passengers.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User size={14} className="text-gray-500" />
                          </div>
                          <span className="text-gray-900">{p.givenName} {p.familyName}</span>
                        </div>
                        <span className="text-xs text-gray-500">Adult</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Wallet size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Pay with Cryptocurrency</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Choose from 70+ cryptocurrencies including BTC, ETH, USDC, USDT on the payment page
                      </p>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  By proceeding, you agree to our Terms of Service and confirm that all passenger details are correct.
                  {!flight.conditions.refundable && ' This booking is non-refundable.'}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - Price Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 sticky top-[180px]">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Price Summary</h3>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Flight ({passengerCount} × {currency}{flight.price.perPassenger.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                  </span>
                  <span className="text-gray-900">{currency}{basePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>

                {seatPrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Seat selection</span>
                    <span className="text-gray-900">{currency}{seatPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">VAT (8.1%)</span>
                  <span className="text-gray-900">{currency}{vatAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">Total</span>
                    <span className="text-xl font-bold text-gray-900">
                      {currency}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  className="w-full py-3.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  ) : currentStep === 'seats' ? (
                    <>
                      Continue to Payment
                      <ChevronRight size={18} />
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>

                {currentStep === 'review' && !user && (
                  <p className="text-xs text-gray-500 text-center mt-3">
                    You'll need to sign in to continue
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Login Modal with Guest Option */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={32} className="text-gray-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to Continue</h2>
              <p className="text-sm text-gray-500">
                Sign in to save your booking to your dashboard and earn PVCX rewards.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  // Store booking state in localStorage so we can return after login
                  localStorage.setItem('flight_booking_return', JSON.stringify({
                    step: currentStep,
                    passengers,
                    selectedSeats
                  }));
                  navigate('/login', { state: { returnTo: location.pathname + location.search } });
                }}
                className="w-full px-4 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <User size={18} />
                Sign In
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsGuestCheckout(true);
                  setShowLoginModal(false);
                  // Proceed with payment as guest
                  setTimeout(() => handlePayment(), 100);
                }}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Continue as Guest
              </button>
              <p className="text-xs text-gray-400 text-center">
                Guest bookings won't be saved to your dashboard
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
