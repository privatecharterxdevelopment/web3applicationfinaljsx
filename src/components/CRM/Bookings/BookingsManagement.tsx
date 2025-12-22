import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
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
  Package,
  Activity
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { AddBookingModal } from './AddBookingModal';
import { useAuth } from '../../../contexts/CRM/AuthContext';
import { useNotification } from '../../../contexts/CRM/NotificationContext';
import { EmergencyMedEvacRequests } from './EmergencyMedEvacRequests';
import { EmployeeBookingHistory } from './EmployeeBookingHistory';
import { ManagerBookingDashboard } from './ManagerBookingDashboard';

interface BookingRequest {
  id: string;
  user_id: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  data: any;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  admin_notes: string | null;
  admin_id: string | null;
  creator?: {
    name: string;
    email: string;
  };
}

export const BookingsManagement: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [serviceFilter, setServiceFilter] = useState<'all' | 'jet' | 'yacht' | 'helicopter' | 'car' | 'emptyleg' | 'fixedoffer'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editBookingData, setEditBookingData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'general' | 'medevac' | 'employee' | 'manager'>('general');
  const [activeServiceTab, setActiveServiceTab] = useState<'all' | 'jet' | 'yacht' | 'helicopter' | 'car' | 'emptyleg' | 'fixedoffer'>('all');
  const [unreadMedEvac, setUnreadMedEvac] = useState(0);

  useEffect(() => {
    fetchBookings();
    fetchUnreadMedEvac();
    
    // Set up real-time subscription for new emergency requests
    const subscription = supabase
      .channel('emergency-requests')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'user_requests',
        filter: 'type=eq.medevac'
      }, payload => {
        fetchUnreadMedEvac();
        // Show notification for new emergency request
        if (Notification && Notification.permission === 'granted') {
          new Notification('New Emergency MedEvac Request', {
            body: 'A new emergency medical evacuation request has been received',
            icon: '/vite.svg'
          });
        }
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter, serviceFilter, activeServiceTab]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_requests')
        .select(`
          *,
          creator:system_users!user_id (name, email)
        `)
        .in('type', ['booking', 'jet', 'yacht', 'helicopter', 'car', 'emptyleg', 'fixedoffer'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add creator information to each booking
      const bookingsWithCreator = data?.map(booking => ({
        ...booking,
        creator: booking.creator || { name: 'Unknown', email: 'unknown@example.com' }
      })) || [];
      
      setBookings(bookingsWithCreator);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadMedEvac = async () => {
    try {
      const { count } = await supabase
        .from('user_requests')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'medevac')
        .eq('status', 'pending');
      
      setUnreadMedEvac(count || 0);
    } catch (err) {
      console.error('Error fetching unread medevac requests:', err);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking => {
        const data = booking.data || {};
        return (
          data.departure?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          data.arrival?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          data.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.creator?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.creator?.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    if (activeServiceTab !== 'all') {
      filtered = filtered.filter(booking => {
        // Check both the type field and the data.service field
        return booking.type === activeServiceTab || booking.data?.service === activeServiceTab;
      });
    } else if (serviceFilter !== 'all') {
      filtered = filtered.filter(booking => {
        // Check both the type field and the data.service field
        return booking.type === serviceFilter || booking.data?.service === serviceFilter;
      });
    }

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    if (user?.role !== 'admin') return;

    try {
      // Find the booking to get user_id for notification
      const booking = bookings.find(b => b.id === bookingId);
      const previousStatus = booking?.status;

      const updateData: any = {
        status: newStatus,
        admin_id: user.id
      };

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('user_requests')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      // Create notification for the user when status changes
      if (booking?.user_id && previousStatus !== newStatus) {
        const statusMessages: Record<string, { title: string; message: string }> = {
          'in_progress': {
            title: 'Request In Progress',
            message: `Your ${booking.type || 'travel'} request is now being processed by our team.`
          },
          'confirmed': {
            title: 'Request Confirmed!',
            message: `Great news! Your ${booking.type || 'travel'} request has been confirmed.`
          },
          'completed': {
            title: 'Request Completed',
            message: `Your ${booking.type || 'travel'} request has been completed. Thank you for choosing PrivateCharterX!`
          },
          'cancelled': {
            title: 'Request Cancelled',
            message: `Your ${booking.type || 'travel'} request has been cancelled. Please contact support if you have questions.`
          }
        };

        const notificationInfo = statusMessages[newStatus];
        if (notificationInfo) {
          try {
            await supabase.from('notifications').insert({
              user_id: booking.user_id,
              type: 'booking_update',
              title: notificationInfo.title,
              message: notificationInfo.message,
              data: {
                booking_id: bookingId,
                old_status: previousStatus,
                new_status: newStatus,
                booking_type: booking.type
              },
              read: false
            });
            console.log('✅ User notification created for status change:', newStatus);
          } catch (notifError) {
            console.warn('Failed to create user notification:', notifError);
            // Don't block the status update if notification fails
          }
        }
      }

      showSuccess('Success', `Booking status updated to ${newStatus}`);
      fetchBookings(); // Refresh the list
    } catch (err: any) {
      console.error('Error updating booking status:', err);
      showError('Error', 'Failed to update booking status');
    }
  };

  const updateBooking = async () => {
    if (!selectedBooking || user?.role !== 'admin') return;
    
    try {
      setIsSaving(true);
      setIsSaving(true);
      
      // Update the booking data
      const { error } = await supabase
        .from('user_requests')
        .update({
          data: {
            ...selectedBooking.data,
            ...editBookingData
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;
      
      showSuccess('Success', 'Booking updated successfully');
      
      fetchBookings();
      
      // Update local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === selectedBooking.id 
            ? { 
                ...booking, 
                data: { ...booking.data, ...editBookingData },
                updated_at: new Date().toISOString()
              } 
            : booking
        )
      );
      
      // Update selected booking if details modal is open
      if (showDetailsModal) {
        setSelectedBooking({
          ...selectedBooking,
          data: { ...selectedBooking.data, ...editBookingData },
          updated_at: new Date().toISOString()
        });
      }
      
      setShowEditModal(false);
      setEditBookingData({});
    } catch (err: any) {
      console.error('Error updating booking:', err);
      showError('Error', err.message || 'Failed to update booking');
    } finally {
      setIsSaving(false);
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'jet': return <Plane className="w-5 h-5" />;
      case 'yacht': return <Ship className="w-5 h-5" />;
      case 'helicopter': return <Zap className="w-5 h-5" />;
      case 'car': return <Car className="w-5 h-5" />;
      case 'emptyleg': return <Plane className="w-5 h-5 transform rotate-45" />;
      case 'fixedoffer': return <Package className="w-5 h-5" />;
      default: return <Plane className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <X className="w-4 h-4 text-red-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bookings...</p>
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
            <h1 className="text-2xl font-bold text-black mb-2">Bookings Management</h1>
            <p className="text-gray-600">Track and manage all service bookings</p>
          </div>
          {user?.role === 'admin' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Booking</span>
            </button>
          )}
        </div>

        {/* Main Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'general'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Bookings</span>
          </button>
          <button
            onClick={() => setActiveTab('medevac')}
            className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'medevac'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <Plane className="w-4 h-4" />
            <span>Emergency MedEvac</span>
            {unreadMedEvac > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadMedEvac}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('employee')}
            className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'employee'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <User className="w-4 h-4" />
            <span>My Bookings</span>
          </button>
          {(user?.role === 'admin' || user?.role === 'sales') && (
            <button
              onClick={() => setActiveTab('manager')}
              className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'manager'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Manager Dashboard</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'general' && (
        <>
          {/* Service Tabs */}
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveServiceTab('all')}
              className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                activeServiceTab === 'all'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>All Services</span>
            </button>
            <button
              onClick={() => setActiveServiceTab('jet')}
              className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                activeServiceTab === 'jet'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <Plane className="w-4 h-4" />
              <span>Private Jets</span>
            </button>
            <button
              onClick={() => setActiveServiceTab('helicopter')}
              className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                activeServiceTab === 'helicopter'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Helicopters</span>
            </button>
            <button
              onClick={() => setActiveServiceTab('yacht')}
              className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                activeServiceTab === 'yacht'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <Ship className="w-4 h-4" />
              <span>Yachts</span>
            </button>
            <button
              onClick={() => setActiveServiceTab('car')}
              className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                activeServiceTab === 'car'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Luxury Cars</span>
            </button>
            <button
              onClick={() => setActiveServiceTab('emptyleg')}
              className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                activeServiceTab === 'emptyleg'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Empty Legs</span>
            </button>
            <button
              onClick={() => setActiveServiceTab('fixedoffer')}
              className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                activeServiceTab === 'fixedoffer'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Fixed Offers</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search bookings by departure, arrival, service, or creator..."
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
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
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
                <option value="fixedoffer">Fixed Offer</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-2xl font-bold text-black">{bookings.length}</p>
              <p className="text-sm text-gray-500">Total Bookings</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-2xl font-bold text-black">{bookings.filter(b => b.status === 'pending').length}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-2xl font-bold text-black">{bookings.filter(b => b.status === 'in_progress').length}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-2xl font-bold text-black">
                ${bookings.reduce((sum, b) => sum + (b.data?.amount || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total Value</p>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">Service & Route</th>
                    <th className="text-left p-4 font-medium text-gray-700">Date & Time</th>
                    <th className="text-left p-4 font-medium text-gray-700">Passengers</th>
                    <th className="text-left p-4 font-medium text-gray-700">Status</th>
                    <th className="text-left p-4 font-medium text-gray-700">Amount</th>
                    <th className="text-left p-4 font-medium text-gray-700">Created By</th>
                    <th className="text-left p-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => {
                    const data = booking.data || {};
                    const serviceType = booking.type === 'booking' ? data.service : booking.type;
                    return (
                      <tr key={booking.id} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              {getServiceIcon(serviceType || 'jet')}
                            </div>
                            <div>
                              <p className="font-medium text-black capitalize">{serviceType || 'Jet'} Charter</p>
                              <p className="text-sm text-gray-500">{data.departure} → {data.arrival}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">
                                {data.departure_date ? new Date(data.departure_date).toLocaleDateString() : 'N/A'}
                              </p>
                              <p className="text-sm text-gray-500">{data.departure_time || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{data.passengers || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(booking.status)}
                            {user?.role === 'admin' ? (
                              <select
                                value={booking.status}
                                onChange={(e) => updateBookingStatus(booking.id, e.target.value as any)}
                                className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(booking.status)}`}
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            ) : (
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold">${(data.amount || 0).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">{booking.creator?.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{booking.creator?.email || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowDetailsModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-black transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {user?.role === 'admin' && (
                              <button 
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setEditBookingData({});
                                  setShowEditModal(true);
                                }}
                                className="p-2 text-gray-400 hover:text-black transition-colors"
                                title="Edit Booking"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredBookings.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No bookings found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || serviceFilter !== 'all' || activeServiceTab !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'No bookings have been created yet'
                }
              </p>
            </div>
          )}

          {/* Add Booking Modal */}
          <AddBookingModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onBookingAdded={fetchBookings}
          />

          {/* Edit Booking Modal */}
          {showEditModal && selectedBooking && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-black">Edit Booking</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedBooking(null);
                      setEditBookingData({});
                    }}
                    className="p-2 text-gray-400 hover:text-black transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 space-y-6">
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
                          value={editBookingData.departure !== undefined ? editBookingData.departure : selectedBooking.data?.departure || ''}
                          onChange={(e) => setEditBookingData({ ...editBookingData, departure: e.target.value })}
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
                          value={editBookingData.arrival !== undefined ? editBookingData.arrival : selectedBooking.data?.arrival || ''}
                          onChange={(e) => setEditBookingData({ ...editBookingData, arrival: e.target.value })}
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
                          value={editBookingData.departure_date !== undefined ? editBookingData.departure_date : selectedBooking.data?.departure_date || ''}
                          onChange={(e) => setEditBookingData({ ...editBookingData, departure_date: e.target.value })}
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
                          value={editBookingData.departure_time !== undefined ? editBookingData.departure_time : selectedBooking.data?.departure_time || ''}
                          onChange={(e) => setEditBookingData({ ...editBookingData, departure_time: e.target.value })}
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
                          value={editBookingData.return_date !== undefined ? editBookingData.return_date || '' : selectedBooking.data?.return_date || ''}
                          onChange={(e) => setEditBookingData({ ...editBookingData, return_date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Return Time
                        </label>
                        <input
                          type="time"
                          value={editBookingData.return_time !== undefined ? editBookingData.return_time || '' : selectedBooking.data?.return_time || ''}
                          onChange={(e) => setEditBookingData({ ...editBookingData, return_time: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Service and Passengers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Type *
                      </label>
                      <select
                        value={editBookingData.service !== undefined ? editBookingData.service : selectedBooking.data?.service || selectedBooking.type || 'jet'}
                        onChange={(e) => setEditBookingData({ ...editBookingData, service: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      >
                        <option value="jet">Private Jet</option>
                        <option value="yacht">Yacht</option>
                        <option value="helicopter">Helicopter</option>
                        <option value="car">Luxury Car</option>
                        <option value="emptyleg">Empty Leg</option>
                        <option value="fixedoffer">Fixed Offer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        Passengers *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editBookingData.passengers !== undefined ? editBookingData.passengers : selectedBooking.data?.passengers || 1}
                        onChange={(e) => setEditBookingData({ ...editBookingData, passengers: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      Amount (USD) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editBookingData.amount !== undefined ? editBookingData.amount : selectedBooking.data?.amount || 0}
                      onChange={(e) => setEditBookingData({ ...editBookingData, amount: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  {/* Special Requests */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      Special Requests *
                    </label>
                    <div className="relative">
                      <textarea
                        value={editBookingData.special_requests !== undefined ? editBookingData.special_requests || '' : selectedBooking.data?.special_requests || ''}
                        onChange={(e) => setEditBookingData({ ...editBookingData, special_requests: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="Any special requirements or requests..."
                        required
                      />
                      <button
                        onClick={updateBooking}
                        className="absolute bottom-2 right-2 p-1 bg-black text-white rounded-md hover:bg-gray-800"
                        title="Save special requests"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedBooking(null);
                      setEditBookingData({});
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateBooking}
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

          {/* Booking Details Modal */}
          {showDetailsModal && selectedBooking && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-black">Booking Details</h2>
                  <div className="flex items-center space-x-2">
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => {
                          setShowDetailsModal(false);
                          setEditBookingData({});
                          setShowEditModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                        title="Edit Booking"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        setSelectedBooking(null);
                      }}
                      className="p-2 text-gray-400 hover:text-black transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getServiceIcon(selectedBooking.data?.service || selectedBooking.type || 'jet')}
                      </div>
                      <div>
                        <p className="font-medium text-black capitalize">{selectedBooking.data?.service || selectedBooking.type || 'Jet'} Charter</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusIcon(selectedBooking.status)}
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedBooking.status)}`}>
                            {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1).replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="text-sm font-medium">{new Date(selectedBooking.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Created By</p>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-black">{selectedBooking.creator?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{selectedBooking.creator?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <p className="font-medium text-black">${(selectedBooking.data?.amount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-black mb-3">Route Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Departure</p>
                        <p className="font-medium text-black">{selectedBooking.data?.departure || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Arrival</p>
                        <p className="font-medium text-black">{selectedBooking.data?.arrival || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Departure Date</p>
                        <p className="font-medium text-black">
                          {selectedBooking.data?.departure_date 
                            ? new Date(selectedBooking.data.departure_date).toLocaleDateString() 
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Departure Time</p>
                        <p className="font-medium text-black">{selectedBooking.data?.departure_time || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-black mb-3">Booking Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Passengers</p>
                        <p className="font-medium text-black">{selectedBooking.data?.passengers || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Amount</p>
                        <p className="font-medium text-black">${(selectedBooking.data?.amount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {selectedBooking.data?.special_requests && (
                    <div>
                      <h3 className="font-medium text-black mb-2">Special Requests</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-line">{selectedBooking.data.special_requests}</p>
                      </div>
                    </div>
                  )}

                  {user?.role === 'admin' && (
                    <div>
                      <h3 className="font-medium text-black mb-2">Admin Notes</h3>
                      <textarea
                        value={selectedBooking.admin_notes || ''}
                        onChange={async (e) => {
                          const updatedBooking = { ...selectedBooking, admin_notes: e.target.value };
                          setSelectedBooking(updatedBooking);
                          
                          try {
                            const { error } = await supabase
                              .from('user_requests')
                              .update({ admin_notes: e.target.value })
                              .eq('id', selectedBooking.id);
                              
                            if (error) throw error;
                          } catch (err: any) {
                            console.error('Error updating admin notes:', err);
                            showError('Error', 'Failed to update admin notes');
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        rows={3}
                        placeholder="Add admin notes here..."
                      />
                    </div>
                  )}

                  {user?.role === 'admin' && (
                    <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          updateBookingStatus(selectedBooking.id, 'in_progress');
                          setSelectedBooking({ ...selectedBooking, status: 'in_progress' });
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        disabled={selectedBooking.status === 'in_progress'}
                      >
                        Mark In Progress
                      </button>
                      <button
                        onClick={() => {
                          updateBookingStatus(selectedBooking.id, 'completed');
                          setSelectedBooking({ ...selectedBooking, status: 'completed' });
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        disabled={selectedBooking.status === 'completed'}
                      >
                        Mark Completed
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'medevac' && (
        <EmergencyMedEvacRequests onStatusChange={() => fetchUnreadMedEvac()} />
      )}

      {activeTab === 'employee' && (
        <EmployeeBookingHistory />
      )}

      {activeTab === 'manager' && (user?.role === 'admin' || user?.role === 'sales') && (
        <ManagerBookingDashboard />
      )}
    </div>
  );
};