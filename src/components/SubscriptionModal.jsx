import React from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SubscriptionModal = ({ isOpen, onClose, currentTier = 'explorer', onUpgrade }) => {
  const { user } = useAuth();

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

  const handlePlanClick = (plan) => {
    if (onUpgrade) {
      onUpgrade(plan.id);
    } else if (plan.stripeLink) {
      // Add user email as prefilled customer if available
      const url = user?.email
        ? `${plan.stripeLink}?prefilled_email=${encodeURIComponent(user.email)}`
        : plan.stripeLink;
      window.location.href = url;
    } else {
      console.warn('No Stripe payment link configured for', plan.id);
      alert('Payment link not configured. Please contact support.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#fafafa] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        {/* Header - Left Aligned */}
        <div className="p-6 border-b border-gray-200 relative">
          <h2 className="text-2xl font-light text-gray-900 tracking-tight mb-1">Plans & Pricing</h2>
          <p className="text-sm text-gray-500">Select the perfect plan for your needs</p>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Plans Grid - Only 3 Plans */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => handlePlanClick(plan)}
                className={`group bg-white/50 backdrop-blur-sm border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer ${
                  plan.popular ? 'border-gray-900 ring-1 ring-gray-900/10' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {plan.popular && (
                  <div className="mb-4">
                    <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-medium">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {plan.name}
                </h3>
                <p className="text-gray-500 text-sm mb-3">{plan.tagline}</p>

                <div className="mb-4">
                  <span className="text-3xl font-light text-gray-900">${plan.price}</span>
                  <span className="text-gray-500 text-sm">/{plan.period}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {plan.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700 border border-gray-200">
                      {tag}
                    </span>
                  ))}
                </div>

                <button className="w-full py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                  Select Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
