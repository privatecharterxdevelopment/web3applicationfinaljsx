import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Check, Crown, MessageSquare, Sparkles, Home, ArrowRight, Loader2, Calendar } from 'lucide-react';
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

  // Tier display info
  const tierInfo = {
    explorer: {
      name: 'Explorer',
      price: '$49',
      chats: '5 AI Chats',
      messages: '10 messages per chat',
      color: 'from-blue-500 to-cyan-500',
      icon: '✈️'
    },
    traveller: {
      name: 'Traveller',
      price: '$99',
      chats: '10 AI Chats',
      messages: '25 messages per chat',
      color: 'from-purple-500 to-pink-500',
      icon: '🌍'
    },
    elite: {
      name: 'Elite Club',
      price: '$399',
      chats: 'Unlimited Chats',
      messages: 'Unlimited messages',
      color: 'from-amber-500 to-orange-500',
      icon: '👑'
    }
  };

  const currentTier = tierInfo[tier] || tierInfo.explorer;

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Success Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 text-center relative overflow-hidden">
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${currentTier.color} opacity-10 pointer-events-none`} />

          {/* Success Icon */}
          <div className="relative">
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${currentTier.color} opacity-20 rounded-full animate-ping`} />
              <div className={`relative w-full h-full bg-gradient-to-br ${currentTier.color} rounded-full flex items-center justify-center`}>
                <Check className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">Welcome to {currentTier.name}!</h1>
            <p className="text-white/60 mb-6">Your subscription is now active</p>

            {/* Plan Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${currentTier.color} mb-6`}>
              <Crown className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">{currentTier.name} Member</span>
            </div>

            {/* Subscription Details */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
              </div>
            ) : (
              <div className="bg-white/5 rounded-xl p-5 mb-6 text-left">
                <h3 className="font-semibold text-white mb-4 text-center">Your Plan Includes</h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{currentTier.chats}</p>
                      <p className="text-white/50 text-xs">{currentTier.messages}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">AI-Powered Travel Concierge</p>
                      <p className="text-white/50 text-xs">Book jets, yachts, cars & more</p>
                    </div>
                  </div>

                  {subscription?.current_period_end && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Next billing date</p>
                        <p className="text-emerald-400 text-xs">{formatDate(subscription.current_period_end)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Summary */}
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-white/60">Monthly subscription</span>
                  <span className="text-white font-bold text-lg">{currentTier.price}/mo</span>
                </div>
              </div>
            )}

            {/* Info Text */}
            <p className="text-white/50 text-sm mb-6">
              A confirmation email has been sent to your email address.
              You can manage your subscription anytime from your dashboard.
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                to="/"
                className={`w-full py-3 px-6 bg-gradient-to-r ${currentTier.color} text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
              >
                <MessageSquare className="w-5 h-5" />
                Start Chatting with AI
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/subscriptions/manage"
                className="w-full py-3 px-6 bg-white/10 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
              >
                <Crown className="w-5 h-5" />
                Manage Subscription
              </Link>

              <Link
                to="/"
                className="w-full py-3 px-6 bg-transparent text-white/70 font-medium rounded-xl flex items-center justify-center gap-2 hover:text-white transition-colors"
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

export default SubscriptionSuccessPage;
