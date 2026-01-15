import React, { useState, useEffect } from 'react';
import {
  X, Plane, Users, Calendar, Clock, ChevronRight, ChevronLeft,
  Check, Luggage, ArrowRight, Wallet, Loader2, AlertCircle,
  User, Mail, Phone, CreditCard, Shield, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import SeatMapSelector from './SeatMapSelector';

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

interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  passengers: number;
  cabinClass: string;
  journeyType: 'one-way' | 'return' | 'multi-city';
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

interface FlightBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: FlightOffer;
  searchParams: SearchParams;
  onBookingComplete: () => void;
}

type BookingStep = 'review' | 'passengers' | 'seats' | 'payment' | 'success';

export default function FlightBookingModal({
  isOpen,
  onClose,
  flight,
  searchParams,
  onBookingComplete,
}: FlightBookingModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<BookingStep>('review');
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<SeatSelection[]>([]);
  const [seatMapAvailable, setSeatMapAvailable] = useState(false);
  const [isLoadingSeatMap, setIsLoadingSeatMap] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [bookingReference, setBookingReference] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Initialize passengers array based on search params
  useEffect(() => {
    if (isOpen) {
      const initialPassengers: Passenger[] = [];
      for (let i = 0; i < searchParams.passengers; i++) {
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
      setStep('review');
      setSelectedSeats([]);
      setError('');
      setShowLoginPrompt(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, searchParams.passengers, user]);

  // Calculate pricing
  const basePrice = flight.price.amount;
  const vatAmount = Math.round(basePrice * 0.081 * 100) / 100;
  const seatPrice = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
  const totalAmount = Math.round((basePrice + vatAmount + seatPrice) * 100) / 100;
  const pvcxReward = (totalAmount * 0.015).toFixed(2);
  const currency = flight.price.currency === 'USD' ? '$' : flight.price.currency;

  // Check seat map availability
  const checkSeatMap = async () => {
    setIsLoadingSeatMap(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-seat-map', {
        body: { offerId: flight.offerId }
      });

      if (error) throw error;
      setSeatMapAvailable(data?.available || false);
    } catch (err) {
      console.error('Error checking seat map:', err);
      setSeatMapAvailable(false);
    } finally {
      setIsLoadingSeatMap(false);
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleContinue = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    switch (step) {
      case 'review':
        setStep('passengers');
        break;
      case 'passengers':
        // Validate passengers
        const isValid = passengers.every(p =>
          p.givenName && p.familyName && p.bornOn && p.gender
        );
        if (!isValid) {
          setError('Please fill in all required passenger details');
          return;
        }
        // Check seat map availability then proceed
        checkSeatMap().then(() => {
          if (seatMapAvailable) {
            setStep('seats');
          } else {
            setStep('payment');
          }
        });
        break;
      case 'seats':
        setStep('payment');
        break;
      case 'payment':
        handlePayment();
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'passengers':
        setStep('review');
        break;
      case 'seats':
        setStep('passengers');
        break;
      case 'payment':
        if (seatMapAvailable) {
          setStep('seats');
        } else {
          setStep('passengers');
        }
        break;
    }
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: string) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handlePayment = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Create payment via CoinGate
      const { data, error } = await supabase.functions.invoke('create-coingate-payment', {
        body: {
          serviceType: 'commercial_flight',
          serviceId: flight.offerId,
          userId: user.id,
          email: passengers[0].email || user.email,
          contactName: `${passengers[0].givenName} ${passengers[0].familyName}`,
          contactPhone: passengers[0].phone,
          passengers: searchParams.passengers,
          priceUSD: totalAmount,
          serviceTitle: `${flight.departure.airport} → ${flight.arrival.airport}`,
          serviceDescription: `${flight.airline.name} ${flight.flightNumber} on ${formatDate(flight.departure.time)}`,
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
            selectedSeats: selectedSeats,
            baggage: flight.baggage,
            conditions: flight.conditions
          }
        }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create payment');
      }

      // Store booking ID and redirect to CoinGate
      setBookingId(data.bookingId);

      if (data.paymentUrl) {
        // Redirect to CoinGate payment page
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('No payment URL received');
      }

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoginRedirect = () => {
    onClose();
    navigate('/login', { state: { returnTo: window.location.pathname } });
  };

  if (!isOpen) return null;

  // Calculate offer expiry
  const expiresAt = new Date(flight.expiresAt);
  const now = new Date();
  const minutesUntilExpiry = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60)));
  const isExpiringSoon = minutesUntilExpiry < 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {step !== 'review' && step !== 'success' && (
              <button
                onClick={handleBack}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-gray-900">
              {step === 'review' && 'Flight Details'}
              {step === 'passengers' && 'Passenger Details'}
              {step === 'seats' && 'Select Seats'}
              {step === 'payment' && 'Review & Pay'}
              {step === 'success' && 'Booking Confirmed'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Login Prompt */}
          {showLoginPrompt && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800 mb-3">
                Please sign in to continue with your booking
              </p>
              <button
                onClick={handleLoginRedirect}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Expiry Warning */}
          {isExpiringSoon && step !== 'success' && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
              <Clock size={20} className="text-orange-500" />
              <p className="text-sm text-orange-700">
                This offer expires in {minutesUntilExpiry} minute{minutesUntilExpiry !== 1 ? 's' : ''}. Complete your booking soon.
              </p>
            </div>
          )}

          {/* Step 1: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              {/* Flight Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    {flight.airline.logoUrl ? (
                      <img
                        src={flight.airline.logoUrl}
                        alt={flight.airline.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <Plane size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{flight.airline.name}</p>
                    <p className="text-sm text-gray-500">{flight.flightNumber}</p>
                  </div>
                </div>

                {/* Outbound */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{formatTime(flight.departure.time)}</p>
                    <p className="text-sm font-medium text-gray-700">{flight.departure.airport}</p>
                    <p className="text-xs text-gray-500">{flight.departure.city}</p>
                  </div>
                  <div className="flex-1 mx-4 flex flex-col items-center">
                    <p className="text-xs text-gray-500 mb-1">{flight.duration}</p>
                    <div className="w-full flex items-center">
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                      <div className="flex-1 h-px bg-gray-300" />
                      <Plane size={14} className="text-gray-400 mx-1" />
                      <div className="flex-1 h-px bg-gray-300" />
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{formatTime(flight.arrival.time)}</p>
                    <p className="text-sm font-medium text-gray-700">{flight.arrival.airport}</p>
                    <p className="text-xs text-gray-500">{flight.arrival.city}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  <Calendar size={14} className="inline mr-1" />
                  {formatDate(flight.departure.time)}
                </p>

                {/* Return journey */}
                {flight.returnJourney && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-400 uppercase mb-2">Return</p>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{formatTime(flight.returnJourney.departure.time)}</p>
                        <p className="text-sm text-gray-600">{flight.returnJourney.departure.airport}</p>
                      </div>
                      <ArrowRight size={16} className="text-gray-400" />
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{formatTime(flight.returnJourney.arrival.time)}</p>
                        <p className="text-sm text-gray-600">{flight.returnJourney.arrival.airport}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Users size={16} />
                    <span className="text-sm">Passengers</span>
                  </div>
                  <p className="font-medium text-gray-900">{searchParams.passengers} Adult{searchParams.passengers > 1 ? 's' : ''}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <CreditCard size={16} />
                    <span className="text-sm">Cabin Class</span>
                  </div>
                  <p className="font-medium text-gray-900 capitalize">{flight.cabinClassName || flight.cabinClass}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Luggage size={16} />
                    <span className="text-sm">Baggage</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {flight.baggage.checkedBags > 0
                      ? `${flight.baggage.checkedBags} checked bag${flight.baggage.checkedBags > 1 ? 's' : ''}`
                      : 'Carry-on only'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Shield size={16} />
                    <span className="text-sm">Flexibility</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {flight.conditions.refundable ? 'Refundable' : 'Non-refundable'}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-medium text-gray-900 mb-3">Price Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Flight ({searchParams.passengers} x {currency}{flight.price.perPassenger.toLocaleString()})
                    </span>
                    <span className="text-gray-900">{currency}{basePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">VAT (8.1%)</span>
                    <span className="text-gray-900">{currency}{vatAmount.toLocaleString()}</span>
                  </div>
                  {seatPrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Seat selection</span>
                      <span className="text-gray-900">{currency}{seatPrice.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{currency}{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* PVCX Reward */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                <Sparkles size={20} className="text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-purple-900">Earn {pvcxReward} PVCX tokens</p>
                  <p className="text-xs text-purple-700">1.5% reward on your booking</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Passengers */}
          {step === 'passengers' && (
            <div className="space-y-6">
              {passengers.map((passenger, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 mb-4">
                    Passenger {index + 1} {index === 0 && '(Lead passenger)'}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={passenger.givenName}
                        onChange={(e) => updatePassenger(index, 'givenName', e.target.value)}
                        placeholder="As on passport"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={passenger.familyName}
                        onChange={(e) => updatePassenger(index, 'familyName', e.target.value)}
                        placeholder="As on passport"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender *
                      </label>
                      <select
                        value={passenger.gender}
                        onChange={(e) => updatePassenger(index, 'gender', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        value={passenger.bornOn}
                        onChange={(e) => updatePassenger(index, 'bornOn', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {index === 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={passenger.email}
                          onChange={(e) => updatePassenger(index, 'email', e.target.value)}
                          placeholder="For booking confirmation"
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={passenger.phone}
                          onChange={(e) => updatePassenger(index, 'phone', e.target.value)}
                          placeholder="+1 234 567 8900"
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passport Number (for international flights)
                    </label>
                    <input
                      type="text"
                      value={passenger.passportNumber || ''}
                      onChange={(e) => updatePassenger(index, 'passportNumber', e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Seats */}
          {step === 'seats' && (
            <SeatMapSelector
              offerId={flight.offerId}
              passengers={passengers}
              onSeatsSelected={setSelectedSeats}
              selectedSeats={selectedSeats}
            />
          )}

          {/* Step 4: Payment */}
          {step === 'payment' && (
            <div className="space-y-5">
              {/* Flight Summary Card */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Route Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                        {flight.airline.logoUrl ? (
                          <img src={flight.airline.logoUrl} alt="" className="w-5 h-5 object-contain" />
                        ) : (
                          <Plane size={14} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{flight.airline.name}</p>
                        <p className="text-xs text-gray-500">{flight.flightNumber} · {flight.cabinClassName}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(flight.departure.time)}</span>
                  </div>
                </div>

                {/* Route Details */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-xl font-semibold text-gray-900">{flight.departure.airport}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{flight.departure.city}</p>
                      <p className="text-sm font-medium text-gray-700 mt-1">{formatTime(flight.departure.time)}</p>
                    </div>
                    <div className="flex-1 mx-4 flex flex-col items-center">
                      <p className="text-xs text-gray-400 mb-1">{flight.duration}</p>
                      <div className="w-full flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        <div className="flex-1 h-px bg-gray-300" />
                        <Plane size={12} className="text-gray-400 mx-1 rotate-90" />
                        <div className="flex-1 h-px bg-gray-300" />
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {flight.stops === 0 ? 'Direct' : `${flight.stops} stop`}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-semibold text-gray-900">{flight.arrival.airport}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{flight.arrival.city}</p>
                      <p className="text-sm font-medium text-gray-700 mt-1">{formatTime(flight.arrival.time)}</p>
                    </div>
                  </div>

                  {/* Return Journey */}
                  {flight.returnJourney && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">Return</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{flight.returnJourney.departure.airport}</span>
                        <ArrowRight size={12} className="text-gray-400" />
                        <span className="font-medium text-gray-700">{flight.returnJourney.arrival.airport}</span>
                        <span className="text-gray-500 ml-2">{formatTime(flight.returnJourney.departure.time)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Booking Details Row */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-6 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Users size={12} className="text-gray-400" />
                    <span className="text-gray-600">{searchParams.passengers} passenger{searchParams.passengers > 1 ? 's' : ''}</span>
                  </div>
                  {selectedSeats.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">Seats:</span>
                      <span className="text-gray-700 font-medium">{selectedSeats.map(s => s.seatDesignator).join(', ')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Luggage size={12} className="text-gray-400" />
                    <span className="text-gray-600">
                      {flight.baggage.checkedBags > 0 ? `${flight.baggage.checkedBags} bag` : 'Cabin only'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Passengers Summary */}
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Travelers</p>
                <div className="space-y-2">
                  {passengers.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <User size={12} className="text-gray-500" />
                        </div>
                        <span className="text-gray-900">{p.givenName} {p.familyName}</span>
                      </div>
                      <span className="text-gray-500 text-xs">Adult</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Flight fare ({searchParams.passengers} × {currency}{flight.price.perPassenger.toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
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
                </div>
                <div className="px-4 py-3 bg-gray-900 flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total</span>
                  <span className="text-xl font-semibold text-white">{currency}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Wallet size={18} className="text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Pay with Cryptocurrency</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Choose from 70+ cryptocurrencies including BTC, ETH, USDC, USDT on the next screen
                    </p>
                  </div>
                </div>
              </div>

              {/* PVCX Reward */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-gray-600" />
                  <span className="text-sm text-gray-600">Booking reward</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">+{pvcxReward} PVCX</span>
              </div>

              {/* Terms */}
              <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                By proceeding, you agree to our Terms of Service and confirm that all passenger details are correct.
                Flight bookings are non-refundable unless otherwise stated.
              </p>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Booking Confirmed!</h3>
              <p className="text-gray-600 mb-6">
                Your flight has been booked successfully.
              </p>
              {bookingReference && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-500">Booking Reference</p>
                  <p className="text-2xl font-mono font-bold text-gray-900">{bookingReference}</p>
                </div>
              )}
              <button
                onClick={onBookingComplete}
                className="px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
              >
                View My Bookings
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'success' && (
          <div className="px-6 py-4 border-t border-gray-100 bg-white">
            <button
              onClick={handleContinue}
              disabled={isProcessing}
              className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating payment...
                </>
              ) : step === 'payment' ? (
                <>
                  Proceed to Payment · {currency}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
        )}
      </div>
    </div>
  );
}
