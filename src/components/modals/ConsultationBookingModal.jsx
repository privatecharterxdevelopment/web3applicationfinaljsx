import React, { useState, useEffect } from 'react';
import { X, Calendar, Mail, MessageCircle, Clock, User, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ConsultationBookingModal = ({ isOpen, onClose, topic = 'tokenization' }) => {
  if (!isOpen) return null;

  const [selectedOption, setSelectedOption] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    topic: topic,
    message: '',
    preferredTime: '',
    urgency: 'normal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Load user data from Supabase when modal opens
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setFormData(prev => ({
          ...prev,
          name: user.user_metadata?.name || user.email?.split('@')[0] || '',
          email: user.email || ''
        }));
      }
    };
    if (isOpen) {
      loadUserData();
    }
  }, [isOpen]);

  const consultationOptions = [
    {
      id: 'zendesk',
      title: 'Book Expert Consultation',
      subtitle: 'Schedule a call with our tokenization specialists',
      icon: Calendar,
      description: 'Get personalized advice on tokenization strategies, fractional ownership models, and implementation timelines.',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
    },
    {
      id: 'email',
      title: 'Email Consultation Request',
      subtitle: 'Send detailed questions for written response',
      icon: Mail,
      description: 'Submit detailed questions and receive comprehensive written responses within 24 hours.',
      color: 'bg-green-50 hover:bg-green-100 border-green-200'
    },
    {
      id: 'chat',
      title: 'Live Chat Support',
      subtitle: 'Start instant messaging with our team',
      icon: MessageCircle,
      description: 'Get immediate answers to basic questions about tokenization and fractional ownership.',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        throw new Error('Please log in to submit a consultation request');
      }

      console.log('Creating consultation ticket for user:', currentUser.id);

      // Create support ticket directly in Supabase
      const ticketData = {
        user_id: currentUser.id,
        subject: `Tokenization Consultation Request - ${formData.topic}`,
        description: formData.message,
        status: 'pending',
        priority: formData.urgency || 'normal',
        tags: ['consultation', 'tokenization', 'web3', formData.topic],
        ticket_data: {
          ...formData,
          consultationType: selectedOption,
          type: 'consultation',
          zendeskId: '6GKFd6WxOGPjZNIFrggoADvCiUU9v0Wd8oqC'
        }
      };

      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert([ticketData])
        .select()
        .single();

      if (ticketError) {
        console.error('Error creating ticket:', ticketError);
        throw new Error('Failed to create consultation request: ' + ticketError.message);
      }

      console.log('Created ticket:', ticket);

      // Create initial message
      const messageData = {
        ticket_id: ticket.id,
        author_name: formData.name,
        author_email: formData.email,
        content: `Consultation request submitted:\n\nConsultation Type: ${selectedOption}\nTopic: ${formData.topic}\nCompany: ${formData.company || 'N/A'}\nPhone: ${formData.phone || 'N/A'}\nPreferred Time: ${formData.preferredTime || 'N/A'}\nUrgency: ${formData.urgency}\n\nMessage:\n${formData.message}`,
        is_public: true,
        message_type: 'comment'
      };

      const { error: messageError } = await supabase
        .from('support_ticket_messages')
        .insert([messageData]);

      if (messageError) {
        console.error('Error creating initial message:', messageError);
        // Don't fail the whole process if message creation fails
      }

      setSubmitted(true);
      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setSelectedOption(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error creating consultation request:', error);
      alert('Failed to submit consultation request: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Consultation Request Submitted!
          </h3>
          <p className="text-gray-600 mb-4">
            We've received your {selectedOption} request. Our tokenization experts will contact you within 24 hours.
          </p>
          <p className="text-sm text-gray-500">
            You can track this request in your dashboard under "Chat Support".
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Tokenization Consultation
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Get expert guidance on asset tokenization and fractional ownership
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {!selectedOption ? (
          /* Option Selection */
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              How would you like to consult with our experts?
            </h3>
            
            {consultationOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className={`w-full p-4 border-2 rounded-xl transition-all text-left ${option.color}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <IconComponent size={24} className="text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{option.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{option.subtitle}</p>
                      <p className="text-xs text-gray-500 mt-2">{option.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Consultation Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl">
              <h3 className="font-medium text-blue-900 mb-2">
                {consultationOptions.find(opt => opt.id === selectedOption)?.title}
              </h3>
              <p className="text-sm text-blue-700">
                {consultationOptions.find(opt => opt.id === selectedOption)?.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {selectedOption === 'zendesk' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time
                  </label>
                  <select
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select preferred time</option>
                    <option value="morning">Morning (9 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                    <option value="evening">Evening (5 PM - 8 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level
                  </label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low - General inquiry</option>
                    <option value="normal">Normal - Planning phase</option>
                    <option value="high">High - Active project</option>
                    <option value="urgent">Urgent - Immediate need</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Details about your tokenization needs *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Please describe your asset tokenization requirements, timeline, and any specific questions you have..."
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setSelectedOption(null)}
                className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Consultation Request'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ConsultationBookingModal;