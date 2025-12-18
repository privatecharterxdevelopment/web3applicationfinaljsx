import React, { useState } from 'react';
import { X, Plane, MapPin, Calendar, Users, DollarSign, FileText, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface EmployeeBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated: () => void;
}

export const EmployeeBookingModal: React.FC<EmployeeBookingModalProps> = ({ 
  isOpen, 
  onClose, 
  onBookingCreated 
}) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    service_type: 'jet' as 'jet' | 'yacht' | 'helicopter' | 'car' | 'emptyleg',
    departure: '',
    arrival: '',
    departure_date: '',
    departure_time: '',
    return_date: '',
    return_time: '',
    passengers: 1,
    aircraft_preference: '',
    special_requests: '',
    estimated_budget: '',
    currency: 'USD',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!systemUser) {
        throw new Error('User not found in system');
      }

      // Create the booking
      const { data: booking, error } = await supabase
        .from('employee_bookings')
        .insert([{
          employee_id: systemUser.id,
          client_name: formData.client_name,
          client_email: formData.client_email,
          client_phone: formData.client_phone || null,
          service_type: formData.service_type,
          departure: formData.departure,
          arrival: formData.arrival,
          departure_date: formData.departure_date,
          departure_time: formData.departure_time || null,
          return_date: formData.return_date || null,
          return_time: formData.return_time || null,
          passengers: formData.passengers,
          aircraft_preference: formData.aircraft_preference || null,
          special_requests: formData.special_requests || null,
          estimated_budget: formData.estimated_budget ? parseFloat(formData.estimated_budget) : null,
          currency: formData.currency,
          priority: formData.priority,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      // Send notifications to business aviation managers and admins
      const { data: managers } = await supabase
        .from('system_users')
        .select('id')
        .or('role.eq.admin,department.eq.Business Aviation,role.eq.sales')
        .eq('is_active', true);

      if (managers && managers.length > 0) {
        const notifications = managers.map(manager => ({
          user_id: manager.id,
          type: 'booking_request',
          title: 'New Booking Request',
          message: `${user.name} has submitted a new ${formData.service_type} booking request for ${formData.client_name}`,
          data: {
            booking_id: booking.id,
            booking_number: booking.booking_number,
            service_type: formData.service_type,
            client_name: formData.client_name,
            departure: formData.departure,
            arrival: formData.arrival,
            departure_date: formData.departure_date,
            employee_name: user.name
          }
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }

      showSuccess('Booking Submitted!', `Your booking request has been submitted successfully`);
      onBookingCreated();
      onClose();
      resetForm();
    } catch (err: any) {
      showError('Error', err.message || 'Failed to submit booking request');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      client_email: '',
      client_phone: '',
      service_type: 'jet',
      departure: '',
      arrival: '',
      departure_date: '',
      departure_time: '',
      return_date: '',
      return_time: '',
      passengers: 1,
      aircraft_preference: '',
      special_requests: '',
      estimated_budget: '',
      currency: 'USD',
      priority: 'normal'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black flex items-center">
            <Plane className="w-5 h-5 mr-2" />
            Submit Booking Request
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Information */}
          <div>
            <h3 className="text-lg font-medium text-black mb-4">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Email *
                </label>
                <input
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Phone
                </label>
                <input
                  type="tel"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div>
            <h3 className="text-lg font-medium text-black mb-4">Service Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type *
                </label>
                <select
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                >
                  <option value="jet">Private Jet</option>
                  <option value="yacht">Yacht</option>
                  <option value="helicopter">Helicopter</option>
                  <option value="car">Luxury Car</option>
                  <option value="emptyleg">Empty Leg</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passengers *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.passengers}
                  onChange={(e) => setFormData({ ...formData, passengers: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Route Information */}
          <div>
            <h3 className="text-lg font-medium text-black mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Route Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departure *
                </label>
                <input
                  type="text"
                  value={formData.departure}
                  onChange={(e) => setFormData({ ...formData, departure: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., New York (JFK)"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arrival *
                </label>
                <input
                  type="text"
                  value={formData.arrival}
                  onChange={(e) => setFormData({ ...formData, arrival: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., Los Angeles (LAX)"
                  required
                />
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div>
            <h3 className="text-lg font-medium text-black mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departure Date *
                </label>
                <input
                  type="date"
                  value={formData.departure_date}
                  onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departure Time
                </label>
                <input
                  type="time"
                  value={formData.departure_time}
                  onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return Date
                </label>
                <input
                  type="date"
                  value={formData.return_date}
                  onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return Time
                </label>
                <input
                  type="time"
                  value={formData.return_time}
                  onChange={(e) => setFormData({ ...formData, return_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div>
            <h3 className="text-lg font-medium text-black mb-4">Additional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aircraft Preference
                </label>
                <input
                  type="text"
                  value={formData.aircraft_preference}
                  onChange={(e) => setFormData({ ...formData, aircraft_preference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., Citation X, Gulfstream G650"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Estimated Budget
                </label>
                <div className="flex">
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CHF">CHF</option>
                  </select>
                  <input
                    type="text"
                    value={formData.estimated_budget}
                    onChange={(e) => {
                      // Allow numbers and decimal point
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      setFormData({ ...formData, estimated_budget: value });
                    }}
                    className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="50000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              Special Requests
            </label>
            <textarea
              value={formData.special_requests}
              onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Any special requirements, catering preferences, ground transportation needs, etc."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Plane className="w-4 h-4" />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};