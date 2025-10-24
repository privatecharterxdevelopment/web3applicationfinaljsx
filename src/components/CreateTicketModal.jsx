import React, { useState } from 'react';
import { X, MessageCircle, AlertCircle, HelpCircle, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';

const CreateTicketModal = ({ isOpen, onClose, onTicketCreated, user }) => {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'normal',
    ticketType: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ticketTypes = [
    { id: 'general', label: 'General Inquiry', icon: MessageCircle, description: 'General questions or requests' },
    { id: 'technical', label: 'Technical Support', icon: Settings, description: 'Technical issues or bugs' },
    { id: 'consultation', label: 'Consultation Request', icon: HelpCircle, description: 'Professional consultation services' },
    { id: 'urgent', label: 'Urgent Issue', icon: AlertCircle, description: 'Urgent matters requiring immediate attention' }
  ];

  const priorities = [
    { id: 'low', label: 'Low', description: 'Non-urgent, can wait' },
    { id: 'normal', label: 'Normal', description: 'Standard priority' },
    { id: 'high', label: 'High', description: 'Important, needs attention soon' },
    { id: 'urgent', label: 'Urgent', description: 'Critical, needs immediate attention' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Create the support ticket
      const ticketData = {
        user_id: user.id,
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority,
        status: 'pending',
        ticket_data: {
          type: formData.ticketType,
          source: 'dashboard',
          created_by: user.email
        }
      };

      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert(ticketData)
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create initial message
      const messageData = {
        ticket_id: ticket.id,
        author_name: user.user_metadata?.full_name || user.email,
        author_email: user.email,
        content: formData.description,
        is_public: true,
        message_type: 'comment'
      };

      const { error: messageError } = await supabase
        .from('support_ticket_messages')
        .insert(messageData);

      if (messageError) throw messageError;

      // Reset form
      setFormData({
        subject: '',
        description: '',
        priority: 'normal',
        ticketType: 'general'
      });

      // Close modal and refresh tickets
      onClose();
      if (onTicketCreated) onTicketCreated();

    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Support Ticket</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Ticket Type */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Ticket Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ticketTypes.map((type) => (
                <div
                  key={type.id}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.ticketType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleInputChange('ticketType', type.id)}
                >
                  <div className="flex items-start gap-3">
                    <type.icon size={20} className={formData.ticketType === type.id ? 'text-blue-600' : 'text-gray-500'} />
                    <div>
                      <h3 className={`font-medium ${formData.ticketType === type.id ? 'text-blue-900' : 'text-gray-900'}`}>
                        {type.label}
                      </h3>
                      <p className={`text-sm ${formData.ticketType === type.id ? 'text-blue-700' : 'text-gray-600'}`}>
                        {type.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-900 mb-2">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Brief description of your issue or request"
              required
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Priority</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {priorities.map((priority) => (
                <button
                  key={priority.id}
                  type="button"
                  onClick={() => handleInputChange('priority', priority.id)}
                  className={`p-3 text-sm border rounded-xl transition-all ${
                    formData.priority === priority.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{priority.label}</div>
                  <div className="text-xs opacity-75">{priority.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Please provide detailed information about your issue or request..."
              required
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.subject.trim() || !formData.description.trim()}
              className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;