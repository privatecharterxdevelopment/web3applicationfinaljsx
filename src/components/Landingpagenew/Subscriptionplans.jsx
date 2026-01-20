/**
 * Subscription Plans Page
 * Design: Modern glassmorphic card layout with new tier structure
 * Tiers: Explorer ($99), Traveller ($199), Elite Club ($999)
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
    essential: import.meta.env.VITE_STRIPE_ESSENTIAL_PAYMENT_LINK || '',
    explorer: import.meta.env.VITE_STRIPE_EXPLORER_PAYMENT_LINK || import.meta.env.VITE_STRIPE_STARTER_PAYMENT_LINK || '',
    traveller: import.meta.env.VITE_STRIPE_TRAVELLER_PAYMENT_LINK || import.meta.env.VITE_STRIPE_PRO_PAYMENT_LINK || '',
    elite: import.meta.env.VITE_STRIPE_ELITE_PAYMENT_LINK || ''
  };

  const plans = [
    {
      id: 'essential',
      name: 'ESSENTIAL BASIC',
      tagline: 'Start Simple',
      price: 19,
      period: 'month',
      chatsPerMonth: 10,
      messagesPerChat: 5,
      support: 'Email',
      stripePriceId: import.meta.env.VITE_STRIPE_ESSENTIAL_PRICE_ID,
      aiModel: 'Haiku',
      features: [
        { text: '10 AI Conversations/month', included: true },
        { text: '5 messages per conversation', included: true },
        { text: 'Empty Legs Search & Booking', included: true },
        { text: 'Restaurant Search', included: true },
        { text: 'Private Jet Search', included: true },
        { text: 'General Service Queries', included: true },
        { text: 'Email Support', included: true },
        { text: 'Private Jet Booking', included: false },
        { text: 'Helicopter Charters', included: false },
        { text: 'Luxury Cars', included: false },
        { text: 'Concierge Services', included: false },
        { text: 'MEDEVAC Services', included: false }
      ],
      highlights: ['$19/mo', '10 Chats', 'Empty Legs', 'Jet Search']
    },
    {
      id: 'explorer',
      name: 'EXPLORER',
      tagline: 'Get Started',
      price: 99,
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
      price: 199,
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
      price: 999,
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
      // Use Payment Links first (they work on Vercel)
      const paymentLink = STRIPE_PAYMENT_LINKS[plan.id];

      if (paymentLink) {
        const url = new URL(paymentLink);
        url.searchParams.set('client_reference_id', user.id);
        url.searchParams.set('prefilled_email', user.email || '');
        window.location.href = url.toString();
      } else if (plan.stripePriceId) {
        // Fallback to Checkout Sessions if no payment link
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
      } else {
        throw new Error('No payment method configured');
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
            subject: `Business Solutions Request - ${businessForm.company}`,
            description: `Name: ${businessForm.name}\nEmail: ${businessForm.email}\nCompany: ${businessForm.company}\nPhone: ${businessForm.phone}\n\nRequirements:\n${businessForm.requirements}`,
            status: 'open',
            priority: 'normal',
            tags: ['business_solutions', 'enterprise'],
            ticket_data: {
              category: 'business_solutions',
              user_name: businessForm.name,
              user_email: businessForm.email,
              company: businessForm.company,
              phone: businessForm.phone,
              source: 'subscription_page'
            }
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
      {/* Header - Fully Transparent */}
      <div className="px-6 py-5 border-b border-gray-200/30">
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

        {/* Stats Pills - Modern glassmorphic design */}
        {userSubscription?.tier && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {/* Current Plan Pill */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 border border-white/60"
              style={{ backdropFilter: 'blur(12px)' }}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${
                userSubscription?.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'
              }`} />
              <span className="text-[11px] text-gray-500 uppercase tracking-wide">Plan</span>
              <span className="text-xs font-semibold text-gray-800 capitalize">
                {loadingSubscription ? '...' : userSubscription?.tier || 'None'}
              </span>
            </div>

            {/* Chats Pill */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 border border-white/60"
              style={{ backdropFilter: 'blur(12px)' }}
            >
              <MessageSquare size={11} className="text-gray-400" />
              <span className="text-[11px] text-gray-500 uppercase tracking-wide">Chats</span>
              <span className="text-xs font-semibold text-gray-800">
                {loadingSubscription ? '...' : userSubscription?.unlimited ? '∞' : `${userSubscription?.chatsUsed || 0}/${userSubscription?.chatsLimit || 0}`}
              </span>
            </div>

            {/* Popular Pill */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50/80 to-orange-50/80 border border-amber-200/40"
              style={{ backdropFilter: 'blur(12px)' }}
            >
              <Sparkles size={11} className="text-amber-500" />
              <span className="text-[11px] text-amber-600 font-medium">Most Popular: Traveller</span>
            </div>
          </div>
        )}

        {/* No Subscription CTA */}
        {!userSubscription?.tier && !loadingSubscription && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 border border-white/60"
              style={{ backdropFilter: 'blur(12px)' }}
            >
              <Shield size={11} className="text-gray-400" />
              <span className="text-xs text-gray-600">No active plan</span>
            </div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50/80 to-orange-50/80 border border-amber-200/40"
              style={{ backdropFilter: 'blur(12px)' }}
            >
              <Sparkles size={11} className="text-amber-500" />
              <span className="text-[11px] text-amber-600 font-medium">Start with Essential at $19/mo</span>
            </div>
          </div>
        )}
      </div>

{/* Current Plan Banner - Removed (info now shown in header pills) */}

      {/* Plans Grid */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl">
          {plans.map((plan) => {
            const isCurrentPlan = userSubscription?.tier === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  isCurrentPlan
                    ? 'bg-white/30 border-2 border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg'
                    : plan.popular
                    ? 'bg-white/30 border border-gray-300/60 ring-1 ring-gray-900/5 shadow-lg'
                    : plan.elite
                    ? 'bg-white/30 border border-amber-300/40 ring-1 ring-amber-500/10 shadow-lg'
                    : 'bg-white/30 border border-gray-300/50 shadow-md hover:shadow-lg hover:border-gray-400/60'
                }`}
                style={{ backdropFilter: 'blur(12px) saturate(150%)' }}
              >
                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-medium tracking-wide shadow-lg">
                      <CheckCircle size={10} />
                      CURRENT
                    </span>
                  </div>
                )}
                {/* Popular Badge */}
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-gray-900 text-white px-3 py-1 rounded-full text-[10px] font-medium tracking-wide shadow-lg">
                      <Sparkles size={10} />
                      POPULAR
                    </span>
                  </div>
                )}
                {/* Elite Badge */}
                {plan.elite && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-[10px] font-medium tracking-wide shadow-lg">
                      <Crown size={10} />
                      ELITE
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className={`${plan.popular || plan.elite || isCurrentPlan ? 'mt-2' : ''}`}>
                  <h3 className="text-base font-semibold text-gray-900 tracking-tight">
                    {plan.name}
                  </h3>
                  <p className="text-gray-500 text-[11px] mt-0.5">{plan.tagline}</p>
                </div>

                {/* Price */}
                <div className="mt-3 mb-4">
                  <span className="text-3xl font-extralight text-gray-800 tracking-tight">${plan.price}</span>
                  <span className="text-gray-400 text-xs font-light ml-1">/{plan.period}</span>
                </div>

                {/* Key Stats */}
                <div className="flex gap-2 mb-3 text-[10px]">
                  <div className="flex items-center gap-1 px-2 py-1 bg-white/50 rounded-md border border-white/30">
                    <MessageSquare size={10} className="text-gray-400" />
                    <span className="text-gray-600">{plan.chatsPerMonth === 'Unlimited' ? '∞' : plan.chatsPerMonth} chats</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-white/50 rounded-md border border-white/30">
                    <Mail size={10} className="text-gray-400" />
                    <span className="text-gray-600">{plan.messagesPerChat === 'Unlimited' ? '∞' : plan.messagesPerChat} msgs</span>
                  </div>
                </div>

                {/* Features List - Compact */}
                <div className="space-y-1.5 mb-4">
                  {plan.features.slice(0, 6).map((feature, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      {feature.included ? (
                        <Check size={10} className="text-gray-500 flex-shrink-0" />
                      ) : (
                        <X size={10} className="text-gray-300 flex-shrink-0" />
                      )}
                      <span className={`text-[11px] ${feature.included ? 'text-gray-600' : 'text-gray-400'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                  {plan.features.length > 6 && (
                    <p className="text-[10px] text-gray-400 pl-4">+{plan.features.length - 6} more</p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => !isCurrentPlan && handlePlanClick(plan)}
                  disabled={processingPlan === plan.id || isCurrentPlan}
                  className={`w-full py-2.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? 'bg-gray-100/50 text-gray-400 cursor-default border border-gray-200/40'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {processingPlan === plan.id ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    <>
                      <CheckCircle size={14} />
                      Current
                    </>
                  ) : (
                    'Select Plan'
                  )}
                </button>
              </div>
            );
          })}
        </div>

