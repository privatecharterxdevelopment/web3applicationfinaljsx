import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, MapPin, Plane, Users, Calendar, Clock, ChevronLeft, ChevronRight,
  Check, Wifi, UtensilsCrossed, Car, Hotel, Shield, Star, Sparkles,
  Wallet, Building2, Loader2, X
} from 'lucide-react';
import { FixedOffer } from '../pages/FixedOffers';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface AdventureBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  adventure: FixedOffer;
}

type BookingStep = 'details' | 'dates' | 'guests' | 'payment' | 'success';

export default function AdventureBookingModal({
  isOpen,
  onClose,
  adventure,
}: AdventureBookingModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<BookingStep>('details');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [passengers, setPassengers] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialRequests: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'bank'>('crypto');
  const [selectedCrypto, setSelectedCrypto] = useState('USDC');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleBookNow = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setStep('dates');
  };

  const handleLoginRedirect = () => {
    onClose();
    navigate('/login', { state: { returnTo: window.location.pathname } });
  };

  useEffect(() => {
    if (isOpen) {
      setStep('details');
      setShowLoginPrompt(false);
      setCurrentImageIndex(0);
      setSelectedDate(null);
      setSelectedEndDate(null);
      setPassengers(1);
      setError('');
      setFormData({
        fullName: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
        email: user?.email || '',
        phone: '',
        specialRequests: ''
      });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, user]);

  if (!isOpen) return null;

  const images = [
    adventure.image_url,
    (adventure as any).image_url_2,
    (adventure as any).image_url_3,
    ...(adventure.gallery || [])
  ].filter(Boolean) as string[];

  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1540962351504-03099e0a754b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80');
  }

  const maxPassengers = adventure.max_passengers || adventure.passengers || 8;
  const isOnRequest = (adventure as any).price_on_request || !adventure.price || adventure.price === 0;
  const basePrice = adventure.price || 0;
  const pricePerPerson = (adventure as any).price_per_person;
  const totalPrice = pricePerPerson ? pricePerPerson * passengers : basePrice;
  const platformFee = Math.round(totalPrice * 0.025);
  const vatAmount = Math.round(totalPrice * 0.081);
  const finalTotal = totalPrice + platformFee + vatAmount;
  const pvcxReward = isOnRequest ? '0' : (finalTotal * 0.015).toFixed(2);
  const currency = adventure.currency === 'EUR' ? '€' : '$';

  // Check if this is a location-based adventure vs a flight route
  const isLocationBased = !adventure.destination || adventure.origin === adventure.destination;

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString() ||
           (selectedEndDate && date.toDateString() === selectedEndDate.toDateString());
  };

  const isInRange = (date: Date) => {
    if (!selectedDate || !selectedEndDate) return false;
    return date > selectedDate && date < selectedEndDate;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    if (!selectedDate || (selectedDate && selectedEndDate)) {
      setSelectedDate(date);
      setSelectedEndDate(null);
    } else {
      if (date < selectedDate) {
        setSelectedDate(date);
      } else {
        setSelectedEndDate(date);
      }
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Send notification
  const sendNotification = async (requestId: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      await fetch(`${supabaseUrl}/functions/v1/user-request-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({ record: { id: requestId } })
      });
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  };

  // Handle bank transfer request
  const handleBankRequest = async () => {
    if (!formData.fullName || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }
    setIsProcessing(true);
    setError('');

    try {
      const { data, error: dbError } = await supabase
        .from('user_requests')
        .insert([{
          user_id: user?.id || null,
          type: 'adventure_package',
          status: 'pending',
          client_name: formData.fullName,
          client_email: formData.email,
          client_phone: formData.phone,
          data: {
            offer_id: adventure.id,
            offer_title: adventure.title,
            offer_origin: adventure.origin,
            offer_destination: adventure.destination,
            offer_aircraft_type: adventure.aircraft_type,
            offer_image: adventure.image_url,
            selected_dates: { from: selectedDate?.toISOString(), to: selectedEndDate?.toISOString() },
            passengers,
            pricing: { base_price: basePrice, total: finalTotal, currency: adventure.currency },
            customer_details: { name: formData.fullName, email: formData.email, phone: formData.phone, special_requests: formData.specialRequests },
            payment_method: 'bank_transfer',
            pvcx_reward: pvcxReward
          }
        }])
        .select()
        .single();

      if (dbError) throw dbError;
      setBookingId(data.id);
      await sendNotification(data.id);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to create booking request.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle crypto payment
  const handleCryptoPayment = async () => {
    if (!formData.fullName || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }
    setIsProcessing(true);
    setError('');

    try {
      const { data: bookingData, error: dbError } = await supabase
        .from('user_requests')
        .insert([{
          user_id: user?.id || null,
          type: 'adventure_package',
          status: 'pending',
          client_name: formData.fullName,
          client_email: formData.email,
          client_phone: formData.phone,
          data: {
            offer_id: adventure.id,
            offer_title: adventure.title,
            offer_origin: adventure.origin,
            offer_destination: adventure.destination,
            offer_aircraft_type: adventure.aircraft_type,
            offer_image: adventure.image_url,
            selected_dates: { from: selectedDate?.toISOString(), to: selectedEndDate?.toISOString() },
            passengers,
            pricing: { base_price: basePrice, total: finalTotal, currency: adventure.currency },
            customer_details: { name: formData.fullName, email: formData.email, phone: formData.phone, special_requests: formData.specialRequests },
            payment_method: selectedCrypto,
            pvcx_reward: pvcxReward
          }
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/create-coingate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
        body: JSON.stringify({
          serviceType: 'fixed_offer',
          serviceId: adventure.id,
          userId: user?.id || 'anonymous',
          email: formData.email,
          contactName: formData.fullName,
          contactPhone: formData.phone,
          passengers,
          specialRequests: formData.specialRequests,
          priceUSD: finalTotal,
          currency: 'USD',
          serviceTitle: adventure.title,
          serviceDescription: `${adventure.origin} → ${adventure.destination || 'Multi-destination'}`,
          serviceImageUrl: adventure.image_url,
          metadata: { request_id: bookingData.id, offer_id: adventure.id }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const result = await response.json();
      if (result.success && result.paymentUrl) {
        await sendNotification(bookingData.id);
        window.open(result.paymentUrl, '_blank');
        setBookingId(bookingData.id);
        setStep('success');
      } else {
        throw new Error(result.error || 'Payment URL not received');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center gap-1 mb-5">
      {['dates', 'guests', 'payment'].map((s, idx) => (
        <React.Fragment key={s}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
            step === s ? 'bg-gray-900 text-white' :
            (step === 'guests' && s === 'dates') || (step === 'payment' && (s === 'dates' || s === 'guests')) || step === 'success'
              ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            {(step === 'guests' && s === 'dates') || (step === 'payment' && (s === 'dates' || s === 'guests')) || step === 'success'
              ? <Check size={12} /> : idx + 1}
          </div>
          {idx < 2 && <div className={`flex-1 h-px ${
            (step === 'guests' && s === 'dates') || (step === 'payment') || step === 'success' ? 'bg-gray-900' : 'bg-gray-200'
          }`} />}
        </React.Fragment>
      ))}
    </div>
  );

  // Right panel content based on step
  const renderRightContent = () => {
    if (step === 'success') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Check size={24} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-light text-gray-900 mb-2">
            {paymentMethod === 'crypto' ? 'Payment Initiated' : 'Request Submitted'}
          </h2>
          <p className="text-sm text-gray-500 font-light mb-4">
            {paymentMethod === 'crypto'
              ? 'Complete your payment in the new tab.'
              : `We'll contact you at ${formData.email} within 24 hours.`}
          </p>
          <div className="bg-gray-50 rounded-lg px-4 py-2 mb-4">
            <p className="text-[10px] text-gray-400 font-light">Reference</p>
            <p className="font-mono text-sm text-gray-900">{bookingId.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs mb-6">
            <Sparkles size={12} />
            <span className="font-light">+{pvcxReward} PVCX tokens</span>
          </div>
          <button
            onClick={() => { onClose(); navigate('/dashboard'); }}
            className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-light hover:bg-gray-800 transition-colors"
          >
            View Bookings
          </button>
        </div>
      );
    }

    if (step === 'details') {
      return (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <h1 className="text-xl font-light text-gray-900 mb-2">{adventure.title}</h1>
            <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
              <MapPin size={12} />
              <span className="font-light">
                {isLocationBased
                  ? (adventure.destination || adventure.origin || 'Exclusive Location')
                  : `${adventure.origin} → ${adventure.destination || 'Multi-stop'}`
                }
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 py-4 border-y border-gray-100 mb-4">
              {adventure.aircraft_type && !isLocationBased && (
                <div className="flex items-center gap-2">
                  <Plane size={14} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-light">Aircraft</p>
                    <p className="text-xs text-gray-900 font-light">{adventure.aircraft_type}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users size={14} className="text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-400 font-light">Participants</p>
                  <p className="text-xs text-gray-900 font-light">Up to {maxPassengers}</p>
                </div>
              </div>
              {adventure.duration && (
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-light">Duration</p>
                    <p className="text-xs text-gray-900 font-light">{adventure.duration}</p>
                  </div>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-500 font-light leading-relaxed mb-4 whitespace-pre-line">
              {adventure.description || 'Experience this exclusive adventure package curated by PrivateCharterX.'}
            </p>

            {(adventure.includes_wifi || adventure.includes_catering) && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-900 mb-2">Included</p>
                <div className="flex flex-wrap gap-2">
                  {adventure.includes_wifi && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      <Wifi size={10} /> WiFi
                    </span>
                  )}
                  {adventure.includes_catering && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      <UtensilsCrossed size={10} /> Catering
                    </span>
                  )}
                </div>
              </div>
            )}

            {!isOnRequest && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs">
                <Sparkles size={12} />
                <span className="font-light">Earn +{pvcxReward} PVCX</span>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                {isOnRequest ? (
                  <>
                    <span className="text-lg font-light text-gray-900">On Request</span>
                    <p className="text-[10px] text-gray-400 font-light">Contact us for pricing</p>
                  </>
                ) : (
                  <>
                    <span className="text-lg font-light text-gray-900">{currency}{finalTotal.toLocaleString()}</span>
                    <p className="text-[10px] text-gray-400 font-light">incl. VAT 8.1%</p>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={handleBookNow}
              className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-light hover:bg-gray-800 transition-colors"
            >
              {isOnRequest ? 'Request Quote' : 'Book Now'}
            </button>
          </div>
        </div>
      );
    }

    // Dates step
    if (step === 'dates') {
      return (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <button onClick={() => setStep('details')} className="flex items-center gap-1 text-gray-400 hover:text-gray-900 text-xs mb-4">
              <ArrowLeft size={12} /> Back
            </button>
            <StepIndicator />
            <h2 className="text-lg font-light text-gray-900 mb-1">Select dates</h2>
            <p className="text-xs text-gray-400 font-light mb-4">Choose your travel dates</p>

            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeft size={16} className="text-gray-600" />
              </button>
              <span className="text-sm font-light text-gray-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-1 hover:bg-gray-100 rounded">
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] text-gray-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {getDaysInMonth(currentMonth).map((date, idx) => {
                if (!date) return <div key={`e-${idx}`} className="h-8" />;
                const disabled = isDateDisabled(date);
                const selected = isDateSelected(date);
                const inRange = isInRange(date);
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateClick(date)}
                    disabled={disabled}
                    className={`h-8 rounded-full text-xs font-light transition-all
                      ${disabled ? 'text-gray-200' : 'hover:bg-gray-100'}
                      ${selected ? 'bg-gray-900 text-white' : ''}
                      ${inRange ? 'bg-gray-100' : ''}`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 font-light">From</p>
                <p className="text-sm text-gray-900 font-light">{formatDate(selectedDate)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 font-light">To</p>
                <p className="text-sm text-gray-900 font-light">{formatDate(selectedEndDate)}</p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4">
            <button
              onClick={() => setStep('guests')}
              disabled={!selectedDate}
              className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-light hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      );
    }

    // Guests step
    if (step === 'guests') {
      return (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <button onClick={() => setStep('dates')} className="flex items-center gap-1 text-gray-400 hover:text-gray-900 text-xs mb-4">
              <ArrowLeft size={12} /> Back
            </button>
            <StepIndicator />
            <h2 className="text-lg font-light text-gray-900 mb-1">Guest details</h2>
            <p className="text-xs text-gray-400 font-light mb-4">Who's traveling?</p>

            <div className="mb-4">
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-900 font-light">Passengers</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPassengers(Math.max(1, passengers - 1))} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 text-sm">-</button>
                  <span className="w-5 text-center text-sm">{passengers}</span>
                  <button onClick={() => setPassengers(Math.min(maxPassengers, passengers + 1))} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 text-sm">+</button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">Full name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-light focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-light focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-light focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4">
            <button
              onClick={() => setStep('payment')}
              disabled={!formData.fullName || !formData.email}
              className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-light hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      );
    }

    // Payment step
    if (step === 'payment') {
      return (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <button onClick={() => setStep('guests')} className="flex items-center gap-1 text-gray-400 hover:text-gray-900 text-xs mb-4">
              <ArrowLeft size={12} /> Back
            </button>
            <StepIndicator />
            <h2 className="text-lg font-light text-gray-900 mb-1">Payment</h2>
            <p className="text-xs text-gray-400 font-light mb-4">Choose payment method</p>

            <div className="space-y-2 mb-4">
              <button
                onClick={() => setPaymentMethod('crypto')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  paymentMethod === 'crypto' ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                }`}
              >
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <Wallet size={14} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-gray-900 font-light">Crypto</p>
                  <p className="text-[10px] text-gray-400 font-light">BTC, ETH, USDC & more</p>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'crypto' ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                }`}>
                  {paymentMethod === 'crypto' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('bank')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  paymentMethod === 'bank' ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                }`}
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building2 size={14} className="text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-gray-900 font-light">Bank Transfer</p>
                  <p className="text-[10px] text-gray-400 font-light">1-3 business days</p>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'bank' ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                }`}>
                  {paymentMethod === 'bank' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
              </button>
            </div>

            {paymentMethod === 'crypto' && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Select currency</p>
                <div className="flex gap-2">
                  {['BTC', 'ETH', 'USDC', 'USDT'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCrypto(c)}
                      className={`flex-1 py-1.5 rounded text-xs font-light transition-all ${
                        selectedCrypto === c ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500 font-light">Dates</span>
                <span className="text-gray-900 font-light">{formatDate(selectedDate)} - {formatDate(selectedEndDate)}</span>
              </div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-500 font-light">Participants</span>
                <span className="text-gray-900 font-light">{passengers}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-900 font-light">Total</span>
                <span className="text-gray-900 font-medium">
                  {isOnRequest ? 'On Request' : `${currency}${finalTotal.toLocaleString()}`}
                </span>
              </div>
              {!isOnRequest && <p className="text-[9px] text-gray-400 font-light text-right mt-1">incl. VAT 8.1%</p>}
            </div>

            {error && (
              <div className="p-2 bg-red-50 border border-red-100 rounded-lg mb-4">
                <p className="text-xs text-red-600 font-light">{error}</p>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4">
            <button
              onClick={paymentMethod === 'crypto' ? handleCryptoPayment : handleBankRequest}
              disabled={isProcessing}
              className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-light hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <><Loader2 size={14} className="animate-spin" /> Processing...</>
              ) : isOnRequest ? (
                'Submit Quote Request'
              ) : paymentMethod === 'crypto' ? (
                `Pay ${currency}${finalTotal.toLocaleString()}`
              ) : (
                'Submit Request'
              )}
            </button>
            <p className="text-[9px] text-gray-400 font-light text-center mt-2">
              By confirming, you agree to our Terms
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 sm:p-6 lg:p-10" style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div className="flex h-full max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] lg:max-h-[calc(100vh-5rem)] w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left - Image */}
        <div className="hidden lg:block lg:w-1/2 bg-gray-100 relative">
          <img
            src={images[currentImageIndex]}
            alt={adventure.title}
            className="w-full h-full object-cover"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white"
              >
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
          {adventure.is_featured && (
            <div className="absolute top-6 left-6">
              <span className="bg-white px-3 py-1.5 rounded-full text-xs font-medium text-gray-900 shadow-sm">Featured</span>
            </div>
          )}
        </div>

        {/* Right - Content */}
        <div className="w-full lg:w-1/2 flex flex-col h-full relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors z-10"
          >
            <X size={18} className="text-gray-500" />
          </button>

          {/* Mobile image */}
          <div className="lg:hidden h-48 bg-gray-100 relative flex-shrink-0">
            <img src={images[currentImageIndex]} alt={adventure.title} className="w-full h-full object-cover" />
          </div>

          {renderRightContent()}
        </div>
      </div>

      {/* Login Prompt */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-light text-gray-900 mb-2">Sign in to continue</h3>
            <p className="text-sm text-gray-500 font-light mb-6">Please sign in to book this adventure.</p>
            <div className="space-y-2">
              <button onClick={handleLoginRedirect} className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-light hover:bg-gray-800">Sign In</button>
              <button onClick={() => setShowLoginPrompt(false)} className="w-full py-2.5 text-gray-500 hover:text-gray-900 text-sm font-light">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
