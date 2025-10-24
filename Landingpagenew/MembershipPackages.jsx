import React, { useState, useEffect } from 'react';
import { Check, Zap, MessageSquare, Mic, Crown, ArrowLeft } from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import { useAuth } from '../../context/AuthContext';

const MembershipPackages = ({ onBack }) => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadUserProfile();
    }
  }, [user?.id]);

  const loadUserProfile = async () => {
    if (!user?.id) return;
    try {
      const profile = await subscriptionService.getUserProfile(user.id);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
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
      color: 'gray',
      description: 'Perfect for exploring luxury travel options and getting familiar with Sphera AI'
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
      color: 'blue',
      description: 'Great for occasional travelers who need AI assistance for planning luxury trips'
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
      color: 'black',
      description: 'Ideal for frequent travelers and professionals who need comprehensive AI concierge services'
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
      color: 'purple',
      description: 'Perfect for business teams and organizations that require extensive luxury travel coordination'
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
      color: 'gold',
      description: 'Ultimate VIP experience with unlimited access and dedicated personal service'
    }
  ];

  const handleSelectPlan = (plan) => {
    if (plan.id === userProfile?.subscription_tier) {
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
      // TODO: Implement Stripe checkout
      console.log('Upgrade to:', selectedPlan.id);
      alert(`Stripe integration coming soon! You selected: ${selectedPlan.name} - $${selectedPlan.price}/month`);
    } catch (error) {
      console.error('Error upgrading:', error);
      alert('Failed to upgrade subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span className="font-medium">Back</span>
                </button>
              )}
              <h1 className="text-4xl font-light text-black mb-2">Membership Plans</h1>
              <p className="text-lg text-gray-600">Choose the perfect plan for your luxury travel needs</p>
            </div>
            {userProfile && (
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Current Plan</p>
                <p className="text-xl font-semibold text-black capitalize">
                  {userProfile.subscription_tier}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.id === userProfile?.subscription_tier;
            const isSelected = selectedPlan?.id === plan.id;
            const canSelect = plan.id !== 'explorer' && !isCurrentPlan;

            return (
              <div
                key={plan.id}
                onClick={() => canSelect && handleSelectPlan(plan)}
                className={`relative rounded-2xl border-2 transition-all duration-300 transform ${
                  plan.popular
                    ? 'border-black bg-black text-white scale-105 shadow-2xl'
                    : isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-xl scale-105'
                    : isCurrentPlan
                    ? 'border-green-500 bg-green-50 shadow-xl'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                } ${canSelect ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg ${
                    plan.popular ? 'bg-white text-black' : 'bg-black text-white'
                  }`}>
                    {plan.badge}
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && !plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold bg-green-500 text-white shadow-lg">
                    CURRENT PLAN
                  </div>
                )}

                <div className="p-8">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                      plan.popular ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      <Icon size={32} className={plan.popular ? 'text-white' : 'text-gray-600'} />
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className={`text-xl font-bold mb-3 ${
                    plan.popular ? 'text-white' : 'text-black'
                  }`}>
                    {plan.name}
                  </h3>

                  {/* Description */}
                  <p className={`text-sm mb-6 leading-relaxed ${
                    plan.popular ? 'text-white/80' : 'text-gray-600'
                  }`}>
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    {plan.price !== null ? (
                      <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-light ${
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
                      <span className={`text-4xl font-light ${
                        plan.popular ? 'text-white' : 'text-black'
                      }`}>
                        Free
                      </span>
                    ) : (
                      <span className={`text-4xl font-light ${
                        plan.popular ? 'text-white' : 'text-black'
                      }`}>
                        Unlimited
                      </span>
                    )}
                  </div>

                  {/* Chats */}
                  <div className="mb-8 pb-6 border-b border-gray-200/20">
                    <p className={`text-xs uppercase tracking-wider mb-2 ${
                      plan.popular ? 'text-white/60' : 'text-gray-400'
                    }`}>
                      AI Conversations
                    </p>
                    <p className={`text-2xl font-light ${
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
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check size={18} className={`flex-shrink-0 mt-0.5 ${
                          plan.popular ? 'text-white' : 'text-green-500'
                        }`} />
                        <span className={`text-sm leading-relaxed ${
                          plan.popular ? 'text-white/90' : 'text-gray-700'
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
                    className={`w-full py-4 rounded-xl text-sm font-bold transition-all ${
                      isCurrentPlan
                        ? 'bg-green-500 text-white cursor-default'
                        : isSelected
                        ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
                        : plan.popular
                        ? 'bg-white text-black hover:bg-gray-100 shadow-lg'
                        : canSelect
                        ? 'bg-black text-white hover:bg-gray-800 shadow-lg'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isCurrentPlan ? 'Current Plan' : isSelected ? 'Selected ✓' : 'Select Plan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Plan Summary */}
        {selectedPlan && (
          <div className="mt-12 bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Selected Plan</p>
                <h3 className="text-2xl font-bold text-black mb-2">{selectedPlan.name}</h3>
                <p className="text-gray-600">{selectedPlan.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Price</p>
                <p className="text-4xl font-light text-black mb-4">
                  ${selectedPlan.price}
                  <span className="text-lg text-gray-400">/{selectedPlan.period}</span>
                </p>
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className={`px-8 py-4 rounded-xl text-base font-bold transition-all ${
                    loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  {loading ? 'Processing...' : 'Continue to Payment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-black mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-black mb-2">What counts as a "conversation"?</h3>
              <p className="text-gray-600">
                A conversation includes all messages exchanged from the time you start a new chat until you create another chat.
                Each conversation can have unlimited messages within it.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade your plan at any time. When you upgrade, you'll be charged a prorated amount for the remainder
                of your billing cycle. Downgrades take effect at the end of your current billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-2">What if I run out of conversations?</h3>
              <p className="text-gray-600">
                You can either upgrade to a higher tier plan or purchase one-time chat top-ups. Your conversations reset at the
                beginning of each billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-2">Do unused conversations roll over?</h3>
              <p className="text-gray-600">
                No, unused conversations do not roll over to the next month. However, all your chat history is saved permanently
                so you can always review past conversations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipPackages;
