import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Upload,
  MapPin,
  DollarSign,
  Clock,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Service {
  id?: string;
  service_type: 'auto' | 'taxi' | 'adventure' | 'limousine' | 'other';
  title: string;
  description: string;
  price_amount: number;
  price_currency: string;
  price_type: 'per_hour' | 'per_day' | 'per_trip' | 'fixed';
  service_location: string;
  city: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  available_from?: string;
  available_to?: string;
  available_days?: string[];
  images?: string[];
  features?: string[];
  status?: string;
}

interface PartnerServiceManagementProps {
  partnerId: string;
  onClose?: () => void;
}

const SERVICE_TYPES = [
  { value: 'taxi', label: 'Taxi / Driver Service' },
  { value: 'limousine', label: 'Luxury Car / Limousine' },
  { value: 'adventure', label: 'Adventure Package' },
  { value: 'auto', label: 'Vehicle Rental' },
  { value: 'other', label: 'Other Service' }
];

const PRICE_TYPES = [
  { value: 'per_hour', label: 'Per Hour' },
  { value: 'per_day', label: 'Per Day' },
  { value: 'per_trip', label: 'Per Trip' },
  { value: 'fixed', label: 'Fixed Price' }
];

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function PartnerServiceManagement({ partnerId, onClose }: PartnerServiceManagementProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Service>({
    service_type: 'taxi',
    title: '',
    description: '',
    price_amount: 0,
    price_currency: 'EUR',
    price_type: 'per_hour',
    service_location: '',
    city: '',
    postal_code: '',
    country: '',
    features: [],
    images: [],
    available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    loadServices();
  }, [partnerId]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('partner_services')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (err: any) {
      setError('Failed to load services: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Service, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: string) => {
    const days = formData.available_days || [];
    if (days.includes(day)) {
      handleInputChange('available_days', days.filter(d => d !== day));
    } else {
      handleInputChange('available_days', [...days, day]);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      handleInputChange('features', [...(formData.features || []), newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    const features = [...(formData.features || [])];
    features.splice(index, 1);
    handleInputChange('features', features);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Validation
      if (!formData.title || !formData.description || !formData.city || !formData.postal_code) {
        throw new Error('Please fill in all required fields');
      }
      if (formData.price_amount <= 0) {
        throw new Error('Price must be greater than 0');
      }

      const serviceData = {
        ...formData,
        partner_id: partnerId,
        status: 'pending_approval'
      };

      if (editingService?.id) {
        // Update existing service
        const { error } = await supabase
          .from('partner_services')
          .update(serviceData)
          .eq('id', editingService.id)
          .eq('partner_id', partnerId);

        if (error) throw error;
        setSuccess('Service updated successfully!');
      } else {
        // Create new service
        const { error } = await supabase
          .from('partner_services')
          .insert([serviceData]);

        if (error) throw error;
        setSuccess('Service created successfully! It will be reviewed by our team.');
      }

      // Reset form and reload
      setShowForm(false);
      setEditingService(null);
      setFormData({
        service_type: 'taxi',
        title: '',
        description: '',
        price_amount: 0,
        price_currency: 'EUR',
        price_type: 'per_hour',
        service_location: '',
        city: '',
        postal_code: '',
        country: '',
        features: [],
        images: [],
        available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      });

      await loadServices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData(service);
    setShowForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase
        .from('partner_services')
        .delete()
        .eq('id', serviceId)
        .eq('partner_id', partnerId);

      if (error) throw error;
      setSuccess('Service deleted successfully');
      await loadServices();
    } catch (err: any) {
      setError('Failed to delete service: ' + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      pending_approval: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      inactive: 'bg-gray-100 text-gray-500'
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Services</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your taxis, adventures, and luxury cars</p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setFormData({
              service_type: 'taxi',
              title: '',
              description: '',
              price_amount: 0,
              price_currency: 'EUR',
              price_type: 'per_hour',
              service_location: '',
              city: '',
              postal_code: '',
              country: '',
              features: [],
              images: [],
              available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus size={20} />
          Add Service
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle size={20} className="text-green-600" />
          <span className="text-sm text-green-700">{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} className="text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Service Form */}
      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingService(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.service_type}
                onChange={(e) => handleInputChange('service_type', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                required
              >
                {SERVICE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="e.g., Mercedes S-Class Airport Transfer"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                placeholder="Describe your service in detail..."
                required
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_amount}
                  onChange={(e) => handleInputChange('price_amount', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={formData.price_currency}
                  onChange={(e) => handleInputChange('price_currency', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="CHF">CHF</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.price_type}
                  onChange={(e) => handleInputChange('price_type', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                >
                  {PRICE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.service_location}
                  onChange={(e) => handleInputChange('service_location', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., Dubai Marina, JFK Airport"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., Dubai, New York"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal/ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., 10001, SW1A 1AA"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., United Arab Emirates, USA"
                  required
                />
              </div>
            </div>

            {/* Availability Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Days
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      (formData.available_days || []).includes(day)
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Features
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., WiFi, Leather seats, Bottled water"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.features || []).map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="hover:bg-blue-100 rounded-full p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Save size={20} />
                {editingService ? 'Update Service' : 'Create Service'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingService(null);
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      {services.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Plus size={48} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No services yet</h3>
          <p className="text-sm text-gray-500 mb-4">Start by adding your first service</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus size={20} />
            Add Service
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {services.map(service => (
            <div key={service.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(service.status || 'draft')}`}>
                      {(service.status || 'draft').replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <DollarSign size={16} />
                      {service.price_amount} {service.price_currency} ({service.price_type.replace('_', ' ')})
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={16} />
                      {service.city}, {service.postal_code}
                    </span>
                    <span className="capitalize">
                      {service.service_type}
                    </span>
                  </div>

                  {service.features && service.features.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {service.features.map((feature, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(service)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit size={18} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id!)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
