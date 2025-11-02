import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const SubscriptionModal = ({ isOpen, onClose, currentTier = 'explorer', onUpgrade }) => {
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

  const plans = [
    {
      id: 'starter',
      name: 'STARTER',
      tagline: 'Get Started',
      price: 79,
      period: 'month',
      stripeLink: 'https://buy.stripe.com/starter',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/Privatecharterx,map.png',
      tags: ['Voice & Text', 'Real-time', 'Email Support']
    },
    {
      id: 'pro',
      name: 'PROFESSIONAL',
      tagline: 'Most Popular',
      price: 149,
      period: 'month',
      stripeLink: 'https://buy.stripe.com/pro',
      popular: true,
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/ethereum-logoprivatecharterx-dots.svg',
      tags: ['Priority', 'Analytics', 'Dedicated Manager', 'Custom Requests']
    },
    {
      id: 'elite',
      name: 'ELITE',
      tagline: 'Unlimited Access',
      price: 299,
      period: 'month',
      stripeLink: 'https://buy.stripe.com/elite',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/Privatecharterx,map.png',
      tags: ['Unlimited', '24/7 Concierge', 'API Access', 'White Glove']
    }
  ];

  const handlePlanClick = (plan) => {
    if (onUpgrade) {
      onUpgrade(plan.id);
    } else {
      window.location.href = plan.stripeLink;
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
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error submitting business request:', error);
      setSubmitMessage('Error submitting request. Please try again or email us at business@sphera.ai');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="bg-[#fafafa] rounded-3xl shadow-2xl w-full h-full md:max-w-6xl md:max-h-[90vh] md:h-auto overflow-y-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="text-center flex-1">
            <div className="h-px w-12 bg-black/20 mb-3 mx-auto" />
            <p className="text-xs tracking-[0.3em] uppercase text-black/40 mb-2 font-light">Pricing</p>
            <h2 className="text-2xl md:text-3xl font-light text-black tracking-tight mb-2">Choose Your Plan</h2>
            <p className="text-sm text-black/40 font-light">Select the perfect journey for your needs</p>
            <div className="h-px w-12 bg-black/20 mx-auto mt-3" />
          </div>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Plans Grid */}
        <div className="p-6 space-y-4 pb-6">
          {/* Three Main Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => handlePlanClick(plan)}
                className={`group bg-white border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer ${
                  plan.popular ? 'border-black ring-2 ring-black/10' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="mb-4">
                    <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-medium">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <h3 className="text-xl font-light text-gray-900 mb-1 leading-tight">
                  {plan.name}
                  <br />
                  <span className="text-gray-400 text-sm">{plan.tagline}</span>
                </h3>

                <div className="my-4">
                  <span className="text-4xl font-light text-gray-900">${plan.price}</span>
                  <span className="text-gray-400 text-sm">/{plan.period}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {plan.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
                  +
                </div>
              </div>
            ))}
          </div>

          {/* Business Solutions Card - Full Width */}
          <div
            onClick={() => setShowBusinessModal(true)}
            className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
          >
            <h3 className="text-xl font-light text-gray-900 mb-2 leading-tight">
              Business Solutions
              <br />
              <span className="text-gray-400 text-sm">Custom Enterprise Plans</span>
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Tailored solutions for your organization. Unlimited conversations, dedicated support team, custom integrations,
              and white-label options. Contact us to discuss your requirements.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-700">Unlimited Access</span>
              <span className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-700">Dedicated Team</span>
              <span className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-700">Custom Integration</span>
              <span className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-700">White Label</span>
              <span className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-700">SLA Guarantee</span>
            </div>
            <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
              +
            </div>
          </div>
        </div>

        {/* Business Solutions Modal */}
        {showBusinessModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-6">
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

export default SubscriptionModal;
