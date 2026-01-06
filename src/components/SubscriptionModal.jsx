import React, { useState } from 'react';
import { X, Check, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const SubscriptionModal = ({ isOpen, onClose, currentTier = null, onUpgrade, onToast, blockerReason = null }) => {
  const { user } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [expandedPlan, setExpandedPlan] = useState(null);

  const normalizedCurrentTier = currentTier?.toLowerCase();

  const stripePaymentLinks = {
    essential: import.meta.env.VITE_STRIPE_ESSENTIAL_PAYMENT_LINK || '',
    explorer: import.meta.env.VITE_STRIPE_STARTER_PAYMENT_LINK || import.meta.env.VITE_STRIPE_EXPLORER_PAYMENT_LINK || '',
    traveller: import.meta.env.VITE_STRIPE_PRO_PAYMENT_LINK || import.meta.env.VITE_STRIPE_TRAVELLER_PAYMENT_LINK || '',
    elite: import.meta.env.VITE_STRIPE_ELITE_PAYMENT_LINK || ''
  };

  const plans = [
    {
      id: 'essential',
      name: 'Essential',
      price: 19,
      chats: '10 chats',
      messages: '5 msgs/chat',
      ai: 'Essential',
      stripeLink: stripePaymentLinks.essential,
      features: [
        'Empty Legs Search & Booking',
        'Restaurant Search',
        'Private Jet Search',
        'General Travel Queries'
      ]
    },
    {
      id: 'explorer',
      name: 'Explorer',
      price: 99,
      chats: '5 chats',
      messages: '10 msgs/chat',
      ai: 'Sphera',
      stripeLink: stripePaymentLinks.explorer,
      features: [
        'Private Jets & Helicopters',
        'Ground Transport',
        'Restaurant Reservations',
        'Delicacies, Cigars & Winery',
        'Catering Services',
        'Luxury Travel Designer'
      ]
    },
    {
      id: 'traveller',
      name: 'Traveller',
      price: 199,
      chats: '10 chats',
      messages: '25 msgs/chat',
      ai: 'Sphera',
      popular: true,
      stripeLink: stripePaymentLinks.traveller,
      features: [
        'All Explorer Features',
        'MEDEVAC Services',
        'Concierge Services',
        'Group Charter',
        'Event Booking',
        'Break the Price'
      ]
    },
    {
      id: 'elite',
      name: 'Elite Club',
      price: 999,
      chats: 'Unlimited',
      messages: 'Unlimited',
      ai: 'Sphera',
      elite: true,
      stripeLink: stripePaymentLinks.elite,
      features: [
        'All Traveller Features',
        '24/7 Phone Coordination',
        '2 Free Airport Transfers/mo',
        'MembershipX Card',
        'VIP Event Invites',
        'Dedicated Account Manager'
      ]
    }
  ];

  const showToast = (message, type = 'info') => {
    if (onToast) onToast({ message, type });
    else alert(message);
  };

  const handlePlanClick = async (plan, e) => {
    e.stopPropagation();

    if (normalizedCurrentTier === plan.id) {
      showToast(`You're already on ${plan.name}!`, 'info');
      return;
    }

    if (onUpgrade) {
      onUpgrade(plan.id);
      return;
    }

    if (!plan.stripeLink) {
      showToast('Payment link not configured.', 'error');
      return;
    }

    setLoadingPlan(plan.id);

    const params = new URLSearchParams();
    if (user?.email) params.set('prefilled_email', user.email);
    if (user?.id) params.set('client_reference_id', `${user.id}:${plan.id}`);

    const url = params.toString() ? `${plan.stripeLink}?${params.toString()}` : plan.stripeLink;

    await new Promise(resolve => setTimeout(resolve, 300));

    if (isNative) {
      try {
        await Browser.open({ url, presentationStyle: 'fullscreen' });
      } catch {
        setLoadingPlan(null);
        window.location.href = url;
      }
    } else {
      window.location.href = url;
    }
  };

  const toggleExpand = (planId) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  const getBlockerMessage = () => {
    switch (blockerReason) {
      case 'no_subscription': return 'Subscribe to start using AI chat';
      case 'chat_limit': return 'Monthly chat limit reached';
      case 'message_limit': return 'Message limit reached';
      case 'feature_restricted': return 'Upgrade required';
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div
        className="bg-white/95 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-gray-200/60"
        style={{ backdropFilter: 'blur(20px)' }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200/40">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-light text-gray-900">Membership Plans</h2>
              {blockerReason && (
                <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/50 text-[11px] text-amber-700">
                  <Sparkles size={10} className="text-amber-500" />
                  {getBlockerMessage()}
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100/60 rounded-xl transition-all">
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Plans - Vertical Scrollable */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {plans.map((plan) => {
            const isCurrent = normalizedCurrentTier === plan.id;
            const isLoading = loadingPlan === plan.id;
            const isExpanded = expandedPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : 'bg-white/60 border-gray-200/60 hover:border-gray-300'
                }`}
              >
                {/* Main Row - Clickable */}
                <div
                  onClick={() => toggleExpand(plan.id)}
                  className="flex items-center justify-between p-3 cursor-pointer"
                >
                  {/* Left: Plan Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{plan.name}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-emerald-500 text-white">
                          CURRENT
                        </span>
                      )}
                      {plan.popular && !isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-gray-900 text-white">
                          POPULAR
                        </span>
                      )}
                      {plan.elite && !isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-amber-500 text-white">
                          ELITE
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp size={14} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={14} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                      <span>{plan.chats}</span>
                      <span>•</span>
                      <span>{plan.messages}</span>
                      <span>•</span>
                      <span>{plan.ai}</span>
                    </div>
                  </div>

                  {/* Right: Price + Button */}
                  <div className="flex items-center gap-3 ml-3">
                    <div className="text-right">
                      <span className="text-lg font-light text-gray-900">${plan.price}</span>
                      <span className="text-[10px] text-gray-400">/mo</span>
                    </div>
                    <button
                      onClick={(e) => handlePlanClick(plan, e)}
                      disabled={isLoading || isCurrent}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isCurrent
                          ? 'bg-emerald-100 text-emerald-700 cursor-default'
                          : isLoading
                          ? 'bg-gray-100 text-gray-400 cursor-wait'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : isCurrent ? (
                        <Check size={12} />
                      ) : (
                        'Select'
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Features */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-1">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                          <Check size={10} className="text-emerald-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <p className="text-center text-[10px] text-gray-400">
            Cancel anytime • Instant access
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
