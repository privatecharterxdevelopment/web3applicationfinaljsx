import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Calendar,
  DollarSign,
  MapPin,
  Users,
  Plane,
  Ship,
  Zap,
  Car,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  User,
  Save,
  FileText,
  CreditCard,
  Wallet,
  Landmark,
  Bitcoin
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface ServiceOrder {
  id: string;
  order_number: string;
  client_id: string;
  created_by: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  total_amount: number;
  currency: string;
  notes: string | null;
  special_requests: string | null;
  created_at: string;
  updated_at: string;
  clients?: {
    name: string;
    email: string;
  };
  system_users?: {
    name: string;
  };
  order_items: OrderItem[];
  payment_status?: 'unpaid' | 'pending' | 'paid' | 'refunded' | 'cancelled';
  payment_method?: 'credit_card' | 'bank_transfer' | 'paypal' | 'crypto' | 'cash' | 'other';
  payment_date?: string | null;
  payment_amount?: number | null;
  payment_reference?: string | null;
  payment_notes?: string | null;
}

interface OrderItem {
  id: string;
  service_type: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  departure: string | null;
  arrival: string | null;
  departure_date: string | null;
  return_date: string | null;
  passengers: number | null;
  duration: string | null;
}

export const OrdersManagement: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'unpaid' | 'pending' | 'paid' | 'refunded' | 'cancelled'>('all');
  const [serviceFilter, setServiceFilter] = useState<'all' | 'jet' | 'yacht' | 'helicopter' | 'car' | 'emptyleg'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editOrderData, setEditOrderData] = useState<{
    status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    notes?: string;
    special_requests?: string;
  }>({});
  const [editPaymentData, setEditPaymentData] = useState<{
    payment_status?: 'unpaid' | 'pending' | 'paid' | 'refunded' | 'cancelled';
    payment_method?: 'credit_card' | 'bank_transfer' | 'paypal' | 'crypto' | 'cash' | 'other';
    payment_reference?: string;
    payment_notes?: string;
    payment_amount?: number;
    payment_date?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, serviceFilter, paymentStatusFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          clients (name, email),
          system_users (name),
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clients?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_items.some(item => 
          item.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.departure?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.arrival?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_status === paymentStatusFilter);
    }

    if (serviceFilter !== 'all') {
      filtered = filtered.filter(order => 
        order.order_items.some(item => item.service_type === serviceFilter)
      );
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      setIsUpdatingStatus(true);
      
      // Get current user from system_users for audit trail
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user?.email)
        .single();

      const { error } = await supabase
        .from('service_orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          admin_id: systemUser?.id || null
        })
        .eq('id', orderId);

      if (error) throw error;
      
      showSuccess('Success', `Order status updated to ${newStatus}`);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      // Update selected order if details modal is open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({...selectedOrder, status: newStatus});
      }

      // If the order is cancelled, check if it contains empty legs and unlock them
      if (newStatus === 'cancelled') {
        unlockEmptyLegs(orderId);
      }
    } catch (err: any) {
      console.error('Error updating order status:', err);
      showError('Error', 'Failed to update order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const unlockEmptyLegs = async (orderId: string) => {
    try {
      // Get the order items that are empty legs
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select('service_id')
        .eq('order_id', orderId)
        .eq('service_type', 'emptyleg');

      if (error) throw error;

      // If there are no empty legs, return
      if (!orderItems || orderItems.length === 0) return;

      // Log the empty legs being unlocked
      console.log('Unlocking empty legs:', orderItems.map(item => item.service_id));

      // Refresh the orders list
      fetchOrders();
    } catch (err: any) {
      console.error('Error unlocking empty legs:', err);
    }
  };

  const updateOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('service_orders')
        .update({ 
          ...editOrderData,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;
      
      showSuccess('Success', 'Order updated successfully');
      
      fetchOrders();
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrder.id ? { 
            ...order, 
            ...editOrderData,
            updated_at: new Date().toISOString()
          } : order
        )
      );
      
      // Update selected order if details modal is open
      setSelectedOrder({
        ...selectedOrder, 
        ...editOrderData,
        updated_at: new Date().toISOString()
      });
      
      setShowEditModal(false);
      setEditOrderData({});
    } catch (err: any) {
      console.error('Error updating order:', err);
      showError('Error', 'Failed to update order');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePayment = async () => {
    if (!selectedOrder) return;
    
    try {
      setIsSaving(true);
      
      // If payment status is changed to paid, set payment date to now if not provided
      const paymentData = { ...editPaymentData };
      if (paymentData.payment_status === 'paid' && !paymentData.payment_date) {
        paymentData.payment_date = new Date().toISOString();
      }
      
      // If payment status is not paid, clear payment date
      if (paymentData.payment_status && paymentData.payment_status !== 'paid') {
        paymentData.payment_date = null;
      }
      
      const { error } = await supabase
        .from('service_orders')
        .update({ 
          ...paymentData,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;
      
      showSuccess('Success', 'Payment information updated successfully');
      
      fetchOrders();
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrder.id ? { 
            ...order, 
            ...paymentData,
            updated_at: new Date().toISOString()
          } : order
        )
      );
      
      // Update selected order if details modal is open
      setSelectedOrder({
        ...selectedOrder, 
        ...paymentData,
        updated_at: new Date().toISOString()
      });
      
      setShowPaymentModal(false);
      setEditPaymentData({});
    } catch (err: any) {
      console.error('Error updating payment:', err);
      showError('Error', 'Failed to update payment information');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);

      // First, unlock any empty legs associated with this order
      await unlockEmptyLegs(orderId);

      // Then delete the order
      const { error } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      showSuccess('Success', 'Order deleted successfully');
      
      // Update local state
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      
      // Close modal if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
        setShowEditModal(false);
        setShowPaymentModal(false);
      }
    } catch (err: any) {
      console.error('Error deleting order:', err);
      showError('Error', 'Failed to delete order');
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'jet': return <Plane className="w-5 h-5" />;
      case 'yacht': return <Ship className="w-5 h-5" />;
      case 'helicopter': return <Zap className="w-5 h-5" />;
      case 'car': return <Car className="w-5 h-5" />;
      case 'emptyleg': return <Plane className="w-5 h-5 transform rotate-45" />;
      default: return <Plane className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled': return <X className="w-4 h-4 text-red-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'unpaid': return 'bg-gray-100 text-gray-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string | undefined) => {
    switch (method) {
      case 'credit_card': return <CreditCard className="w-4 h-4 text-gray-600" />;
      case 'bank_transfer': return <Landmark className="w-4 h-4 text-gray-600" />; 
      case 'paypal': return <Wallet className="w-4 h-4 text-gray-600" />;
      case 'crypto': return <Bitcoin className="w-4 h-4 text-gray-600" />;
      case 'cash': return <DollarSign className="w-4 h-4 text-gray-600" />;
      default: return <CreditCard className="w-4 h-4 text-gray-600" />;
    }
  };

  // Calculate the actual total from order items
  const calculateOrderTotal = (order: ServiceOrder) => {
    return order.order_items.reduce((sum, item) => sum + item.total_price, 0);
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Orders Management</h1>
            <p className="text-gray-600">Track and manage all service orders</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search orders by number, client, or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Payment Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending">Payment Pending</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Payment Cancelled</option>
            </select>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Services</option>
              <option value="jet">Private Jet</option>
              <option value="yacht">Yacht</option>
              <option value="helicopter">Helicopter</option>
              <option value="car">Luxury Car</option>
              <option value="emptyleg">Empty Leg</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{orders.length}</p>
          <p className="text-sm text-gray-500">Total Orders</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{orders.filter(o => o.status === 'pending').length}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{orders.filter(o => o.payment_status === 'paid').length}</p>
          <p className="text-sm text-gray-500">Paid Orders</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">
            ${orders.reduce((sum, o) => sum + calculateOrderTotal(o), 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Total Value</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Order</th>
                <th className="text-left p-4 font-medium text-gray-700">Client</th>
                <th className="text-left p-4 font-medium text-gray-700">Services</th>
                <th className="text-left p-4 font-medium text-gray-700">Status</th>
                <th className="text-left p-4 font-medium text-gray-700">Payment</th>
                <th className="text-left p-4 font-medium text-gray-700">Amount</th>
                <th className="text-left p-4 font-medium text-gray-700">Created</th>
                <th className="text-left p-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-black">{order.order_number}</p>
                      <p className="text-sm text-gray-500">by {order.system_users?.name}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-black">{order.clients?.name}</p>
                        <p className="text-sm text-gray-500">{order.clients?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      {order.order_items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getServiceIcon(item.service_type)}
                            <span className="text-sm">{item.service_name}</span>
                          </div>
                          <span className="text-sm font-medium">${item.total_price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      {(user?.role === 'admin' || user?.role === 'accountant') ? (
                        <select
                          value={order.status}
                          onChange={(e) => {
                            // Immediately save status change
                            updateOrderStatus(order.id, e.target.value as any);
                          }}
                          disabled={isUpdatingStatus}
                          className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(order.status)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      {order.payment_method && getPaymentMethodIcon(order.payment_method)}
                      <span className={`text-xs px-2 py-1 rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status 
                          ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) 
                          : 'Unpaid'
                        }
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold">{order.currency}{calculateOrderTotal(order).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(user?.role === 'admin' || user?.role === 'accountant') && (
                        <button 
                          onClick={() => {
                            setSelectedOrder(order);
                            setEditPaymentData({
                              payment_status: order.payment_status || 'unpaid',
                              payment_method: order.payment_method,
                              payment_reference: order.payment_reference || '',
                              payment_notes: order.payment_notes || '',
                              payment_amount: order.payment_amount || calculateOrderTotal(order),
                              payment_date: order.payment_date || ''
                            });
                            setShowPaymentModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-black transition-colors"
                          title="Edit Payment"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                      )}
                      {user?.role === 'admin' && (
                        <>
                          <button 
                            onClick={() => {
                              setSelectedOrder(order);
                              setEditOrderData({
                                status: order.status,
                                notes: order.notes || '',
                                special_requests: order.special_requests || ''
                              });
                              setShowEditModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-black transition-colors"
                            title="Edit Order"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteOrder(order.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredOrders.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No orders found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' || serviceFilter !== 'all' || paymentStatusFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'No orders have been created yet'
            }
          </p>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && !showEditModal && !showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Order Details</h2>
              <div className="flex items-center space-x-2">
                {(user?.role === 'admin' || user?.role === 'accountant') && (
                  <button
                    onClick={() => {
                      setEditPaymentData({
                        payment_status: selectedOrder.payment_status || 'unpaid',
                        payment_method: selectedOrder.payment_method,
                        payment_reference: selectedOrder.payment_reference || '',
                        payment_notes: selectedOrder.payment_notes || '',
                        payment_amount: selectedOrder.payment_amount || calculateOrderTotal(selectedOrder),
                        payment_date: selectedOrder.payment_date || ''
                      });
                      setShowPaymentModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-black transition-colors"
                    title="Edit Payment"
                  >
                    <CreditCard className="w-4 h-4" />
                  </button>
                )}
                {user?.role === 'admin' && (
                  <>
                    <button
                      onClick={() => {
                        setEditOrderData({
                          status: selectedOrder.status,
                          notes: selectedOrder.notes || '',
                          special_requests: selectedOrder.special_requests || ''
                        });
                        setShowEditModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-black transition-colors"
                      title="Edit Order"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteOrder(selectedOrder.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-gray-400 hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="font-medium text-black">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-medium text-black">{selectedOrder.clients?.name}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.clients?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <p className="font-medium text-black">{selectedOrder.system_users?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(selectedOrder.payment_status)}`}>
                    {selectedOrder.payment_status 
                      ? selectedOrder.payment_status.charAt(0).toUpperCase() + selectedOrder.payment_status.slice(1) 
                      : 'Unpaid'
                    }
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <div className="flex items-center space-x-2">
                    {selectedOrder.payment_method && getPaymentMethodIcon(selectedOrder.payment_method)}
                    <span className="font-medium text-black capitalize">
                      {selectedOrder.payment_method 
                        ? selectedOrder.payment_method.replace('_', ' ')
                        : 'Not specified'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-black mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getServiceIcon(item.service_type)}
                          <span className="font-medium">{item.service_name}</span>
                        </div>
                        <span className="font-semibold">${item.total_price.toLocaleString()}</span>
                      </div>
                      {(item.departure || item.arrival) && (
                        <div className="text-sm text-gray-600">
                          {item.departure} → {item.arrival}
                        </div>
                      )}
                      {item.departure_date && (
                        <div className="text-sm text-gray-600">
                          Date: {new Date(item.departure_date).toLocaleDateString()}
                        </div>
                      )}
                      {item.passengers && (
                        <div className="text-sm text-gray-600">
                          Passengers: {item.passengers}
                        </div>
                      )}
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Price:</span> ${item.unit_price.toLocaleString()} × {item.quantity} = ${item.total_price.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.payment_reference && (
                <div>
                  <h3 className="font-medium text-black mb-2">Payment Reference</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOrder.payment_reference}</p>
                </div>
              )}

              {selectedOrder.payment_notes && (
                <div>
                  <h3 className="font-medium text-black mb-2">Payment Notes</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOrder.payment_notes}</p>
                </div>
              )}

              {selectedOrder.special_requests && (
                <div>
                  <h3 className="font-medium text-black mb-2">Special Requests</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOrder.special_requests}</p>
                </div>
              )}

              {selectedOrder.notes && (
                <div>
                  <h3 className="font-medium text-black mb-2">Notes</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Amount</span>
                  <span>{selectedOrder.currency}{calculateOrderTotal(selectedOrder).toLocaleString()}</span>
                </div>
                {selectedOrder.payment_amount && (
                  <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
                    <span>Amount Paid</span>
                    <span>{selectedOrder.currency}{selectedOrder.payment_amount.toLocaleString()}</span>
                  </div>
                )}
                {selectedOrder.payment_date && (
                  <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
                    <span>Payment Date</span>
                    <span>{new Date(selectedOrder.payment_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Edit Order</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditOrderData({});
                }}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Status
                </label>
                <select
                  value={editOrderData.status}
                  onChange={(e) => setEditOrderData({ ...editOrderData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests
                </label>
                <div className="relative">
                  <textarea
                    value={editOrderData.special_requests}
                    onChange={(e) => setEditOrderData({ ...editOrderData, special_requests: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Special requests from the client"
                  />
                  <button
                    onClick={updateOrder}
                    className="absolute bottom-2 right-2 p-1 bg-black text-white rounded-md hover:bg-gray-800"
                    title="Save special requests"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internal Notes
                </label>
                <textarea
                  value={editOrderData.notes}
                  onChange={(e) => setEditOrderData({ ...editOrderData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Internal notes about this order"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-black mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium">{selectedOrder.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client:</span>
                    <span className="font-medium">{selectedOrder.clients?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">{selectedOrder.currency}{calculateOrderTotal(selectedOrder).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditOrderData({});
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateOrder}
                disabled={isSaving}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Edit Payment Information</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setEditPaymentData({});
                }}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  value={editPaymentData.payment_status}
                  onChange={(e) => setEditPaymentData({ ...editPaymentData, payment_status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={editPaymentData.payment_method}
                  onChange={(e) => setEditPaymentData({ ...editPaymentData, payment_method: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Select payment method</option>
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
                  Payment Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={editPaymentData.payment_amount}
                    onChange={(e) => setEditPaymentData({ ...editPaymentData, payment_amount: parseFloat(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={editPaymentData.payment_date}
                  onChange={(e) => setEditPaymentData({ ...editPaymentData, payment_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Reference
                </label>
                <input
                  type="text"
                  value={editPaymentData.payment_reference}
                  onChange={(e) => setEditPaymentData({ ...editPaymentData, payment_reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., Transaction ID, Check Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Notes
                </label>
                <textarea
                  value={editPaymentData.payment_notes}
                  onChange={(e) => setEditPaymentData({ ...editPaymentData, payment_notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Notes about the payment"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-black mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium">{selectedOrder.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client:</span>
                    <span className="font-medium">{selectedOrder.clients?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">{selectedOrder.currency}{calculateOrderTotal(selectedOrder).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setEditPaymentData({});
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updatePayment}
                disabled={isSaving}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};