{/* Business Solutions Card - Hidden for now */}
        {/* <div
          className="mt-6 max-w-6xl bg-white/20 border border-white/30 rounded-2xl p-6 hover:bg-white/30 hover:shadow-xl hover:border-white/40 transition-all duration-300 group"
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
        </div> */}

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
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Feature</th>
                  <th className="text-center px-3 py-3 text-gray-700 font-medium text-xs">Essential</th>
                  <th className="text-center px-3 py-3 text-gray-900 font-medium text-xs">Explorer</th>
                  <th className="text-center px-3 py-3 text-gray-900 font-medium text-xs bg-white/10">Traveller</th>
                  <th className="text-center px-3 py-3 text-amber-700 font-medium text-xs">Elite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">AI Chats/month</td>
                  <td className="text-center px-3 py-2.5 text-xs">10</td>
                  <td className="text-center px-3 py-2.5 text-xs">5</td>
                  <td className="text-center px-3 py-2.5 bg-white/10 text-xs">10</td>
                  <td className="text-center px-3 py-2.5 text-amber-600 font-medium text-xs">∞</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">Messages/chat</td>
                  <td className="text-center px-3 py-2.5 text-xs">5</td>
                  <td className="text-center px-3 py-2.5 text-xs">10</td>
                  <td className="text-center px-3 py-2.5 bg-white/10 text-xs">25</td>
                  <td className="text-center px-3 py-2.5 text-amber-600 font-medium text-xs">∞</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">Empty Legs</td>
                  <td className="text-center px-3 py-2.5"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5 bg-white/10"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">Restaurants</td>
                  <td className="text-center px-3 py-2.5"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5 bg-white/10"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">Private Jet Search</td>
                  <td className="text-center px-3 py-2.5"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5 bg-white/10"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">Private Jet Booking</td>
                  <td className="text-center px-3 py-2.5"><X size={14} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5 bg-white/10"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">Helicopters</td>
                  <td className="text-center px-3 py-2.5"><X size={14} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5 bg-white/10"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">Ground Transport</td>
                  <td className="text-center px-3 py-2.5"><X size={14} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5 bg-white/10"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">MEDEVAC Services</td>
                  <td className="text-center px-3 py-2.5"><X size={14} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5"><X size={14} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5 bg-white/10"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">Concierge Services</td>
                  <td className="text-center px-3 py-2.5"><X size={14} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5"><X size={14} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5 bg-white/10"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5"><Check size={14} className="text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">VIP Events</td>
                  <td className="text-center px-3 py-2.5"><X size={14} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5"><X size={14} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5 bg-white/10"><X size={14} className="text-gray-300 mx-auto" /></td>
                  <td className="text-center px-3 py-2.5"><Check size={14} className="text-amber-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">Support</td>
                  <td className="text-center px-3 py-2.5 text-gray-500 text-xs">Email</td>
                  <td className="text-center px-3 py-2.5 text-gray-500 text-xs">Email</td>
                  <td className="text-center px-3 py-2.5 bg-white/10 text-gray-700 text-xs">Priority</td>
                  <td className="text-center px-3 py-2.5 text-amber-600 font-medium text-xs">24/7</td>
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
