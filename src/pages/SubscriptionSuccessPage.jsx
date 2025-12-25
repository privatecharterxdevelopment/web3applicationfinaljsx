import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Check, Crown, MessageSquare, Sparkles, Home, ArrowRight, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

const SubscriptionSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const tier = searchParams.get('tier') || searchParams.get('subscription');
  const sessionId = searchParams.get('session_id');

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'verifying', 'success', 'error'
  const [verificationError, setVerificationError] = useState(null);
  const [activatedTier, setActivatedTier] = useState(tier);
  const verificationAttempted = useRef(false);

  // Tier display info
  const tierInfo = {
    explorer: {
      name: 'Explorer',
      price: '$99',
      chats: '5 AI Chats',
      messages: '10 messages per chat',
      icon: '✈️'
    },
    traveller: {
      name: 'Traveller',
      price: '$299',
      chats: '10 AI Chats',
      messages: '25 messages per chat',
      icon: '🌍'
    },
    elite: {
      name: 'Elite Club',
      price: '$999',
      chats: 'Unlimited Chats',
      messages: 'Unlimited messages',
      icon: '👑'
    }
  };

  const currentTier = tierInfo[activatedTier] || tierInfo[tier] || tierInfo.explorer;

  // Verify subscription with Stripe session on page load
  useEffect(() => {
    const verifySubscription = async () => {
      // Only attempt verification once, when we have a session_id and user
      if (verificationAttempted.current || !sessionId) return;

      verificationAttempted.current = true;
      setVerificationStatus('verifying');

      try {
        console.log('Verifying subscription session:', sessionId);

        // Call the Supabase Edge Function to verify and activate subscription
        const { data, error } = await supabase.functions.invoke('verify-subscription-session', {
          body: {
            sessionId: sessionId,
            userId: user?.id
          }
        });

        if (error) {
          console.error('Verification error:', error);
          setVerificationStatus('error');
          setVerificationError(error.message);
          return;
        }

        if (data?.success) {
          console.log('Subscription verified and activated:', data);
          setVerificationStatus('success');
          if (data.tier) {
            setActivatedTier(data.tier);
          }
          // Reload subscription data after successful verification
          if (user?.id) {
            loadSubscription();
          }
        } else {
          console.error('Verification failed:', data?.error);
          setVerificationStatus('error');
          setVerificationError(data?.error || 'Verification failed');
        }
      } catch (err) {
        console.error('Failed to verify subscription:', err);
        setVerificationStatus('error');
        setVerificationError(err.message);
      }
    };

    // Small delay to ensure user auth is ready
    const timer = setTimeout(verifySubscription, 500);
    return () => clearTimeout(timer);
  }, [sessionId, user?.id]);

  useEffect(() => {
    // Trigger confetti animation
    const duration = 4 * 1000;
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
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1']
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1']
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadSubscription();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('subscription_tier, subscription_status, chats_limit, chats_used, current_period_start, current_period_end')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Success Card - Glassmorphic Light Style */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-xl p-8 text-center relative overflow-hidden">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/PCX_logo.png"
              alt="PrivateCharterX"
              className="h-8 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          {/* Success Icon */}
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-50" />
            <div className="relative w-full h-full bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-8 h-8 text-white" strokeWidth={3} />
            </div>
          </div>

          <h1 className="text-2xl font-light text-gray-900 mb-2">Welcome to {currentTier.name}!</h1>
          <p className="text-gray-500 font-light text-sm mb-6">
            {verificationStatus === 'verifying' ? 'Activating your subscription...' : 'Your subscription is now active'}
          </p>

          {/* Verification Status */}
          {verificationStatus === 'verifying' && (
            <div className="flex items-center justify-center gap-2 mb-4 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-light">Verifying payment...</span>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-light">Verification issue - please contact support</span>
              </div>
              {verificationError && (
                <p className="text-red-400 text-xs mt-1 font-light">{verificationError}</p>
              )}
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-center gap-2 text-emerald-600">
                <Check className="w-4 h-4" />
                <span className="text-sm font-light">Payment verified successfully!</span>
              </div>
            </div>
          )}

          {/* Plan Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 mb-6">
            <span className="text-lg">{currentTier.icon}</span>
            <span className="text-white font-medium text-sm">{currentTier.name} Member</span>
          </div>

          {/* Subscription Details */}
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="bg-gray-50/80 rounded-xl p-4 mb-6 text-left border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-3 text-center text-sm">Your Plan Includes</h3>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium text-sm">{currentTier.chats}</p>
                    <p className="text-gray-400 text-xs font-light">{currentTier.messages}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium text-sm">AI Travel Concierge</p>
                    <p className="text-gray-400 text-xs font-light">Jets, yachts, cars & more</p>
                  </div>
                </div>

                {subscription?.current_period_end && (
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium text-sm">Next billing</p>
                      <p className="text-emerald-600 text-xs font-light">{formatDate(subscription.current_period_end)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="text-gray-500 text-sm font-light">Monthly</span>
                <span className="text-gray-900 font-semibold">{currentTier.price}/mo</span>
              </div>
            </div>
          )}

          {/* Info Text */}
          <p className="text-gray-400 text-xs font-light mb-6">
            A confirmation email has been sent to your inbox.
          </p>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <Link
              to="/dashboard/chat"
              className="w-full py-3 px-6 bg-gray-900 text-white font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Start Chatting
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/dashboard"
              className="w-full py-3 px-6 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-sm"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>

            <Link
              to="/subscriptions/manage"
              className="w-full py-2.5 px-6 bg-transparent text-gray-400 font-light rounded-xl flex items-center justify-center gap-2 hover:text-gray-600 transition-colors text-sm"
            >
              <Crown className="w-4 h-4" />
              Manage Subscription
            </Link>
          </div>
        </div>

        {/* Support Link */}
        <p className="text-center text-gray-400 text-xs font-light mt-6">
          Need help? <a href="mailto:support@privatecharterx.com" className="text-gray-600 hover:text-gray-900 underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
};

export default SubscriptionSuccessPage;
