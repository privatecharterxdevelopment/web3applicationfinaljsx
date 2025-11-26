import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, Home, HelpCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PaymentCancelPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('booking_id');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleRetryPayment = () => {
    if (booking?.coingate_payment_url) {
      window.open(booking.coingate_payment_url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Cancel Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 text-center relative overflow-hidden">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent pointer-events-none" />

          {/* Cancel Icon */}
          <div className="relative">
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="relative w-full h-full bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center border-2 border-red-500/30">
                <XCircle className="w-12 h-12 text-red-400" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">Payment Cancelled</h1>
            <p className="text-white/60 mb-6">Your payment was not completed</p>

            {/* Booking Info */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
              </div>
            ) : booking ? (
              <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
                <h3 className="font-semibold text-white mb-2">{booking.service_title}</h3>
                <p className="text-white/60 text-sm">
                  Your booking is saved but not confirmed. You can complete the payment anytime before it expires.
                </p>
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Status</span>
                    <span className="text-yellow-400 font-medium">Pending Payment</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Help Text */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3 text-left">
                <HelpCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-300 font-medium text-sm">Why was my payment cancelled?</p>
                  <p className="text-white/60 text-xs mt-1">
                    This can happen if you closed the payment window, the payment timed out,
                    or there was an issue with the transaction. You can try again anytime.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {booking?.coingate_payment_url && booking?.payment_status === 'pending' && (
                <button
                  onClick={handleRetryPayment}
                  className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:from-amber-600 hover:to-orange-600 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Payment Again
                </button>
              )}
              <Link
                to="/"
                className="w-full py-3 px-6 bg-white/10 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </Link>
              <Link
                to="/?category=bookings"
                className="w-full py-3 px-6 bg-transparent text-white/60 font-medium rounded-xl flex items-center justify-center gap-2 hover:text-white hover:bg-white/5 transition-colors"
              >
                View Pending Bookings
              </Link>
            </div>
          </div>
        </div>

        {/* Support Link */}
        <p className="text-center text-white/40 text-sm mt-6">
          Having issues? <a href="mailto:support@privatecharterx.com" className="text-white/60 hover:text-white underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
};

export default PaymentCancelPage;
