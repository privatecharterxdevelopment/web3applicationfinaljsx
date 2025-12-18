/**
 * Subscription Plans Page
 * Design: Modern glassmorphic card layout with new tier structure
 * Tiers: Starter ($49), Traveller ($99), Elite Club ($399)
 */

import React, { useState, useEffect } from 'react';
import {
  X, Loader2, Crown, MessageSquare, ArrowLeft, Check, Sparkles,
  Users, CheckCircle, Infinity, Plane, Car, UtensilsCrossed,
  HeartPulse, Calendar, Star, CreditCard, Phone, Mail, Wine,
  Map, ChefHat, Cigarette, Cookie, CalendarCheck, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { subscriptionService } from '../../services/subscriptionService';

const PricingPackages = ({ onClose, onBack }) => {
  const { user } = useAuth();
  const [userSubscription, setUserSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [showBusinessModal, setShowBusinessModal] = useState(false);

  // Load user's current subscription
  useEffect(() => {
    const loadSubscription = async () => {
      if (!user?.id) {
        setLoadingSubscription(false);
        return;
      }
      try {
        const profile = await subscriptionService.getUserProfile(user.id);
        setUserSubscription({
          tier: profile?.subscription_tier || null,
          status: profile?.subscription_status || null,
          chatsUsed: profile?.chats_used || 0,
          chatsLimit: profile?.chats_limit,
          unlimited: profile?.chats_limit === null,
          // Subscription dates
          currentPeriodStart: profile?.current_period_start ? new Date(profile.current_period_start) : null,
          currentPeriodEnd: profile?.current_period_end ? new Date(profile.current_period_end) : null,
          chatsResetDate: profile?.chats_reset_date ? new Date(profile.chats_reset_date) : null,
          createdAt: profile?.created_at ? new Date(profile.created_at) : null
        });
      } catch (error) {
        console.error('Error loading subscription:', error);
      } finally {
        setLoadingSubscription(false);
      }
    };
    loadSubscription();

    // Set up real-time listener for subscription changes
    if (!user?.id) return;

    const subscription = supabase
      .channel('subscription_plans_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Subscription updated in real-time:', payload.new);
          const newProfile = payload.new;
          if (newProfile) {
            setUserSubscription({
              tier: newProfile.subscription_tier || null,
              status: newProfile.subscription_status || null,
              chatsUsed: newProfile.chats_used || 0,
              chatsLimit: newProfile.chats_limit,
              unlimited: newProfile.chats_limit === null,
              // Subscription dates
              currentPeriodStart: newProfile.current_period_start ? new Date(newProfile.current_period_start) : null,
              currentPeriodEnd: newProfile.current_period_end ? new Date(newProfile.current_period_end) : null,
              chatsResetDate: newProfile.chats_reset_date ? new Date(newProfile.chats_reset_date) : null,
              createdAt: newProfile.created_at ? new Date(newProfile.created_at) : null
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id]);

  const [businessForm, setBusinessForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    requirements: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [processingPlan, setProcessingPlan] = useState(null);

  const STRIPE_PAYMENT_LINKS = {
    explorer: import.meta.env.VITE_STRIPE_EXPLORER_PAYMENT_LINK || '',
    traveller: import.meta.env.VITE_STRIPE_TRAVELLER_PAYMENT_LINK || '',
    elite: import.meta.env.VITE_STRIPE_ELITE_PAYMENT_LINK || ''
  };

  const plans = [
    {
      id: 'explorer',
      name: 'EXPLORER',
      tagline: 'Get Started',
      price: 49,
      period: 'month',
      chatsPerMonth: 5,
      messagesPerChat: 10,
      support: 'Basic Email',
      stripePriceId: import.meta.env.VITE_STRIPE_EXPLORER_PRICE_ID,
      features: [
        { text: '5 AI Conversations/month', included: true },
        { text: '10 messages per conversation', included: true },
        { text: 'Empty Legs Access', included: true },
        { text: 'Restaurant Reservations', included: true },
        { text: 'Ground Transport', included: true },
        { text: 'Delicacies & Cigars', included: true },
        { text: 'Winery Access', included: true },
        { text: 'Catering Services', included: true },
        { text: 'Custom Travel Organization', included: true },
        { text: 'Basic Email Support', included: true },
        { text: 'MEDEVAC Services', included: false },
        { text: 'Concierge Services', included: false },
        { text: 'Group Charter Requests', included: false },
        { text: 'Event Booking', included: false }
      ],
      highlights: ['5 Chats/mo', '10 Msgs/chat', 'Email Support']
    },
    {
      id: 'traveller',
      name: 'TRAVELLER',
      tagline: 'Most Popular',
      price: 99,
      period: 'month',
      chatsPerMonth: 10,
      messagesPerChat: 25,
      support: 'Priority',
      stripePriceId: import.meta.env.VITE_STRIPE_TRAVELLER_PRICE_ID,
      popular: true,
      features: [
        { text: '10 AI Conversations/month', included: true },
        { text: '25 messages per conversation', included: true },
        { text: 'Empty Legs Access', included: true },
        { text: 'Restaurant Reservations', included: true },
        { text: 'Ground Transport', included: true },
        { text: 'Delicacies & Cigars', included: true },
        { text: 'Winery Access', included: true },
        { text: 'Catering Services', included: true },
        { text: 'Custom Travel Organization', included: true },
        { text: 'MEDEVAC Services', included: true },
        { text: 'Concierge Services', included: true },
        { text: 'Group Charter Requests', included: true },
        { text: 'Reservations & Event Booking', included: true },
        { text: 'Priority Support', included: true }
      ],
      highlights: ['10 Chats/mo', '25 Msgs/chat', 'Priority Support', 'Concierge']
    },
    {
      id: 'elite',
      name: 'ELITE CLUB',
      tagline: 'Unlimited Access',
      price: 399,
      period: 'month',
      chatsPerMonth: 'Unlimited',
      messagesPerChat: 'Unlimited',
      support: '24/7 Phone',
      stripePriceId: import.meta.env.VITE_STRIPE_ELITE_PRICE_ID,
      elite: true,
      features: [
        { text: 'Unlimited AI Conversations', included: true },
        { text: 'Unlimited messages per chat', included: true },
        { text: 'All Traveller Features', included: true },
        { text: '24/7 Phone Coordination', included: true },
        { text: '2x Free Airport Transfers/month', included: true },
        { text: 'VIP Catering Services', included: true },
        { text: 'MembershipX Club Card', included: true },
        { text: 'VIP Event Invitations', included: true },
        { text: 'F1 VIP Access', included: true },
        { text: 'Yacht Shows & Events', included: true },
        { text: 'Mystery VIP Invitations', included: true },
        { text: 'Dedicated Account Manager', included: true }
      ],
      highlights: ['Unlimited', '24/7 Phone', 'MembershipX Card', 'VIP Events']
    }
  ];

  const handlePlanClick = async (plan) => {
    if (!user) {
      sessionStorage.setItem('pendingSubscription', plan.id);
      window.location.href = '/login?redirect=subscribe';
      return;
    }

    setProcessingPlan(plan.id);

    try {
      const paymentLink = STRIPE_PAYMENT_LINKS[plan.id];

      if (paymentLink) {
        const url = new URL(paymentLink);
        url.searchParams.set('client_reference_id', user.id);
        url.searchParams.set('prefilled_email', user.email || '');
        window.location.href = url.toString();
      } else {
        const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
          body: {
            priceId: plan.stripePriceId,
            userId: user.id,
            userEmail: user.email,
            tier: plan.id,
            successUrl: `${window.location.origin}/subscription/success?tier=${plan.id}`,
            cancelUrl: `${window.location.origin}/subscriptions/plans?subscription=cancelled`
          }
        });

        if (error) throw error;

        if (data?.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      setSubmitMessage('Unable to start checkout. Please try again or contact support.');
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleBusinessRequest = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert([
          {
            user_id: user?.id || null,
            name: businessForm.name,
            email: businessForm.email,
            subject: `Business Solutions Request - ${businessForm.company}`,
            message: `Company: ${businessForm.company}\nPhone: ${businessForm.phone}\n\nRequirements:\n${businessForm.requirements}`,
            status: 'open',
            category: 'business_solutions'
          }
        ]);

      if (error) throw error;

      setSubmitMessage('Thank you! Our team will contact you within 24 hours.');
      setBusinessForm({ name: '', email: '', company: '', phone: '', requirements: '' });

      setTimeout(() => {
        setShowBusinessModal(false);
        setSubmitMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error submitting business request:', error);
      setSubmitMessage('Error submitting request. Please try again or email us at admin@privatecharterx.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PrivateCharterX logo
  const PCX_LOGO = 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/PrivatecharterX_logo_vectorized.glb.png';

  return (
    <div className="h-full overflow-y-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header - Transparent */}
      <div
        className="px-6 py-5 border-b border-white/10"
        style={{ backdropFilter: 'blur(8px)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 hover:bg-white/50 rounded-lg transition-all border border-white/30 bg-white/20"
                style={{ backdropFilter: 'blur(8px)' }}
              >
                <ArrowLeft size={18} className="text-gray-500" />
              </button>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">Membership Plans</h1>
              <p className="text-xs text-gray-400 mt-0.5">Select the perfect plan for your travel needs</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-xl transition-all border border-white/30 bg-white/20 hover:scale-105"
              style={{ backdropFilter: 'blur(8px)' }}
            >
              <X size={18} className="text-gray-500" />
            </button>
          )}
        </div>

        {/* Stats - Current subscription info */}
        {userSubscription?.tier && (
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div>
              <span className="text-gray-400">Current Plan</span>
              <span className="ml-2 font-medium text-gray-900 capitalize">
                {loadingSubscription ? '...' : userSubscription?.tier || 'None'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Chats</span>
              <span className="ml-2 font-medium text-gray-900">
                {loadingSubscription ? '...' : userSubscription?.unlimited ? '∞ Unlimited' : `${userSubscription?.chatsUsed || 0}/${userSubscription?.chatsLimit || 0}`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" />
              <span className="text-gray-400">Popular</span>
              <span className="ml-1 font-medium text-gray-900">Traveller</span>
            </div>
          </div>
        )}

        {!userSubscription?.tier && !loadingSubscription && (
          <div
            className="mt-4 bg-white/20 rounded-xl p-4 border border-white/30"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 bg-white/60 rounded-lg flex items-center justify-center border border-gray-200/50"
                style={{ backdropFilter: 'blur(8px)' }}
              >
                <Shield size={18} className="text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Choose a membership to get started</p>
                <p className="text-xs text-gray-500">Unlock AI-powered travel planning and exclusive services</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Current Plan Banner - Transparent */}
      {userSubscription && userSubscription.tier && (
        <div
          className="mx-6 mt-4 bg-white/20 rounded-2xl p-5 border border-white/30"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 bg-white/60 rounded-xl flex items-center justify-center border border-gray-200/50"
                style={{ backdropFilter: 'blur(8px)' }}
              >
                <img src={PCX_LOGO} alt="PCX" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-gray-800 capitalize">{userSubscription.tier} Plan</h3>
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${
                    userSubscription.status === 'active'
                      ? 'bg-emerald-100 text-emerald-600 border-emerald-200/50'
                      : userSubscription.status === 'past_due'
                      ? 'bg-amber-100 text-amber-600 border-amber-200/50'
                      : 'bg-gray-100 text-gray-600 border-gray-200/50'
                  }`}>
                    {userSubscription.status?.toUpperCase() || 'ACTIVE'}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-0.5">
                  {userSubscription.unlimited ? (
                    <span className="flex items-center gap-1">
                      <Infinity size={14} className="text-gray-400" />
                      Unlimited conversations & messages
                    </span>
                  ) : (
                    `${userSubscription.chatsLimit - userSubscription.chatsUsed} conversations remaining this month`
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              {userSubscription.unlimited ? (
                <div className="text-2xl font-light text-gray-700">∞</div>
              ) : (
                <>
                  <div className="text-2xl font-light text-gray-800">{userSubscription.chatsLimit - userSubscription.chatsUsed}</div>
                  <div className="text-xs text-gray-500">chats left</div>
                </>
              )}
            </div>
          </div>

          {/* Subscription Dates */}
          {(userSubscription.currentPeriodStart || userSubscription.currentPeriodEnd) && (
            <div className="mt-4 pt-4 border-t border-gray-200/50 flex flex-wrap gap-4 text-xs">
              {userSubscription.currentPeriodStart && (
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-gray-400" />
                  <span className="text-gray-500">Started:</span>
                  <span className="text-gray-700 font-medium">
                    {userSubscription.currentPeriodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}
              {userSubscription.currentPeriodEnd && (
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-emerald-500" />
                  <span className="text-gray-500">Renews:</span>
                  <span className="text-emerald-600 font-medium">
                    {userSubscription.currentPeriodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}
              {userSubscription.chatsResetDate && !userSubscription.unlimited && (
                <div className="flex items-center gap-2">
                  <MessageSquare size={12} className="text-gray-400" />
                  <span className="text-gray-500">Chats reset:</span>
                  <span className="text-gray-700 font-medium">
                    {userSubscription.chatsResetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Plans Grid */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl">
          {plans.map((plan) => {
            const isCurrentPlan = userSubscription?.tier === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  isCurrentPlan
                    ? 'bg-white/30 border-2 border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg'
                    : plan.popular
                    ? 'bg-white/30 border border-gray-300/50 ring-1 ring-gray-900/5 shadow-lg'
                    : plan.elite
                    ? 'bg-white/30 border border-amber-300/40 ring-1 ring-amber-500/10 shadow-lg'
                    : 'bg-white/20 border border-white/40 hover:bg-white/40 hover:border-gray-200/60'
                }`}
                style={{ backdropFilter: 'blur(12px) saturate(150%)' }}
              >
                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-medium tracking-wide shadow-lg">
                      <CheckCircle size={10} />
                      CURRENT PLAN
                    </span>
                  </div>
                )}
                {/* Popular Badge */}
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-gray-900 text-white px-3 py-1 rounded-full text-[10px] font-medium tracking-wide shadow-lg">
                      <Sparkles size={10} />
                      MOST POPULAR
                    </span>
                  </div>
                )}
                {/* Elite Badge */}
                {plan.elite && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-[10px] font-medium tracking-wide shadow-lg">
                      <Crown size={10} />
                      ELITE CLUB
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className={`${plan.popular || plan.elite || isCurrentPlan ? 'mt-2' : ''}`}>
                  <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
                    {plan.name}
                  </h3>
                  <p className="text-gray-500 text-xs mt-0.5">{plan.tagline}</p>
                </div>

                {/* Price - Light typography */}
                <div className="mt-4 mb-5">
                  <span className="text-4xl font-extralight text-gray-800 tracking-tight">${plan.price}</span>
                  <span className="text-gray-400 text-xs font-light ml-1">/{plan.period}</span>
                </div>

                {/* Key Stats - Glassmorphic */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div
                    className="bg-white/50 rounded-lg p-2.5 border border-white/30"
                    style={{ backdropFilter: 'blur(8px)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <MessageSquare size={12} className="text-gray-400" />
                      <span className="text-[10px] text-gray-500">Chats/mo</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">
                      {plan.chatsPerMonth === 'Unlimited' ? '∞' : plan.chatsPerMonth}
                    </p>
                  </div>
                  <div
                    className="bg-white/50 rounded-lg p-2.5 border border-white/30"
                    style={{ backdropFilter: 'blur(8px)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="text-gray-400" />
                      <span className="text-[10px] text-gray-500">Msgs/chat</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">
                      {plan.messagesPerChat === 'Unlimited' ? '∞' : plan.messagesPerChat}
                    </p>
                  </div>
                </div>

                {/* Support Level - Glassmorphic */}
                <div
                  className="flex items-center gap-2 mb-4 p-2 bg-white/40 rounded-lg border border-white/30"
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  {plan.support === '24/7 Phone' ? (
                    <Phone size={14} className="text-amber-500" />
                  ) : plan.support === 'Priority' ? (
                    <Star size={14} className="text-gray-600" />
                  ) : (
                    <Mail size={14} className="text-gray-400" />
                  )}
                  <span className="text-xs text-gray-600 font-light">{plan.support} Support</span>
                </div>

                {/* Features List */}
                <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
                  {plan.features.slice(0, 8).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        feature.included ? 'bg-gray-100' : 'bg-white/10'
                      }`}>
                        {feature.included ? (
                          <Check size={10} className="text-gray-600" />
                        ) : (
                          <X size={10} className="text-gray-300" />
                        )}
                      </div>
                      <span className={`text-xs ${feature.included ? 'text-gray-600' : 'text-gray-400'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                  {plan.features.length > 8 && (
                    <p className="text-[10px] text-gray-400 pl-6">+{plan.features.length - 8} more features</p>
                  )}
                </div>

                {/* Highlight Tags - Glassmorphic */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {plan.highlights.slice(0, 4).map((tag, index) => (
                    <span
                      key={index}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${
                        plan.elite
                          ? 'text-amber-700 bg-amber-50/60 border-amber-200/40'
                          : 'text-gray-600 bg-white/50 border-white/40'
                      }`}
                      style={{ backdropFilter: 'blur(4px)' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA Button - Monochromatic light gray glass */}
                <button
                  onClick={() => !isCurrentPlan && handlePlanClick(plan)}
                  disabled={processingPlan === plan.id || isCurrentPlan}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? 'bg-gray-100/50 text-gray-400 cursor-default border border-gray-200/40'
                      : 'bg-white/60 text-gray-700 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/60'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  {processingPlan === plan.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    <>
                      <CheckCircle size={16} />
                      Current Plan
                    </>
                  ) : (
                    'Select Plan'
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Business Solutions Card */}
        <div
          className="mt-5 max-w-6xl bg-white/20 border border-white/30 rounded-2xl p-6 hover:bg-white/30 hover:shadow-xl hover:border-white/40 transition-all duration-300 group"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-white/60 rounded-lg flex items-center justify-center border border-gray-200/50" style={{ backdropFilter: 'blur(8px)' }}>
                  <Users size={14} className="text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
                  Business Solutions
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200/50">
                  ENTERPRISE
                </span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4 max-w-2xl">
                Tailored solutions for your organization with unlimited access, dedicated support, and custom integrations.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['Unlimited Access', 'Dedicated Team', 'Custom Integration', 'White Label', 'API Access'].map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-medium text-gray-600 bg-gray-100/80 border border-gray-200/50">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <a
              href="mailto:admin@privatecharterx.com?subject=Business%20Solutions%20Inquiry"
              className="px-6 py-3 bg-white/60 text-gray-700 rounded-xl hover:bg-white/80 transition-all text-sm font-medium border border-gray-200/50 whitespace-nowrap text-center"
              style={{ backdropFilter: 'blur(8px)' }}
            >
              Contact Us
            </a>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-8 max-w-6xl bg-white/20 rounded-2xl border border-white/30 overflow-hidden" style={{ backdropFilter: 'blur(8px)' }}>
          <div className="px-6 py-4 border-b border-white/20">
            <h3 className="text-lg font-semibold text-gray-900">Compare Plans</h3>
            <p className="text-xs text-gray-500 mt-1">See what's included in each membership tier</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Feature</th>
                  <th className="text-center px-4 py-3 text-gray-900 font-medium">Explorer</th>
                  <th className="text-center px-4 py-3 text-gray-900 font-medium bg-white/10">Traveller</th>
                  <th className="text-center px-4 py-3 text-amber-700 font-medium">Elite Club</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr>
                  <td className="px-6 py-3 text-gray-600">AI Chats/month</td>
                  <td className="text-center px-4 py-3">5</td>
                  <td className="text-center px-4 py-3 bg-white/10">10</td>
                  <td className="text-center px-4 py-3 text-amber-600 font-medium">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-gray-600">Messages/chat</td>
                  <td className="text-center px-4 py-3">10</td>
                  <td className="text-center px-4 py-3 bg-white/10">25</td>
                  <td className="text-center px-4 py-3 text-amber-600 font-medium">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-gray-600">Empty Legs</td>
                  <td className="text-center px-4 py-3"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-4 py-3 bg-white/10"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-4 py-3"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-gray-600">Ground Transport</td>
                  <td className="text-center px-4 py-3"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-4 py-3 bg-white/10"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-4 py-3"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-gray-600">Restaurants</td>
                  <td className="text-center px-4 py-3"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-4 py-3 bg-white/10"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-4 py-3"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-gray-600">MEDEVAC Services</td>
                  <td className="text-center px-4 py-3"><X size={16} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-4 py-3 bg-white/10"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-4 py-3"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-gray-600">Concierge Services</td>
                  <td className="text-center px-4 py-3"><X size={16} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-4 py-3 bg-white/10"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-4 py-3"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-gray-600">Group Charter</td>
                  <td className="text-center px-4 py-3"><X size={16} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-4 py-3 bg-white/10"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-4 py-3"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-gray-600">Event Booking</td>
                  <td className="text-center px-4 py-3"><X size={16} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-4 py-3 bg-white/10"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-4 py-3"><Check size={16} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-gray-600">Free Airport Transfers</td>
                  <td className="text-center px-4 py-3"><X size={16} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-4 py-3 bg-white/10"><X size={16} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-4 py-3 text-amber-600 font-medium">2x/month</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-gray-600">MembershipX Card</td>
                  <td className="text-center px-4 py-3"><X size={16} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-4 py-3 bg-white/10"><X size={16} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-4 py-3"><Check size={16} className="text-amber-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-gray-600">VIP Event Invites</td>
                  <td className="text-center px-4 py-3"><X size={16} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-4 py-3 bg-white/10"><X size={16} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-4 py-3"><Check size={16} className="text-amber-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-gray-600">Support</td>
                  <td className="text-center px-4 py-3 text-gray-500">Email</td>
                  <td className="text-center px-4 py-3 bg-white/10 text-gray-700">Priority</td>
                  <td className="text-center px-4 py-3 text-amber-600 font-medium">24/7 Phone</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Business Solutions Modal */}
      {showBusinessModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowBusinessModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/60 rounded-lg flex items-center justify-center text-gray-600 border border-gray-200/50" style={{ backdropFilter: 'blur(8px)' }}>
                    <Users size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Business Solutions</h2>
                    <p className="text-xs text-gray-500">Custom enterprise plans</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBusinessModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5">
              {submitMessage && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  submitMessage.includes('Error')
                    ? 'bg-red-50 text-red-700 border border-red-100'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {submitMessage}
                </div>
              )}

              <form onSubmit={handleBusinessRequest} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Name *</label>
                  <input
                    type="text"
                    required
                    value={businessForm.name}
                    onChange={(e) => setBusinessForm({...businessForm, name: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Email *</label>
                  <input
                    type="email"
                    required
                    value={businessForm.email}
                    onChange={(e) => setBusinessForm({...businessForm, email: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Company *</label>
                  <input
                    type="text"
                    required
                    value={businessForm.company}
                    onChange={(e) => setBusinessForm({...businessForm, company: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={businessForm.phone}
                    onChange={(e) => setBusinessForm({...businessForm, phone: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Requirements *</label>
                  <textarea
                    required
                    rows={3}
                    value={businessForm.requirements}
                    onChange={(e) => setBusinessForm({...businessForm, requirements: e.target.value})}
                    placeholder="Tell us about your business needs..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBusinessModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-white/10 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 text-sm font-medium bg-white/60 text-gray-700 rounded-lg hover:bg-white/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 border border-gray-200/50"
                    style={{ backdropFilter: 'blur(8px)' }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-gray-500" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPackages;
