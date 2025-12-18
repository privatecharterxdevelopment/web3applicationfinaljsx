import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface AddBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingAdded: () => void;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

export const AddBookingModal: React.FC<AddBookingModalProps> = ({ isOpen, onClose, onBookingAdded }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    service: 'jet' as 'jet' | 'emptyleg', // Restricted to just jets and emptylegs
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    amount: '',
    departure: '',
    arrival: '',
    departure_date: '',
    departure_time: '',
    return_date: '',
    return_time: '',
    passengers: '1',
    special_requests: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!user) {
      setError('You must be logged in to create a booking');
      setIsLoading(false);
      return;
    }

    try {
      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!systemUser) {
        throw new Error('User not found in system');
      }

      // Create booking request in user_requests table
      const bookingData = {
        client_id: formData.client_id,
        service: formData.service,
        status: formData.status,
        amount: parseFloat(formData.amount) || 0,
        departure: formData.departure,
        arrival: formData.arrival,
        departure_date: formData.departure_date,
        departure_time: formData.departure_time,
        return_date: formData.return_date || null,
        return_time: formData.return_time || null,
        passengers: parseInt(formData.passengers),
        special_requests: formData.special_requests || null
      };

      const { error: insertError } = await supabase
        .from('user_requests')
        .insert([{
          user_id: systemUser.id, // Use system user ID
          type: 'booking',
          status: formData.status,
          data: bookingData
        }]);

      if (insertError) throw insertError;

      // Log the activity
      await supabase
        .from('user_activity_logs')
        .insert([{
          user_id: systemUser.id,
          action: 'booking_created',
          details: {
            client_id: formData.client_id,
            service_type: formData.service,
            departure: formData.departure,
            arrival: formData.arrival,
            client_name: clients.find(c => c.id === formData.client_id)?.name
          }
        }]);

      showSuccess('Success', 'Booking request created successfully');
      onBookingAdded();
      onClose();
      setFormData({
        client_id: '',
        service: 'jet',
        status: 'pending',
        amount: '',
        departure: '',
        arrival: '',
        departure_date: '',
        departure_time: '',
        return_date: '',
        return_time: '',
        passengers: '1',
        special_requests: ''
      });
    } catch (err: any) {
      console.error('Error adding booking:', err);
      setError(err.message || 'Failed to add booking');
      showError('Error', err.message || 'Failed to add booking');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">Add New Booking</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-start">
              <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client *
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              required
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>

          {/* Service and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type *
              </label>
              <select
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                required
              >
                <option value="jet">Private Jet</option>
                <option value="emptyleg">Empty Leg</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                required
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
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
                  Departure Time *
                </label>
                <input
                  type="time"
                  value={formData.departure_time}
                  onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
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

          {/* Passengers and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Users className="w-4 h-4 mr-1" />
                Passengers *
              </label>
              <input
                type="number"
                min="1"
                value={formData.passengers}
                onChange={(e) => setFormData({ ...formData, passengers: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                Amount (USD) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="0.00"
                required
              />
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
              placeholder="Any special requirements or requests..."
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
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};