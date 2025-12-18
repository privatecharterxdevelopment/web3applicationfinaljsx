import React, { useState, useEffect, useRef } from 'react';
import { X, User, Building2, Mail, Phone, MapPin, CreditCard, Calendar, Users, Plane, DollarSign, CreditCard as CreditCardIcon, Wallet, Landmark, Bitcoin } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/CRM/AuthContext';

interface ServiceCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    type: 'jet' | 'yacht' | 'helicopter' | 'car' | 'emptyleg';
    name: string;
    price: number;
    currency?: string;
    image_url?: string;
    details?: any;
  } | null;
  onOrderPlaced: () => void;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

export const ServiceCheckout: React.FC<ServiceCheckoutProps> = ({ 
  isOpen, 
  onClose, 
  service, 
  onOrderPlaced 
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'client' | 'details' | 'payment' | 'review'>('client');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // New client form data
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    type: 'individual' as 'individual' | 'corporate',
    address_street: '',
    address_city: '',
    address_country: '',
    address_zip_code: ''
  });

  // Service details form data
  const [serviceDetails, setServiceDetails] = useState({
    departure: '',
    arrival: '',
    departure_date: '',
    return_date: '',
    passengers: 1,
    duration: '',
    special_requests: '',
    notes: ''
  });

  // Payment details form data
  const [paymentDetails, setPaymentDetails] = useState({
    payment_method: 'credit_card' as 'credit_card' | 'bank_transfer' | 'paypal' | 'crypto' | 'cash' | 'other',
    payment_status: 'unpaid' as 'unpaid' | 'pending' | 'paid' | 'refunded' | 'cancelled',
    payment_reference: '',
    payment_notes: ''
  });

  // Credit card form data
  const [cardDetails, setCardDetails] = useState({
    card_number: '',
    card_holder: '',
    expiry_date: '',
    cvv: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      resetForm();
      
      // Pre-fill departure/arrival if service has them (for EmptyLegs)
      if (service?.details?.departure || service?.details?.from) {
        setServiceDetails(prev => ({
          ...prev,
          departure: service.details.departure || service.details.from || prev.departure
        }));
      }
      
      if (service?.details?.arrival || service?.details?.to) {
        setServiceDetails(prev => ({
          ...prev,
          arrival: service.details.arrival || service.details.to || prev.arrival
        }));
      }
      
      if (service?.details?.departure_date) {
        setServiceDetails(prev => ({
          ...prev,
          departure_date: service.details.departure_date
        }));
      }
    }
  }, [isOpen, service]);

  const resetForm = () => {
    setStep('client');
    setSelectedClientId('');
    setShowNewClientForm(false);
    setNewClientData({
      name: '',
      email: '',
      phone: '',
      company: '',
      type: 'individual',
      address_street: '',
      address_city: '',
      address_country: '',
      address_zip_code: ''
    });
    setServiceDetails({
      departure: '',
      arrival: '',
      departure_date: '',
      return_date: '',
      passengers: 1,
      duration: '',
      special_requests: '',
      notes: ''
    });
    setPaymentDetails({
      payment_method: 'credit_card',
      payment_status: 'unpaid',
      payment_reference: '',
      payment_notes: ''
    });
    setCardDetails({
      card_number: '',
      card_holder: '',
      expiry_date: '',
      cvv: ''
    });
    setError('');
  };

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

  const createNewClient = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          name: newClientData.name,
          email: newClientData.email,
          phone: newClientData.phone || null,
          company: newClientData.company || null,
          type: newClientData.type,
          address_street: newClientData.address_street || null,
          address_city: newClientData.address_city || null,
          address_country: newClientData.address_country || null,
          address_zip_code: newClientData.address_zip_code || null,
          total_bookings: 0,
          total_spent: 0
        }])
        .select()
        .single();

      if (error) throw error;
      
      setSelectedClientId(data.id);
      setShowNewClientForm(false);
      await fetchClients();
      setStep('details');
    } catch (err: any) {
      setError(err.message || 'Failed to create client');
    } finally {
      setIsLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!service || !selectedClientId) return;

    try {
      setIsLoading(true);
      setError('');

      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user?.email)
        .single();

      if (!systemUser) {
        throw new Error('User not found in system');
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;

      // Create service order
      const { data: order, error: orderError } = await supabase
        .from('service_orders')
        .insert([{
          order_number: orderNumber,
          client_id: selectedClientId,
          created_by: systemUser.id,
          status: 'pending',
          notes: serviceDetails.notes,
          special_requests: serviceDetails.special_requests,
          payment_status: paymentDetails.payment_status,
          payment_method: paymentDetails.payment_method,
          payment_reference: paymentDetails.payment_reference,
          payment_notes: paymentDetails.payment_notes,
          payment_date: paymentDetails.payment_status === 'paid' ? new Date().toISOString() : null,
          payment_amount: paymentDetails.payment_status === 'paid' ? service.price : null
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert([{
          order_id: order.id,
          service_type: service.type,
          service_id: service.id,
          service_name: service.name,
          quantity: 1,
          unit_price: service.price,
          total_price: service.price,
          departure: serviceDetails.departure,
          arrival: serviceDetails.arrival,
          departure_date: serviceDetails.departure_date || null,
          return_date: serviceDetails.return_date || null,
          passengers: serviceDetails.passengers,
          duration: serviceDetails.duration,
          details: service.details || {}
        }]);

      if (itemError) throw itemError;

      // Log activity
      await supabase
        .from('user_activity_logs')
        .insert([{
          user_id: systemUser.id,
          action: 'order_created',
          details: {
            order_id: order.id,
            order_number: orderNumber,
            service_type: service.type,
            service_name: service.name,
            client_id: selectedClientId,
            amount: service.price,
            payment_status: paymentDetails.payment_status,
            payment_method: paymentDetails.payment_method
          }
        }]);

      onOrderPlaced();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !service) return null;

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card': return <CreditCardIcon className="w-5 h-5" />;
      case 'bank_transfer': return <Landmark className="w-5 h-5" />;
      case 'paypal': return <Wallet className="w-5 h-5" />;
      case 'crypto': return <Bitcoin className="w-5 h-5" />;
      case 'cash': return <DollarSign className="w-5 h-5" />;
      default: return <CreditCardIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">Service Checkout</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Service Summary */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            {service.image_url ? (
              <img
                src={service.image_url}
                alt={service.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <Plane className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-black">{service.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{service.type} Service</p>
              <p className="text-lg font-bold text-black">
                {service.currency || '$'}{service.price.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === 'client' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className="w-12 h-0.5 bg-gray-200"></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === 'details' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <div className="w-12 h-0.5 bg-gray-200"></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === 'payment' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <div className="w-12 h-0.5 bg-gray-200"></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === 'review' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                4
              </div>
            </div>
          </div>

          {/* Step 1: Client Selection */}
          {step === 'client' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-black">Select or Create Client</h3>
              
              {!showNewClientForm ? (
                <div>
                  <div className="space-y-3 mb-4">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => setSelectedClientId(client.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedClientId === client.id
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-black">{client.name}</p>
                            <p className="text-sm text-gray-500">{client.email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setShowNewClientForm(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                  >
                    + Create New Client
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={newClientData.name}
                        onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={newClientData.email}
                        onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={newClientData.phone}
                        onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={newClientData.company}
                        onChange={(e) => setNewClientData({ ...newClientData, company: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowNewClientForm(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createNewClient}
                      disabled={!newClientData.name || !newClientData.email || isLoading}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Creating...' : 'Create Client'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Service Details */}
          {step === 'details' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-black">Service Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Location
                  </label>
                  <input
                    type="text"
                    value={serviceDetails.departure}
                    onChange={(e) => setServiceDetails({ ...serviceDetails, departure: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="e.g., New York (JFK)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Location
                  </label>
                  <input
                    type="text"
                    value={serviceDetails.arrival}
                    onChange={(e) => setServiceDetails({ ...serviceDetails, arrival: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="e.g., Los Angeles (LAX)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={serviceDetails.departure_date}
                    onChange={(e) => setServiceDetails({ ...serviceDetails, departure_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={serviceDetails.return_date}
                    onChange={(e) => setServiceDetails({ ...serviceDetails, return_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passengers
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={serviceDetails.passengers}
                    onChange={(e) => setServiceDetails({ ...serviceDetails, passengers: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={serviceDetails.duration}
                    onChange={(e) => setServiceDetails({ ...serviceDetails, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="e.g., 3 days"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests
                </label>
                <textarea
                  value={serviceDetails.special_requests}
                  onChange={(e) => setServiceDetails({ ...serviceDetails, special_requests: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Any special requirements..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internal Notes
                </label>
                <textarea
                  value={serviceDetails.notes}
                  onChange={(e) => setServiceDetails({ ...serviceDetails, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Internal notes about this booking..."
                />
              </div>
            </div>
          )}

          {/* Step 3: Payment Details */}
          {step === 'payment' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-black">Payment Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentDetails({ ...paymentDetails, payment_method: 'credit_card' })}
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      paymentDetails.payment_method === 'credit_card' ? 'border-black bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <CreditCardIcon className="w-5 h-5 text-gray-600" />
                    <span>Credit Card</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPaymentDetails({ ...paymentDetails, payment_method: 'bank_transfer' })}
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      paymentDetails.payment_method === 'bank_transfer' ? 'border-black bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <Landmark className="w-5 h-5 text-gray-600" />
                    <span>Bank Transfer</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPaymentDetails({ ...paymentDetails, payment_method: 'paypal' })}
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      paymentDetails.payment_method === 'paypal' ? 'border-black bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <Wallet className="w-5 h-5 text-gray-600" />
                    <span>PayPal</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPaymentDetails({ ...paymentDetails, payment_method: 'crypto' })}
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      paymentDetails.payment_method === 'crypto' ? 'border-black bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <Bitcoin className="w-5 h-5 text-gray-600" />
                    <span>Crypto</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPaymentDetails({ ...paymentDetails, payment_method: 'cash' })}
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      paymentDetails.payment_method === 'cash' ? 'border-black bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <DollarSign className="w-5 h-5 text-gray-600" />
                    <span>Cash</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPaymentDetails({ ...paymentDetails, payment_method: 'other' })}
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      paymentDetails.payment_method === 'other' ? 'border-black bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <span>Other</span>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  value={paymentDetails.payment_status}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, payment_status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              
              {paymentDetails.payment_method === 'credit_card' && (
                <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-black">Credit Card Details</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardDetails.card_number}
                      onChange={(e) => setCardDetails({ ...cardDetails, card_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="•••• •••• •••• ••••"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Holder Name
                    </label>
                    <input
                      type="text"
                      value={cardDetails.card_holder}
                      onChange={(e) => setCardDetails({ ...cardDetails, card_holder: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardDetails.expiry_date}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="MM/YY"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="•••"
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    <p>This is a demo form. No actual payment will be processed.</p>
                  </div>
                </div>
              )}
              
              {paymentDetails.payment_method === 'bank_transfer' && (
                <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-black">Bank Transfer Details</h4>
                  <p className="text-sm text-gray-600">Please transfer the amount to the following account:</p>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm"><span className="font-medium">Bank:</span> PrivatecharterX Bank</p>
                    <p className="text-sm"><span className="font-medium">Account Name:</span> PrivatecharterX Ltd</p>
                    <p className="text-sm"><span className="font-medium">IBAN:</span> CH93 0076 2011 6238 5295 7</p>
                    <p className="text-sm"><span className="font-medium">SWIFT/BIC:</span> PCTXCHZZ</p>
                    <p className="text-sm"><span className="font-medium">Reference:</span> {`ORD-${Date.now()}`}</p>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Reference
                </label>
                <input
                  type="text"
                  value={paymentDetails.payment_reference}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, payment_reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., Transaction ID, Check Number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Notes
                </label>
                <textarea
                  value={paymentDetails.payment_notes}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, payment_notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Any notes about the payment..."
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-black">Review Order</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-black mb-2">Client Information</h4>
                <p className="text-sm text-gray-600">{selectedClient?.name}</p>
                <p className="text-sm text-gray-600">{selectedClient?.email}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-black mb-2">Service Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {serviceDetails.departure && (
                    <>
                      <span className="text-gray-600">Departure:</span>
                      <span className="text-black">{serviceDetails.departure}</span>
                    </>
                  )}
                  {serviceDetails.arrival && (
                    <>
                      <span className="text-gray-600">Arrival:</span>
                      <span className="text-black">{serviceDetails.arrival}</span>
                    </>
                  )}
                  {serviceDetails.departure_date && (
                    <>
                      <span className="text-gray-600">Date:</span>
                      <span className="text-black">{serviceDetails.departure_date}</span>
                    </>
                  )}
                  <span className="text-gray-600">Passengers:</span>
                  <span className="text-black">{serviceDetails.passengers}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-black mb-2">Payment Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600">Payment Method:</span>
                  <div className="flex items-center space-x-2">
                    {getPaymentMethodIcon(paymentDetails.payment_method)}
                    <span className="text-black capitalize">{paymentDetails.payment_method.replace('_', ' ')}</span>
                  </div>
                  
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center ${
                    paymentDetails.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                    paymentDetails.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {paymentDetails.payment_status.charAt(0).toUpperCase() + paymentDetails.payment_status.slice(1)}
                  </span>
                  
                  {paymentDetails.payment_reference && (
                    <>
                      <span className="text-gray-600">Reference:</span>
                      <span className="text-black">{paymentDetails.payment_reference}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-black mb-2">Order Summary</h4>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{service.name}</span>
                  <span className="font-semibold text-black">
                    {service.currency || '$'}{service.price.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center font-semibold">
                  <span className="text-black">Total</span>
                  <span className="text-black">
                    {service.currency || '$'}{service.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                if (step === 'details') setStep('client');
                else if (step === 'payment') setStep('details');
                else if (step === 'review') setStep('payment');
                else onClose();
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {step === 'client' ? 'Cancel' : 'Back'}
            </button>
            
            <button
              onClick={() => {
                if (step === 'client' && selectedClientId) setStep('details');
                else if (step === 'details') setStep('payment');
                else if (step === 'payment') setStep('review');
                else if (step === 'review') placeOrder();
              }}
              disabled={
                (step === 'client' && !selectedClientId) ||
                (step === 'review' && isLoading)
              }
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {step === 'review' 
                ? (isLoading ? 'Placing Order...' : 'Place Order')
                : 'Next'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};