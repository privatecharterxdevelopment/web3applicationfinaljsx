import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Check, Sparkles, ArrowRight, Download, Home, CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('booking_id');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const { data, error } = await supabase
        .from('user_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (!error && data) {
        setBooking(data);
      }
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price, currency = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Success Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 text-center relative overflow-hidden">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent pointer-events-none" />

          {/* Success Icon */}
          <div className="relative">
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
              <div className="relative w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Check className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-white/60 mb-6">Your booking has been confirmed</p>

            {/* PVCX Reward Banner */}
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <div className="text-left">
                  <p className="text-amber-400 font-bold text-lg">
                    +{booking ? (booking.total_amount * 0.015).toFixed(2) : '...'} $PVCX
                  </p>
                  <p className="text-white/60 text-sm">Reward tokens credited!</p>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
              </div>
            ) : booking ? (
              <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
                <h3 className="font-semibold text-white mb-3">{booking.service_title}</h3>
                <div className="space-y-2 text-sm">
                  {booking.origin && booking.destination && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Route</span>
                      <span className="text-white">{booking.origin} → {booking.destination}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-white/60">Amount Paid</span>
                    <span className="text-white font-semibold">
                      {formatPrice(booking.total_amount, booking.currency)}
                    </span>
                  </div>
                  {booking.crypto_amount && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Crypto</span>
                      <span className="text-white">
                        {parseFloat(booking.crypto_amount).toFixed(8)} {booking.crypto_currency}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-white/60">Booking ID</span>
                    <span className="text-white/80 font-mono text-xs">
                      {booking.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <p className="text-white/60">Booking details will appear here</p>
              </div>
            )}

            {/* Info Text */}
            <p className="text-white/50 text-sm mb-6">
              A confirmation email has been sent to your email address.
              You can view your booking details in "My Bookings".
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                to="/?category=bookings"
                className="w-full py-3 px-6 bg-white text-gray-900 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                View My Bookings
              </Link>
              <Link
                to="/"
                className="w-full py-3 px-6 bg-white/10 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        {/* Support Link */}
        <p className="text-center text-white/40 text-sm mt-6">
          Need help? <a href="mailto:support@privatecharterx.com" className="text-white/60 hover:text-white underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
