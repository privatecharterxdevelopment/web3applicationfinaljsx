import React, { useState, useEffect } from 'react';
import { X, Check, Zap, MessageSquare, Mic, Crown } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';

const SubscriptionModal = ({ isOpen, onClose, currentTier = 'explorer', onUpgrade }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tiers, setTiers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadTiers();
    }
  }, [isOpen]);

  const loadTiers = async () => {
    try {
      const data = await subscriptionService.getSubscriptionTiers();
      setTiers(data);
    } catch (error) {
      console.error('Error loading tiers:', error);
    }
  };

  const plans = [
    {
      id: 'explorer',
      name: 'EXPLORER',
      price: null,
      chats: 2,
      period: 'lifetime',
      badge: 'FREE',
      icon: MessageSquare,
      features: [
        '2 AI Conversations (lifetime)',
        'Text chat only',
        'Try Sphera AI',
        'Browse all services',
        'View prices & availability'
      ],
      color: 'gray'
    },
    {
      id: 'starter',
      name: 'STARTER',
      price: 29,
      chats: 10,
      period: 'month',
      icon: Zap,
      features: [
        '10 Full Conversations/month',
        'Voice & Text Support',
        'Real-time Availability',
        'Basic Route Planning',
        'Email Support (24h response)',
        'Browse all services'
      ],
      color: 'blue'
    },
    {
      id: 'pro',
      name: 'PROFESSIONAL',
      price: 79,
      chats: 30,
      period: 'month',
      badge: 'MOST POPULAR',
      popular: true,
      icon: Mic,
      features: [
        '30 Full Conversations/month',
        'Everything in Starter',
        'Priority Support (12h response)',
        'Advanced Analytics',
        'Booking History',
        'Multi-service cart system',
        'Custom Flight Requests'
      ],
      color: 'black'
    },
    {
      id: 'business',
      name: 'BUSINESS',
      price: 199,
      chats: 100,
      period: 'month',
      icon: Crown,
      features: [
        '100 Full Conversations/month',
        'Everything in Pro',
        'Dedicated Concierge Manager',
        '24/7 Priority Support (2h response)',
        'White Glove Service',
        'Team collaboration (up to 5 users)',
        'Advanced search filters',
        'Custom integrations'
      ],
      color: 'purple'
    },
    {
      id: 'elite',
      name: 'ELITE',
      price: 499,
      chats: null,
      period: 'month',
      badge: 'VIP',
      icon: Crown,
      features: [
        '♾️ Unlimited Conversations',
        'Everything in Business',
        'Dedicated Account Team',
        'Instant Support (30min response)',
        'VIP Treatment',
        'Custom API Access',
        'Bulk request management',
        'Priority aircraft sourcing',
        'Exclusive deals & offers'
      ],
      color: 'gold'
    }
  ];

  const handleSelectPlan = async (plan) => {
    if (plan.id === currentTier) {
      return; // Already on this plan
    }

    if (plan.id === 'explorer') {
      return; // Can't downgrade to free
    }

    setSelectedPlan(plan);
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    try {
      // This will trigger Stripe checkout
      if (onUpgrade) {
        await onUpgrade(selectedPlan.id);
      }
      onClose();
    } catch (error) {
      console.error('Error upgrading:', error);
      alert('Failed to upgrade subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-100">
          <div>
            <h2 className="text-3xl font-light text-black mb-2">Choose Your Plan</h2>
            <p className="text-gray-500 font-light">Unlock the full power of Sphera AI</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Plans Grid */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = plan.id === currentTier;
              const isSelected = selectedPlan?.id === plan.id;
              const canSelect = plan.id !== 'explorer' && !isCurrentPlan;

              return (
                <div
                  key={plan.id}
                  onClick={() => canSelect && handleSelectPlan(plan)}
                  className={`relative rounded-2xl border-2 transition-all duration-300 ${
                    plan.popular
                      ? 'border-black bg-black text-white scale-105'
                      : isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : isCurrentPlan
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  } ${canSelect ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${
                      plan.popular ? 'bg-white text-black' : 'bg-black text-white'
                    }`}>
                      {plan.badge}
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && !plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                      CURRENT PLAN
                    </div>
                  )}

                  <div className="p-6">
                    {/* Icon */}
                    <div className="mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        plan.popular ? 'bg-white/20' : 'bg-gray-100'
                      }`}>
                        <Icon size={24} className={plan.popular ? 'text-white' : 'text-gray-600'} />
                      </div>
                    </div>

                    {/* Name */}
                    <h3 className={`text-lg font-medium mb-2 ${
                      plan.popular ? 'text-white' : 'text-black'
                    }`}>
                      {plan.name}
                    </h3>

                    {/* Price */}
                    <div className="mb-6">
                      {plan.price !== null ? (
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-light ${
                            plan.popular ? 'text-white' : 'text-black'
                          }`}>
                            ${plan.price}
                          </span>
                          <span className={`text-sm ${
                            plan.popular ? 'text-white/60' : 'text-gray-400'
                          }`}>
                            /{plan.period}
                          </span>
                        </div>
                      ) : plan.id === 'explorer' ? (
                        <span className={`text-3xl font-light ${
                          plan.popular ? 'text-white' : 'text-black'
                        }`}>
                          Free
                        </span>
                      ) : (
                        <span className={`text-3xl font-light ${
                          plan.popular ? 'text-white' : 'text-black'
                        }`}>
                          Unlimited
                        </span>
                      )}
                    </div>

                    {/* Chats */}
                    <div className="mb-6 pb-6 border-b border-gray-200/20">
                      <p className={`text-xs uppercase tracking-wider mb-1 ${
                        plan.popular ? 'text-white/60' : 'text-gray-400'
                      }`}>
                        Conversations
                      </p>
                      <p className={`text-xl font-light ${
                        plan.popular ? 'text-white' : 'text-black'
                      }`}>
                        {plan.chats !== null ? (
                          <>
                            {plan.chats} <span className="text-sm opacity-60">
                              {plan.period === 'lifetime' ? 'lifetime' : 'per month'}
                            </span>
                          </>
                        ) : (
                          'Unlimited'
                        )}
                      </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-6">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check size={16} className={`flex-shrink-0 mt-0.5 ${
                            plan.popular ? 'text-white' : 'text-green-500'
                          }`} />
                          <span className={`text-xs ${
                            plan.popular ? 'text-white/80' : 'text-gray-600'
                          }`}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => canSelect && handleSelectPlan(plan)}
                      disabled={!canSelect}
                      className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
                        isCurrentPlan
                          ? 'bg-green-500 text-white cursor-default'
                          : isSelected
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : plan.popular
                          ? 'bg-white text-black hover:bg-gray-100'
                          : canSelect
                          ? 'bg-black text-white hover:bg-gray-800'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isCurrentPlan ? 'Current Plan' : isSelected ? 'Selected' : 'Select Plan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-8 border-t border-gray-100 bg-gray-50">
          <div>
            <p className="text-sm text-gray-600">
              {selectedPlan ? (
                <>
                  You selected <strong>{selectedPlan.name}</strong> - ${selectedPlan.price}/month
                </>
              ) : (
                'Select a plan to continue'
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleUpgrade}
              disabled={!selectedPlan || loading}
              className={`px-8 py-3 rounded-xl text-sm font-medium transition-all ${
                selectedPlan && !loading
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Processing...' : 'Continue to Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
