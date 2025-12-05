/**
 * Subscription Plans Page
 * Design: Card/Grid layout with MyBookingsView header styling
 */

import React, { useState, useEffect } from 'react';
import { X, Loader2, Crown, MessageSquare, ArrowLeft, Check, Sparkles, Users, CheckCircle, Infinity } from 'lucide-react';
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
          tier: profile?.subscription_tier || 'explorer',
          chatsUsed: profile?.chats_used || 0,
          chatsLimit: profile?.chats_limit,
          unlimited: profile?.chats_limit === null
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
          console.log('📡 Subscription updated in real-time:', payload.new);
          const newProfile = payload.new;
          if (newProfile) {
            setUserSubscription({
              tier: newProfile.subscription_tier || 'explorer',
              chatsUsed: newProfile.chats_used || 0,
              chatsLimit: newProfile.chats_limit,
              unlimited: newProfile.chats_limit === null
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id, user?.subscription_tier]);
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
    starter: import.meta.env.VITE_STRIPE_STARTER_PAYMENT_LINK || '',
    pro: import.meta.env.VITE_STRIPE_PRO_PAYMENT_LINK || '',
    elite: import.meta.env.VITE_STRIPE_ELITE_PAYMENT_LINK || ''
  };

  const plans = [
    {
      id: 'starter',
      name: 'STARTER',
      tagline: 'Get Started',
      price: 20,
      period: 'month',
      chatsPerMonth: 5,
      messagesPerChat: 50,
      breakThePrice: true,
      stripePriceId: import.meta.env.VITE_STRIPE_STARTER_PRICE_ID,
      features: [
        '5 AI Conversations/month',
        '50 messages per conversation',
        'Break the Price feature',
        'Email Support'
      ],
      tags: ['5 AI Chats/mo', '50 Messages/chat', 'Email Support']
    },
    {
      id: 'pro',
      name: 'PROFESSIONAL',
      tagline: 'Most Popular',
      price: 40,
      period: 'month',
      chatsPerMonth: 20,
      messagesPerChat: 100,
      breakThePrice: true,
      stripePriceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
      popular: true,
      features: [
        '20 AI Conversations/month',
        '100 messages per conversation',
        'Break the Price feature',
        'Priority Support',
        'Dedicated Manager'
      ],
      tags: ['20 AI Chats/mo', '100 Messages/chat', 'Priority Support', 'Dedicated Manager']
    },
    {
      id: 'elite',
      name: 'ELITE',
      tagline: 'Unlimited Access',
      price: 130,
      period: 'month',
      chatsPerMonth: 'Unlimited',
      messagesPerChat: 'Unlimited',
      breakThePrice: true,
      stripePriceId: import.meta.env.VITE_STRIPE_ELITE_PRICE_ID,
      features: [
        'Unlimited AI Conversations',
        'Unlimited messages per chat',
        'Unlimited Break the Price',
        '24/7 Concierge Service'
      ],
      tags: ['Unlimited Chats', 'Unlimited Messages', '24/7 Concierge', 'Break the Price']
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
            successUrl: `${window.location.origin}/dashboard?subscription=${plan.id}&success=true`,
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
      setSubmitMessage('Error submitting request. Please try again or email us at business@sphera.ai');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header - Matching MyBookingsView */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={18} className="text-gray-500" />
              </button>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">Plans & Pricing</h1>
              <p className="text-xs text-gray-400 mt-0.5">Select the perfect plan for your needs</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={18} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Stats - Minimal Inline */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div>
            <span className="text-gray-400">Current Plan</span>
            <span className="ml-2 font-medium text-gray-900 capitalize">
              {loadingSubscription ? '...' : userSubscription?.tier || 'Explorer'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Chats</span>
            <span className="ml-2 font-medium text-gray-900">
              {loadingSubscription ? '...' : userSubscription?.unlimited ? '∞ Unlimited' : `${userSubscription?.chatsUsed || 0}/${userSubscription?.chatsLimit || 1}`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles size={12} className="text-amber-500" />
            <span className="text-gray-400">Popular</span>
            <span className="ml-1 font-medium text-gray-900">Professional</span>
          </div>
        </div>
      </div>

      {/* Current Plan Banner */}
      {userSubscription && userSubscription.tier !== 'explorer' && (
        <div className="mx-6 mt-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Crown size={24} className="text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold capitalize">{userSubscription.tier} Plan</h3>
                  <span className="px-2 py-0.5 bg-white/20 text-white/70 text-[10px] font-medium rounded-full">
                    ACTIVE
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-0.5">
                  {userSubscription.unlimited ? (
                    <span className="flex items-center gap-1">
                      <Infinity size={14} />
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
                <div className="text-2xl font-light">∞</div>
              ) : (
                <>
                  <div className="text-2xl font-light">{userSubscription.chatsLimit - userSubscription.chatsUsed}</div>
                  <div className="text-xs text-gray-400">chats left</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid - Glassmorphic Design */}
      <div className="px-6 py-6 bg-gradient-to-br from-gray-100/50 via-gray-50/50 to-gray-100/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl">
          {plans.map((plan) => {
            const isCurrentPlan = userSubscription?.tier === plan.id;

            return (
              <div
              key={plan.id}
              className={`relative bg-white/80 backdrop-blur-md rounded-2xl p-6 transition-all duration-300 hover:bg-white/90 hover:shadow-xl hover:-translate-y-1 ${
                isCurrentPlan
                  ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg'
                  : plan.popular
                  ? 'border-2 border-gray-900/20 ring-1 ring-gray-900/5 shadow-lg'
                  : 'border border-gray-200/60 hover:border-gray-300/80'
              }`}
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

              {/* Plan Header */}
              <div className={`${plan.popular || isCurrentPlan ? 'mt-2' : ''}`}>
                <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
                  {plan.name}
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">{plan.tagline}</p>
              </div>

              {/* Price */}
              <div className="mt-4 mb-5">
                <span className="text-4xl font-light text-gray-900 tracking-tight">${plan.price}</span>
                <span className="text-gray-400 text-sm ml-1">/{plan.period}</span>
              </div>

              {/* Features List - Clean minimal style */}
              <div className="space-y-3 mb-5">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Check size={10} className="text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Tags - Minimal pill style */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {plan.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium text-gray-600 bg-gray-100/80 border border-gray-200/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => !isCurrentPlan && handlePlanClick(plan)}
                disabled={processingPlan === plan.id || isCurrentPlan}
                className={`w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  isCurrentPlan
                    ? 'bg-emerald-500 text-white cursor-default'
                    : plan.popular
                    ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
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

        {/* Business Solutions Card - Glassmorphic Full Width */}
        <div
          onClick={() => setShowBusinessModal(true)}
          className="mt-5 max-w-6xl bg-white/80 backdrop-blur-md border border-gray-200/60 rounded-2xl p-6 hover:bg-white/90 hover:shadow-xl hover:border-gray-300/80 transition-all duration-300 cursor-pointer group"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <Users size={14} className="text-white" />
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
                {['Unlimited Access', 'Dedicated Team', 'Custom Integration', 'White Label'].map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-medium text-gray-600 bg-gray-100/80 border border-gray-200/50">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <button className="px-6 py-3 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-all text-sm font-medium border border-gray-200 whitespace-nowrap group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900">
              Contact Us
            </button>
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
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-white">
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
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
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
