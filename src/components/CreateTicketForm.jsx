import React, { useState } from 'react';
import { MessageCircle, AlertCircle, HelpCircle, Settings, Send } from 'lucide-react';

const CreateTicketForm = () => {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'normal',
    ticketType: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ticketTypes = [
    { id: 'general', label: 'General Inquiry', icon: MessageCircle },
    { id: 'technical', label: 'Technical Support', icon: Settings },
    { id: 'consultation', label: 'Consultation Request', icon: HelpCircle },
    { id: 'urgent', label: 'Urgent Issue', icon: AlertCircle }
  ];

  const priorities = [
    { id: 'low', label: 'Low' },
    { id: 'normal', label: 'Normal' },
    { id: 'high', label: 'High' },
    { id: 'urgent', label: 'Urgent' }
  ];

  const handleSubmit = () => {
    if (!formData.subject.trim() || !formData.description.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    setTimeout(() => {
      alert('Ticket created successfully!');
      setFormData({
        subject: '',
        description: '',
        priority: 'normal',
        ticketType: 'general'
      });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full bg-gray-100 rounded-2xl p-6">
      <div className="bg-white rounded-2xl shadow-md border border-gray-200">
        <div className="p-8 space-y-8">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              What type of support do you need?
            </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ticketTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                        formData.ticketType === type.id
                          ? 'border-gray-900 bg-gray-900 shadow-lg scale-105'
                          : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 hover:shadow-md'
                      }`}
                      onClick={() => handleInputChange('ticketType', type.id)}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Icon 
                          size={24} 
                          className={formData.ticketType === type.id ? 'text-white' : 'text-gray-700'}
                        />
                        <span className={`text-xs font-medium text-center ${
                          formData.ticketType === type.id ? 'text-white' : 'text-gray-700'
                        }`}>
                          {type.label}
                        </span>
                      </div>
                      {formData.ticketType === type.id && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="block text-sm font-semibold text-gray-800">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-gray-900 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-400"
                placeholder="Brief summary of your issue"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-800">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-gray-900 focus:bg-white transition-all duration-200 resize-none text-gray-900 placeholder-gray-400"
                placeholder="Please describe your issue in detail. Include any relevant information that might help us assist you better..."
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Priority Level
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {priorities.map((priority) => (
                  <button
                    key={priority.id}
                    type="button"
                    onClick={() => handleInputChange('priority', priority.id)}
                    className={`py-3 px-4 rounded-xl border-2 transition-all duration-300 font-medium text-sm ${
                      formData.priority === priority.id
                        ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                        : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400 hover:bg-gray-100 hover:shadow-md'
                    }`}
                  >
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>

        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  subject: '',
                  description: '',
                  priority: 'normal',
                  ticketType: 'general'
                });
              }}
              className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.subject.trim() || !formData.description.trim()}
              className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg"
            >
              {isSubmitting ? (
                'Creating...'
              ) : (
                <>
                  <Send size={18} />
                  Submit Ticket
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketForm;