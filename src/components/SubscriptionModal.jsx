import React, { useState } from 'react';
import { X, Check, Crown, Plane, Car, UtensilsCrossed, Wine, HeartPulse, Users, Calendar, CreditCard, Star, ChevronDown, ChevronUp, Map, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const SubscriptionModal = ({ isOpen, onClose, currentTier = null, onUpgrade }) => {
  const { user } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  const [expandedPlan, setExpandedPlan] = useState(null);

  // Use environment variables for Stripe payment links
  const stripePaymentLinks = {
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
      stripeLink: stripePaymentLinks.explorer,
      color: 'gray',
      highlights: ['5 AI Chats/month', '10 Messages/chat', 'Email Support'],
      features: [
        { text: 'Empty Legs Access', included: true, icon: Plane },
        { text: 'Restaurant Reservations', included: true, icon: UtensilsCrossed },
        { text: 'Ground Transport', included: true, icon: Car },
        { text: 'Delicacies & Cigars', included: true, icon: Wine },
        { text: 'Winery Access', included: true, icon: Wine },
        { text: 'Catering Services', included: true, icon: UtensilsCrossed },
        { text: 'Luxury Travel Designer', included: true, icon: Map },
        { text: 'MEDEVAC Services', included: false, icon: HeartPulse },
        { text: 'Concierge Services', included: false, icon: Users },
        { text: 'Group Charter', included: false, icon: Users },
        { text: 'Break the Price', included: false, icon: Star }
      ]
    },
    {
      id: 'traveller',
      name: 'TRAVELLER',
      tagline: 'Most Popular',
      price: 99,
      period: 'month',
      stripeLink: stripePaymentLinks.traveller,
      popular: true,
      color: 'blue',
      highlights: ['10 AI Chats/month', '25 Messages/chat', 'Priority Support'],
      features: [
        { text: 'Empty Legs Access', included: true, icon: Plane },
        { text: 'Restaurant Reservations', included: true, icon: UtensilsCrossed },
        { text: 'Ground Transport', included: true, icon: Car },
        { text: 'Delicacies & Cigars', included: true, icon: Wine },
        { text: 'Winery Access', included: true, icon: Wine },
        { text: 'Catering Services', included: true, icon: UtensilsCrossed },
        { text: 'Luxury Travel Designer', included: true, icon: Map },
        { text: 'MEDEVAC Services', included: true, icon: HeartPulse },
        { text: 'Concierge Services', included: true, icon: Users },
        { text: 'Group Charter', included: true, icon: Users },
        { text: 'Event Booking', included: true, icon: Calendar },
        { text: 'Break the Price', included: true, icon: Star },
        { text: 'VIP Events', included: false, icon: Star },
        { text: 'MembershipX Card', included: false, icon: CreditCard }
      ]
    },
    {
      id: 'elite',
      name: 'ELITE CLUB',
      tagline: 'Unlimited Access',
      price: 399,
      period: 'month',
      stripeLink: stripePaymentLinks.elite,
      color: 'amber',
      highlights: ['Unlimited Chats', 'Unlimited Messages', '24/7 Phone Support'],
      features: [
        { text: 'Empty Legs Access', included: true, icon: Plane },
        { text: 'Restaurant Reservations', included: true, icon: UtensilsCrossed },
        { text: 'Ground Transport', included: true, icon: Car },
        { text: 'Delicacies & Cigars', included: true, icon: Wine },
        { text: 'Winery Access', included: true, icon: Wine },
        { text: 'VIP Catering', included: true, icon: UtensilsCrossed },
        { text: 'Luxury Travel Designer', included: true, icon: Map },
        { text: 'MEDEVAC Services', included: true, icon: HeartPulse },
        { text: 'Concierge Services', included: true, icon: Users },
        { text: 'Group Charter', included: true, icon: Users },
        { text: 'Event Booking', included: true, icon: Calendar },
        { text: 'Break the Price', included: true, icon: Star },
        { text: '2 Free Airport Transfers/mo', included: true, icon: Car },
        { text: 'MembershipX Card', included: true, icon: CreditCard },
        { text: 'VIP Event Invites', included: true, icon: Star }
      ]
    }
  ];

  const handlePlanClick = async (plan) => {
    console.log('🛒 Plan clicked:', plan.id, 'stripeLink:', plan.stripeLink);

    if (onUpgrade) {
      onUpgrade(plan.id);
      return;
    }

    if (!plan.stripeLink) {
      console.warn('No Stripe payment link configured for', plan.id);
      alert('Payment link not configured. Please contact support.');
      return;
    }

    // Build URL with parameters for Stripe Payment Link
    const params = new URLSearchParams();

    // Add user email for prefilled customer
    if (user?.email) {
      params.set('prefilled_email', user.email);
    }

    // Add client_reference_id with user_id and tier for webhook to identify the user
    if (user?.id) {
      params.set('client_reference_id', `${user.id}:${plan.id}`);
    }

    const url = params.toString()
      ? `${plan.stripeLink}?${params.toString()}`
      : plan.stripeLink;

    console.log('🔗 Redirecting to Stripe payment:', { tier: plan.id, userId: user?.id, url, isNative });

    if (isNative) {
      try {
        await Browser.open({ url, presentationStyle: 'fullscreen' });
      } catch (error) {
        console.error('Failed to open browser:', error);
        window.location.href = url;
      }
    } else {
      window.location.href = url;
    }
  };

  const toggleExpand = (planId, e) => {
    e.stopPropagation();
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div
        className="bg-white/95 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative border border-white/20"
        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100/80 bg-white/60" style={{ backdropFilter: 'blur(10px)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Crown size={20} className="text-amber-500" />
                Membership Plans
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Choose the perfect plan for your luxury travel needs</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/60 rounded-xl transition-colors border border-gray-200/50"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="space-y-3">
            {plans.map((plan) => {
              const isCurrentPlan = currentTier === plan.id;
              const isExpanded = expandedPlan === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white/70 border border-gray-200/60 rounded-xl transition-all duration-200 overflow-hidden hover:border-gray-300/70 ${isCurrentPlan ? 'opacity-60' : ''}`}
                  style={{ backdropFilter: 'blur(10px)' }}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-gray-900 text-white px-3 py-1 text-[10px] font-semibold rounded-bl-xl">
                      MOST POPULAR
                    </div>
                  )}

                  {/* Elite Badge */}
                  {plan.color === 'amber' && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 text-[10px] font-semibold rounded-bl-xl">
                      PREMIUM
                    </div>
                  )}

                  {/* Main Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/60 text-gray-600 border border-gray-200/50"
                          style={{ backdropFilter: 'blur(8px)' }}
                        >
                          <Crown size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">{plan.name}</h3>
                          <p className="text-xs text-gray-500">{plan.tagline}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-2xl font-bold text-gray-900">${plan.price}</span>
                          <span className="text-xs text-gray-400">/{plan.period}</span>
                        </div>
                      </div>
                    </div>

                    {/* Highlights - Monochromatic */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {plan.highlights.map((highlight, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-full text-[10px] font-medium bg-white/50 text-gray-600 border border-gray-200/50"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={(e) => toggleExpand(plan.id, e)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mt-3 transition-colors px-2 py-1 rounded-lg hover:bg-white/50"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {isExpanded ? 'Hide features' : 'View all features'}
                    </button>

                    {/* Expanded Features */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-100/60 grid grid-cols-2 gap-2">
                        {plan.features.map((feature, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 text-xs px-2 py-1 rounded-lg ${
                              feature.included ? 'text-gray-700 bg-white/30' : 'text-gray-400'
                            }`}
                          >
                            {feature.included ? (
                              <Check size={12} className="text-emerald-500 flex-shrink-0" />
                            ) : (
                              <X size={12} className="text-gray-300 flex-shrink-0" />
                            )}
                            <span className={!feature.included ? 'line-through opacity-60' : ''}>
                              {feature.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Button - Monochromatic light gray glass */}
                    <button
                      onClick={() => !isCurrentPlan && handlePlanClick(plan)}
                      disabled={isCurrentPlan}
                      className={`w-full mt-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isCurrentPlan
                          ? 'bg-gray-100/50 text-gray-400 cursor-not-allowed border border-gray-200/40'
                          : 'bg-white/60 text-gray-700 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/60'
                      }`}
                      style={{ backdropFilter: 'blur(8px)' }}
                    >
                      {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <p className="text-center text-xs text-gray-400 mt-4 px-4 py-2 bg-white/30 rounded-lg mx-auto inline-block w-full">
            All plans include access to our AI-powered travel concierge. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
