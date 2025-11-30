import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const PricingPackages = ({ onClose }) => {
  const { user } = useAuth();
  const [showBusinessModal, setShowBusinessModal] = useState(false);
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

  // Stripe Payment Links - replace these with your actual Stripe Payment Link URLs
  // Create Payment Links at: https://dashboard.stripe.com/payment-links
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
    // If user is not logged in, show login modal or redirect
    if (!user) {
      // Store selected plan in sessionStorage to resume after login
      sessionStorage.setItem('pendingSubscription', plan.id);
      window.location.href = '/login?redirect=subscribe';
      return;
    }

    setProcessingPlan(plan.id);

    try {
      // Check if using Payment Links (simpler setup) or Checkout Sessions (more control)
      const paymentLink = STRIPE_PAYMENT_LINKS[plan.id];

      if (paymentLink) {
        // Use Stripe Payment Links (recommended for simplicity)
        // Append client_reference_id for user tracking
        const url = new URL(paymentLink);
        url.searchParams.set('client_reference_id', user.id);
        url.searchParams.set('prefilled_email', user.email || '');
        window.location.href = url.toString();
      } else {
        // Fallback: Create Checkout Session via Supabase Edge Function
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
      // Create support ticket in Supabase
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
    <div className="min-h-screen bg-transparent py-6 relative">
      <div className="max-w-full mx-auto px-4 md:px-8">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
          >
            <X size={24} className="text-gray-400" />
          </button>
        )}

        {/* Header - Left Aligned */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-light text-gray-900 tracking-tight mb-1">Plans & Pricing</h1>
          <p className="text-sm text-gray-600">Select the perfect plan for your needs</p>
        </div>

        {/* Plans Grid - Always visible */}
        <div className="space-y-4 mb-6 max-w-6xl">
          {/* Three Main Plans in Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => handlePlanClick(plan)}
                className={`group bg-white/35 backdrop-blur-xl border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer ${
                  plan.popular ? 'border-gray-900 ring-1 ring-gray-900/10' : 'border-gray-300/50 hover:border-gray-400/50'
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

                <div className="mb-3">
                  <span className="text-3xl font-light text-gray-900">${plan.price}</span>
                  <span className="text-gray-500 text-sm">/{plan.period}</span>
                </div>

                {/* Chat Limit Highlight */}
                <div className="mb-4 p-3 bg-gray-50/80 rounded-lg border border-gray-200/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-600">AI Conversations</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {plan.chatsPerMonth === 'Unlimited' ? 'Unlimited' : `${plan.chatsPerMonth}/mo`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-600">Messages per Chat</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {plan.messagesPerChat === 'Unlimited' ? 'Unlimited' : plan.messagesPerChat}
                    </span>
                  </div>
                  {plan.breakThePrice && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Break the Price</span>
                      <span className="text-sm font-semibold text-amber-600">
                        {plan.id === 'elite' ? 'Unlimited' : 'Costs 1 chat'}
                      </span>
                    </div>
                  )}
                  {plan.id === 'elite' && (
                    <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200/50">+ 24/7 Live Broker Assistance</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {plan.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700 border border-gray-200">
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  disabled={processingPlan === plan.id}
                  className="w-full py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingPlan === plan.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Select Plan'
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Business Solutions Card - Full Width */}
          <div
            onClick={() => setShowBusinessModal(true)}
            className="group bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-2xl p-6 hover:shadow-lg hover:border-gray-400/50 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Business Solutions
                </h3>
                <p className="text-gray-500 text-sm mb-3">Custom Enterprise Plans</p>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 max-w-2xl">
                  Tailored solutions for your organization. Unlimited conversations, dedicated support team, custom integrations,
                  and white-label options.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700 border border-gray-200">Unlimited Access</span>
                  <span className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700 border border-gray-200">Dedicated Team</span>
                  <span className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700 border border-gray-200">Custom Integration</span>
                  <span className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700 border border-gray-200">White Label</span>
                </div>
              </div>
              <button className="px-6 py-2.5 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-300 whitespace-nowrap">
                Contact Us
              </button>
            </div>
          </div>
        </div>

        {/* Business Solutions Modal */}
        {showBusinessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-light text-gray-900 mb-2">Business Solutions Request</h2>
                <p className="text-gray-600 text-sm">Tell us about your requirements and we'll get back to you within 24 hours.</p>
              </div>

            {submitMessage && (
              <div className={`mb-6 p-4 rounded-lg ${submitMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {submitMessage}
              </div>
            )}

            <form onSubmit={handleBusinessRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={businessForm.name}
                  onChange={(e) => setBusinessForm({...businessForm, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={businessForm.email}
                  onChange={(e) => setBusinessForm({...businessForm, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
                <input
                  type="text"
                  required
                  value={businessForm.company}
                  onChange={(e) => setBusinessForm({...businessForm, company: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={businessForm.phone}
                  onChange={(e) => setBusinessForm({...businessForm, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requirements *</label>
                <textarea
                  required
                  rows={4}
                  value={businessForm.requirements}
                  onChange={(e) => setBusinessForm({...businessForm, requirements: e.target.value})}
                  placeholder="Tell us about your business needs, expected usage, required integrations, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBusinessModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default PricingPackages;
