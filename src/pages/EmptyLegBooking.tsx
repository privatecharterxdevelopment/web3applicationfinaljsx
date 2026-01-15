import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Plane, Users, Calendar, Clock, ArrowRight, MapPin, Bitcoin, CheckCircle, X, ChevronLeft, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import LandingHeader from '../components/Landingpagenew/LandingHeader';
import Footer from '../components/Landingpagenew/Footer';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';

interface EmptyLeg {
  id: string;
  from: string;
  to: string;
  from_iata: string;
  to_iata: string;
  from_city: string;
  to_city: string;
  from_country: string;
  to_country: string;
  aircraft_type: string;
  category: string;
  capacity: number;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  price_usd: number;
  currency: string;
  operator: string;
  image_url: string;
  flight_duration_hours: number;
  registration: string;
}

export default function EmptyLegBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const [emptyLeg, setEmptyLeg] = useState<EmptyLeg | null>(location.state?.emptyLeg || null);
  const [loading, setLoading] = useState(!location.state?.emptyLeg);
  const [passengers, setPassengers] = useState(location.state?.passengers || 1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Contact details
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Auth modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Load empty leg if not in state
  useEffect(() => {
    if (!emptyLeg && id) {
      loadEmptyLeg();
    }
  }, [id]);

  // Pre-fill contact details from user profile
  useEffect(() => {
    if (user) {
      setContactName(user.user_metadata?.full_name || user.user_metadata?.name || '');
      setContactEmail(user.email || '');
      setContactPhone(user.user_metadata?.phone || '');
    }
  }, [user]);

  const loadEmptyLeg = async () => {
    try {
      const { data, error } = await supabase
        .from('EmptyLegs_')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setEmptyLeg(data);
    } catch (err) {
      console.error('Error loading empty leg:', err);
      navigate('/empty-legs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'TBC';
    return timeStr.slice(0, 5);
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price || price === 0) return 'On Request';
    return `$${price.toLocaleString()}`;
  };

  const formatDuration = (hours: number | null | undefined) => {
    if (!hours) return '';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const handleCryptoCheckout = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!emptyLeg || !user) return;

    // Validate contact details
    if (!contactName.trim()) {
      alert('Please enter your full name');
      return;
    }
    if (!contactEmail.trim()) {
      alert('Please enter your email');
      return;
    }

    setIsProcessing(true);
    try {
      // Calculate price with VAT (8.1%)
      const basePrice = emptyLeg.price_usd || emptyLeg.price || 0;
      const priceWithVAT = Math.round(basePrice * 1.081);

      const { data, error } = await supabase.functions.invoke('create-coingate-payment', {
        body: {
          serviceType: 'empty_leg',
          serviceId: emptyLeg.id,
          userId: user.id,
          email: contactEmail || user.email,
          contactName: contactName,
          contactPhone: contactPhone,
          passengers: passengers,
          priceUSD: priceWithVAT,
          currency: 'USD',
          serviceTitle: `${emptyLeg.from_city || emptyLeg.from} → ${emptyLeg.to_city || emptyLeg.to}`,
          serviceDescription: `Empty Leg Flight - ${emptyLeg.aircraft_type || 'Private Jet'} | ${formatDate(emptyLeg.departure_date)}`,
          serviceImageUrl: emptyLeg.image_url
        }
      });

      if (error) throw error;

      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else if (data?.payment_url) {
        window.location.href = data.payment_url;
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error('No payment URL received');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      alert(err.message || 'Failed to create payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LandingHeader />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading flight details...</p>
        </div>
      </div>
    );
  }

  if (!emptyLeg) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LandingHeader />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">Flight not found</h2>
          <p className="text-gray-500 mb-6">This empty leg may no longer be available.</p>
          <button
            onClick={() => navigate('/empty-legs')}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Browse Empty Legs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingHeader />

      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4">
          <button
            onClick={() => navigate('/empty-legs')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft size={16} />
            Back to Empty Legs
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Flight Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Aircraft Image */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="aspect-[16/9] sm:aspect-[21/9] relative">
                <img
                  src={emptyLeg.image_url || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80'}
                  alt={emptyLeg.aircraft_type}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Save up to 75%
                  </span>
                </div>
              </div>
            </div>

            {/* Flight Route Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Flight Details</h2>

              <div className="flex items-center justify-between mb-8">
                {/* Departure */}
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{formatTime(emptyLeg.departure_time)}</p>
                  <p className="text-lg font-medium text-gray-700">{emptyLeg.from_iata || emptyLeg.from?.slice(0, 3)}</p>
                  <p className="text-sm text-gray-500">{emptyLeg.from_city || emptyLeg.from}</p>
                  {emptyLeg.from_country && (
                    <p className="text-xs text-gray-400">{emptyLeg.from_country}</p>
                  )}
                </div>

                {/* Flight Path */}
                <div className="flex-1 px-6">
                  <div className="relative flex items-center justify-center">
                    <div className="h-px bg-gray-300 absolute left-0 right-0" />
                    <div className="relative bg-white px-4">
                      <Plane className="w-6 h-6 text-gray-400 transform rotate-90" />
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-2">
                    {emptyLeg.flight_duration_hours ? formatDuration(emptyLeg.flight_duration_hours) : 'Direct'}
                  </p>
                </div>

                {/* Arrival */}
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{formatTime(emptyLeg.arrival_time)}</p>
                  <p className="text-lg font-medium text-gray-700">{emptyLeg.to_iata || emptyLeg.to?.slice(0, 3)}</p>
                  <p className="text-sm text-gray-500">{emptyLeg.to_city || emptyLeg.to}</p>
                  {emptyLeg.to_country && (
                    <p className="text-xs text-gray-400">{emptyLeg.to_country}</p>
                  )}
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-6">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatDate(emptyLeg.departure_date)}</p>
                  <p className="text-xs text-gray-500">Departure Date</p>
                </div>
              </div>

              {/* Aircraft & Capacity Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <Plane className="w-5 h-5 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900">{emptyLeg.aircraft_type || 'Private Jet'}</p>
                  <p className="text-xs text-gray-500">Aircraft</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <Users className="w-5 h-5 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900">{emptyLeg.capacity} passengers</p>
                  <p className="text-xs text-gray-500">Capacity</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <Shield className="w-5 h-5 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900">{emptyLeg.category || 'Jet'}</p>
                  <p className="text-xs text-gray-500">Category</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <Sparkles className="w-5 h-5 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900">{emptyLeg.operator || 'Charter Operator'}</p>
                  <p className="text-xs text-gray-500">Operator</p>
                </div>
              </div>
            </div>

            {/* What is an Empty Leg */}
            <div className="bg-green-50 rounded-2xl border border-green-200 p-6">
              <h3 className="text-sm font-medium text-green-800 mb-2">What is an Empty Leg?</h3>
              <p className="text-sm text-green-700">
                Empty leg flights occur when a private jet needs to reposition - flying without passengers to pick up the next client or return to base.
                This is your opportunity to fly private at a fraction of the regular charter price, with savings of up to 75%.
              </p>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-[96px]">
              <div className="mb-6">
                <p className="text-3xl font-bold text-gray-900">{formatPrice(emptyLeg.price_usd || emptyLeg.price)}</p>
                <p className="text-sm text-gray-500">Total charter price</p>
                <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Up to 75% off regular price
                </span>
              </div>

              {/* Contact Details */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              {/* Passengers */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Passengers</label>
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  {Array.from({ length: emptyLeg.capacity }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>{num} passenger{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Summary */}
              <div className="border-t border-gray-100 pt-4 mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Route</span>
                  <span className="text-gray-900 font-medium">
                    {emptyLeg.from_iata || emptyLeg.from?.slice(0, 3)} → {emptyLeg.to_iata || emptyLeg.to?.slice(0, 3)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-900 font-medium">{formatDate(emptyLeg.departure_date).split(',')[1]?.trim()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Aircraft</span>
                  <span className="text-gray-900 font-medium">{emptyLeg.aircraft_type}</span>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <Bitcoin className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-gray-900">Pay with Crypto</span>
                </div>
                <p className="text-xs text-gray-500">
                  BTC, ETH, USDC, USDT and 70+ cryptocurrencies accepted via CoinGate
                </p>
              </div>

              <button
                onClick={handleCryptoCheckout}
                disabled={isProcessing}
                className="w-full py-4 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Bitcoin size={18} />
                    Book Now - {formatPrice(emptyLeg.price_usd || emptyLeg.price)}
                  </>
                )}
              </button>

              {!isAuthenticated && (
                <p className="text-xs text-center text-gray-500 mt-3">
                  You'll need to sign in to complete your booking
                </p>
              )}

              <p className="text-xs text-gray-400 text-center mt-4">
                By booking, you agree to our terms and conditions.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
          onSuccess={() => {
            setShowLoginModal(false);
            handleCryptoCheckout();
          }}
        />
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
          onSuccess={() => {
            setShowRegisterModal(false);
          }}
        />
      )}
    </div>
  );
}
