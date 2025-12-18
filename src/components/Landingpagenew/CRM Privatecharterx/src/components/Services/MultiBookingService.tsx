import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Plane, 
  Ship, 
  Zap, 
  Car, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  ShoppingBag, 
  X, 
  Check,
  Save,
  FileText,
  Clock,
  Package,
  CreditCard,
  Wallet,
  Landmark,
  Bitcoin
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface BookingItem {
  id: string;
  type: 'jet' | 'yacht' | 'helicopter' | 'car' | 'emptyleg' | 'fixedoffer' | 'concierge' | 'airporttransfer';
  name: string;
  price: number;
  currency: string;
  details: {
    departure?: string;
    arrival?: string;
    departure_date?: string;
    return_date?: string;
    passengers?: number;
    duration?: string;
    [key: string]: any;
  };
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export const MultiBookingService: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([]);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState<'all' | 'jet' | 'yacht' | 'helicopter' | 'car' | 'emptyleg' | 'fixedoffer' | 'concierge' | 'airporttransfer'>('all');
  const [specialRequests, setSpecialRequests] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'>('pending');

  // Service selection state
  const [selectedServiceType, setSelectedServiceType] = useState<BookingItem['type']>('jet');
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [serviceDetails, setServiceDetails] = useState({
    departure: '',
    arrival: '',
    departure_date: '',
    return_date: '',
    passengers: 1,
    duration: ''
  });

  // Payment details
  const [paymentDetails, setPaymentDetails] = useState({
    payment_method: 'credit_card' as 'credit_card' | 'bank_transfer' | 'paypal' | 'crypto' | 'cash' | 'other',
    payment_status: 'unpaid' as 'unpaid' | 'pending' | 'paid' | 'refunded' | 'cancelled',
    payment_reference: '',
    payment_notes: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (showAddServiceModal) {
      fetchAvailableServices(selectedServiceType);
    }
  }, [showAddServiceModal, selectedServiceType]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, phone, company')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      showError('Error', 'Failed to load clients');
    }
  };

  const fetchAvailableServices = async (type: BookingItem['type']) => {
    setIsLoading(true);
    try {
      let data: any[] = [];
      let error = null;

      switch (type) {
        case 'jet':
          ({ data, error } = await supabase.from('jets').select('*'));
          break;
        case 'car':
          ({ data, error } = await supabase.from('luxurycars').select('*'));
          break;
        case 'helicopter':
          // Assuming helicopters are in fixed_offers with aircraft_type = 'helicopter'
          ({ data, error } = await supabase
            .from('fixed_offers')
            .select('*')
            .eq('aircraft_type', 'helicopter'));
          break;
        case 'yacht':
          // Assuming yachts are in fixed_offers with aircraft_type = 'yacht'
          ({ data, error } = await supabase
            .from('fixed_offers')
            .select('*')
            .eq('aircraft_type', 'yacht'));
          break;
        case 'emptyleg':
          ({ data, error } = await supabase.from('EmptyLegs_').select('*'));
          break;
        case 'fixedoffer':
          ({ data, error } = await supabase
            .from('fixed_offers')
            .select('*')
            .eq('is_empty_leg', false));
          break;
        default:
          data = [];
          break;
      }

      if (error) throw error;
      setAvailableServices(data || []);
    } catch (err: any) {
      console.error(`Error fetching ${type} services:`, err);
      showError('Error', `Failed to load ${type} services`);
    } finally {
      setIsLoading(false);
    }
  };

  const addBookingItem = () => {
    if (!selectedService) {
      showError('Error', 'Please select a service');
      return;
    }

    let newItem: BookingItem;

    switch (selectedServiceType) {
      case 'jet':
        newItem = {
          id: selectedService.id,
          type: 'jet',
          name: selectedService.title || selectedService.aircraft_model,
          price: 50000, // Default price if not available
          currency: '$',
          details: {
            ...serviceDetails,
            aircraft_model: selectedService.aircraft_model,
            category: selectedService.aircraft_category,
            manufacturer: selectedService.manufacturer
          }
        };
        break;
      case 'car':
        newItem = {
          id: selectedService.id,
          type: 'car',
          name: `${selectedService.brand} ${selectedService.model} - ${selectedService.name}`,
          price: selectedService.price_per_day,
          currency: selectedService.currency || '$',
          details: {
            ...serviceDetails,
            brand: selectedService.brand,
            model: selectedService.model,
            type: selectedService.type,
            location: selectedService.location
          }
        };
        break;
      case 'helicopter':
      case 'yacht':
      case 'fixedoffer':
        newItem = {
          id: selectedService.id,
          type: selectedServiceType,
          name: selectedService.title,
          price: selectedService.price,
          currency: selectedService.currency || '$',
          details: {
            ...serviceDetails,
            origin: selectedService.origin,
            destination: selectedService.destination,
            aircraft_type: selectedService.aircraft_type
          }
        };
        break;
      case 'emptyleg':
        newItem = {
          id: selectedService.id,
          type: 'emptyleg',
          name: `${selectedService.from || ''} to ${selectedService.to || ''}`,
          price: selectedService.price || 0,
          currency: selectedService.currency || '$',
          details: {
            ...serviceDetails,
            departure: selectedService.from || serviceDetails.departure,
            arrival: selectedService.to || serviceDetails.arrival,
            aircraft_type: selectedService.aircraft_type
          }
        };
        break;
      default:
        newItem = {
          id: Date.now().toString(),
          type: selectedServiceType,
          name: 'Custom Service',
          price: 0,
          currency: '$',
          details: serviceDetails
        };
    }

    setBookingItems([...bookingItems, newItem]);
    setShowAddServiceModal(false);
    setSelectedService(null);
    setServiceDetails({
      departure: '',
      arrival: '',
      departure_date: '',
      return_date: '',
      passengers: 1,
      duration: ''
    });
  };

  const removeBookingItem = (index: number) => {
    const newItems = [...bookingItems];
    newItems.splice(index, 1);
    setBookingItems(newItems);
  };

  const calculateTotal = () => {
    return bookingItems.reduce((sum, item) => sum + item.price, 0);
  };

  const handleSubmit = async () => {
    if (!selectedClientId) {
      showError('Error', 'Please select a client');
      return;
    }

    if (bookingItems.length === 0) {
      showError('Error', 'Please add at least one service');
      return;
    }

    try {
      setIsSaving(true);

      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user?.email)
        .single();

      if (!systemUser) {
        throw new Error('User not found in system');
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('service_orders')
        .insert([{
          order_number: `ORD-${Date.now()}`,
          client_id: selectedClientId,
          created_by: systemUser.id,
          status: status,
          total_amount: calculateTotal(),
          currency: '$', // Default currency
          notes: notes,
          special_requests: specialRequests,
          payment_status: paymentDetails.payment_status,
          payment_method: paymentDetails.payment_method,
          payment_reference: paymentDetails.payment_reference,
          payment_notes: paymentDetails.payment_notes,
          payment_date: paymentDetails.payment_status === 'paid' ? new Date().toISOString() : null,
          payment_amount: paymentDetails.payment_status === 'paid' ? calculateTotal() : null
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = bookingItems.map(item => ({
        order_id: order.id,
        service_type: item.type,
        service_id: item.id,
        service_name: item.name,
        quantity: 1,
        unit_price: item.price,
        total_price: item.price,
        departure: item.details.departure,
        arrival: item.details.arrival,
        departure_date: item.details.departure_date,
        return_date: item.details.return_date,
        passengers: item.details.passengers,
        duration: item.details.duration,
        details: item.details
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      showSuccess('Success', 'Multi-booking order created successfully');
      
      // Reset form
      setSelectedClientId('');
      setBookingItems([]);
      setSpecialRequests('');
      setNotes('');
      setStatus('pending');
      setPaymentDetails({
        payment_method: 'credit_card',
        payment_status: 'unpaid',
        payment_reference: '',
        payment_notes: ''
      });
      
    } catch (err: any) {
      console.error('Error creating order:', err);
      showError('Error', err.message || 'Failed to create order');
    } finally {
      setIsSaving(false);
    }
  };

  const getServiceTypeIcon = (type: BookingItem['type']) => {
    switch (type) {
      case 'jet': return <Plane className="w-5 h-5" />;
      case 'yacht': return <Ship className="w-5 h-5" />;
      case 'helicopter': return <Zap className="w-5 h-5" />;
      case 'car': return <Car className="w-5 h-5" />;
      case 'emptyleg': return <Plane className="w-5 h-5 transform rotate-45" />;
      case 'fixedoffer': return <Package className="w-5 h-5" />;
      case 'concierge': return <Users className="w-5 h-5" />;
      case 'airporttransfer': return <Car className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card': return <CreditCard className="w-5 h-5" />;
      case 'bank_transfer': return <Landmark className="w-5 h-5" />;
      case 'paypal': return <Wallet className="w-5 h-5" />;
      case 'crypto': return <Bitcoin className="w-5 h-5" />;
      case 'cash': return <DollarSign className="w-5 h-5" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Multi-Booking Service</h1>
            <p className="text-gray-600">Create comprehensive booking packages for clients</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-black mb-4">Create New Multi-Booking</h2>
        
        {/* Client Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Client *
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            required
          >
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} {client.company && `(${client.company})`}
              </option>
            ))}
          </select>
        </div>

        {/* Booking Items */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-medium text-black">Booking Items</h3>
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="bg-black text-white px-3 py-1 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-1 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Service</span>
            </button>
          </div>

          {bookingItems.length > 0 ? (
            <div className="space-y-4">
              {bookingItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getServiceTypeIcon(item.type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-black">{item.name}</h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700 capitalize">
                            {item.type}
                          </span>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          {item.details.departure && (
                            <>
                              <span className="text-gray-500">From:</span>
                              <span className="text-gray-700">{item.details.departure}</span>
                            </>
                          )}
                          
                          {item.details.arrival && (
                            <>
                              <span className="text-gray-500">To:</span>
                              <span className="text-gray-700">{item.details.arrival}</span>
                            </>
                          )}
                          
                          {item.details.departure_date && (
                            <>
                              <span className="text-gray-500">Date:</span>
                              <span className="text-gray-700">{item.details.departure_date}</span>
                            </>
                          )}
                          
                          {item.details.passengers && (
                            <>
                              <span className="text-gray-500">Passengers:</span>
                              <span className="text-gray-700">{item.details.passengers}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="text-right">
                        <p className="font-semibold text-black">{item.currency}{item.price.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => removeBookingItem(index)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                <span className="font-medium text-black">Total</span>
                <span className="font-bold text-black text-lg">${calculateTotal().toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No services added yet</p>
              <button
                onClick={() => setShowAddServiceModal(true)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Add your first service
              </button>
            </div>
          )}
        </div>

        {/* Payment Details */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-black mb-4">Payment Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentDetails.payment_method}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, payment_method: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="credit_card">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="crypto">Cryptocurrency</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
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
              <input
                type="text"
                value={paymentDetails.payment_notes}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, payment_notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Any notes about the payment"
              />
            </div>
          </div>
          
          {paymentDetails.payment_method === 'bank_transfer' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-black mb-2">Bank Transfer Details</h4>
              <p className="text-sm text-gray-600 mb-2">Please transfer the amount to the following account:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Bank:</span>
                <span className="text-black">PrivatecharterX Bank</span>
                
                <span className="text-gray-600">Account Name:</span>
                <span className="text-black">PrivatecharterX Ltd</span>
                
                <span className="text-gray-600">IBAN:</span>
                <span className="text-black">CH93 0076 2011 6238 5295 7</span>
                
                <span className="text-gray-600">SWIFT/BIC:</span>
                <span className="text-black">PCTXCHZZ</span>
                
                <span className="text-gray-600">Reference:</span>
                <span className="text-black font-medium">{`ORD-${Date.now()}`}</span>
              </div>
            </div>
          )}
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requests
            </label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Any special requirements or requests from the client..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Internal Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Internal notes about this booking..."
            />
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!selectedClientId || bookingItems.length === 0 || isSaving}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Order...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Create Multi-Booking</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Add Service</h2>
              <button
                onClick={() => setShowAddServiceModal(false)}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Service Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setSelectedServiceType('jet')}
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      selectedServiceType === 'jet' ? 'border-black bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <Plane className="w-5 h-5 text-gray-600" />
                    <span>Private Jet</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedServiceType('helicopter')}
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      selectedServiceType === 'helicopter' ? 'border-black bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <Zap className="w-5 h-5 text-gray-600" />
                    <span>Helicopter</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedServiceType('yacht')}
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      selectedServiceType === 'yacht' ? 'border-black bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <Ship className="w-5 h-5 text-gray-600" />
                    <span>Yacht</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedServiceType('car')}
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      selectedServiceType === 'car' ? 'border-black bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <Car className="w-5 h-5 text-gray-600" />
                    <span>Luxury Car</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedServiceType('emptyleg')}
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      selectedServiceType === 'emptyleg' ? 'border-black bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <Plane className="w-5 h-5 text-gray-600 transform rotate-45" />
                    <span>Empty Leg</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedServiceType('fixedoffer')}
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      selectedServiceType === 'fixedoffer' ? 'border-black bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <Package className="w-5 h-5 text-gray-600" />
                    <span>Fixed Offer</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedServiceType('concierge')}
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      selectedServiceType === 'concierge' ? 'border-black bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <Users className="w-5 h-5 text-gray-600" />
                    <span>Concierge</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedServiceType('airporttransfer')}
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      selectedServiceType === 'airporttransfer' ? 'border-black bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <Car className="w-5 h-5 text-gray-600" />
                    <span>Airport Transfer</span>
                  </button>
                </div>
              </div>

              {/* Service Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Select {selectedServiceType.charAt(0).toUpperCase() + selectedServiceType.slice(1)}
                  </label>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : availableServices.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    {availableServices.map((service) => {
                      // Determine display name based on service type
                      let displayName = '';
                      switch (selectedServiceType) {
                        case 'jet':
                          displayName = service.title || service.aircraft_model || 'Private Jet';
                          break;
                        case 'car':
                          displayName = `${service.brand} ${service.model} - ${service.name}`;
                          break;
                        case 'helicopter':
                        case 'yacht':
                        case 'fixedoffer':
                          displayName = service.title || 'Charter Service';
                          break;
                        case 'emptyleg':
                          displayName = `${service.from || ''} to ${service.to || ''}`;
                          break;
                        default:
                          displayName = service.name || 'Service';
                      }
                      
                      return (
                        <div
                          key={service.id}
                          onClick={() => setSelectedService(service)}
                          className={`p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 cursor-pointer ${
                            selectedService?.id === service.id ? 'bg-gray-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                {getServiceTypeIcon(selectedServiceType)}
                              </div>
                              <div>
                                <p className="font-medium text-black">{displayName}</p>
                                {selectedServiceType === 'car' && (
                                  <p className="text-xs text-gray-500">{service.location}</p>
                                )}
                                {selectedServiceType === 'jet' && service.manufacturer && (
                                  <p className="text-xs text-gray-500">{service.manufacturer}</p>
                                )}
                                {selectedServiceType === 'emptyleg' && service.aircraft_type && (
                                  <p className="text-xs text-gray-500">{service.aircraft_type}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {(service.price || service.price_per_day) && (
                                <span className="text-sm font-semibold">
                                  {service.currency || '$'}
                                  {(service.price || service.price_per_day).toLocaleString()}
                                </span>
                              )}
                              <div className="w-5 h-5 border border-gray-300 rounded-sm flex items-center justify-center">
                                {selectedService?.id === service.id && (
                                  <Check className="w-4 h-4 text-black" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">No {selectedServiceType} services available</p>
                  </div>
                )}
              </div>

              {/* Service Details */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-black mb-4">Service Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departure Location
                    </label>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <input
                        type="text"
                        value={serviceDetails.departure}
                        onChange={(e) => setServiceDetails({ ...serviceDetails, departure: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="e.g., New York"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Arrival Location
                    </label>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <input
                        type="text"
                        value={serviceDetails.arrival}
                        onChange={(e) => setServiceDetails({ ...serviceDetails, arrival: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="e.g., Los Angeles"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departure Date
                    </label>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <input
                        type="date"
                        value={serviceDetails.departure_date}
                        onChange={(e) => setServiceDetails({ ...serviceDetails, departure_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Return Date
                    </label>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <input
                        type="date"
                        value={serviceDetails.return_date}
                        onChange={(e) => setServiceDetails({ ...serviceDetails, return_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passengers
                    </label>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-gray-400 mr-2" />
                      <input
                        type="number"
                        min="1"
                        value={serviceDetails.passengers}
                        onChange={(e) => setServiceDetails({ ...serviceDetails, passengers: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration
                    </label>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-400 mr-2" />
                      <input
                        type="text"
                        value={serviceDetails.duration}
                        onChange={(e) => setServiceDetails({ ...serviceDetails, duration: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="e.g., 3 days"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddServiceModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addBookingItem}
                disabled={!selectedService}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Add to Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};