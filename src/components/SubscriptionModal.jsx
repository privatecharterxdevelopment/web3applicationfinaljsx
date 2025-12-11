import React from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const SubscriptionModal = ({ isOpen, onClose, currentTier = 'explorer', onUpgrade }) => {
  const { user } = useAuth();
  const isNative = Capacitor.isNativePlatform();

  // Use environment variables for Stripe payment links
  const stripePaymentLinks = {
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
      stripeLink: stripePaymentLinks.starter,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/Privatecharterx,map.png',
      tags: ['5 AI Chats/mo', '50 Messages/chat', 'Email Support']
    },
    {
      id: 'pro',
      name: 'PROFESSIONAL',
      tagline: 'Most Popular',
      price: 40,
      period: 'month',
      stripeLink: stripePaymentLinks.pro,
      popular: true,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/ethereum-logoprivatecharterx-dots.svg',
      tags: ['20 AI Chats/mo', '100 Messages/chat', 'Priority Support', 'Dedicated Manager']
    },
    {
      id: 'elite',
      name: 'ELITE',
      tagline: 'Unlimited Access',
      price: 130,
      period: 'month',
      stripeLink: stripePaymentLinks.elite,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/Privatecharterx,map.png',
      tags: ['Unlimited Chats', 'Unlimited Messages', '24/7 Concierge', 'Break the Price']
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
    // Format: userId:tierId (e.g., "abc123:starter")
    if (user?.id) {
      params.set('client_reference_id', `${user.id}:${plan.id}`);
    }

    const url = params.toString()
      ? `${plan.stripeLink}?${params.toString()}`
      : plan.stripeLink;

    console.log('🔗 Redirecting to Stripe payment:', { tier: plan.id, userId: user?.id, url, isNative });

    // Use Capacitor Browser for native apps (opens in-app browser like Safari View Controller)
    // This keeps user in the app and allows return after payment
    if (isNative) {
      try {
        await Browser.open({ url, presentationStyle: 'fullscreen' });
      } catch (error) {
        console.error('Failed to open browser:', error);
        // Fallback to window.location if Browser fails
        window.location.href = url;
      }
    } else {
      // Web: use window.location for redirect
      window.location.href = url;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] overflow-y-auto relative border border-gray-200/50">
        {/* Header - Compact */}
        <div className="p-4 border-b border-gray-100 relative">
          <h2 className="text-base font-semibold text-gray-900">Plans & Pricing</h2>
          <p className="text-xs text-gray-500 mt-0.5">Select the perfect plan for your needs</p>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Plans Grid - Compact Vertical Stack */}
        <div className="p-3">
          <div className="space-y-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => handlePlanClick(plan)}
                className={`group bg-white/50 backdrop-blur-sm border rounded-xl p-3 hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.01] ${
                  plan.popular ? 'border-gray-800 ring-1 ring-gray-800/10' : 'border-gray-200/60 hover:border-gray-300/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {plan.name}
                        </h3>
                        {plan.popular && (
                          <span className="bg-gray-900 text-white px-1.5 py-0.5 rounded text-[9px] font-medium">
                            POPULAR
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-[11px]">{plan.tagline}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-semibold text-gray-900">${plan.price}</span>
                    <span className="text-gray-400 text-xs">/{plan.period}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1">
                    {plan.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="bg-gray-100/80 px-1.5 py-0.5 rounded text-[9px] text-gray-600">
                        {tag}
                      </span>
                    ))}
                    {plan.tags.length > 3 && (
                      <span className="text-[9px] text-gray-400">+{plan.tags.length - 3} more</span>
                    )}
                  </div>

                  <button className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-[11px] font-medium">
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
