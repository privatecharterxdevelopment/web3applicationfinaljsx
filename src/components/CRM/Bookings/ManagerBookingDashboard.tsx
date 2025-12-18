import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  User, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  X,
  Plane,
  Ship,
  Zap,
  Car,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  UserCheck,
  Edit2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/CRM/AuthContext';
import { useNotification } from '../../../contexts/CRM/NotificationContext';

interface ManagerBooking {
  id: string;
  booking_number: string;
  employee_id: string;
  client_name: string;
  client_email: string;
  service_type: string;
  departure: string;
  arrival: string;
  departure_date: string;
  departure_time: string | null;
  passengers: number;
  status: string;
  priority: string;
  estimated_budget: number | null;
  final_amount: number | null;
  currency: string;
  assigned_to: string | null;
  closed_by: string | null;
  closed_at: string | null;
  special_requests: string | null;
  aircraft_preference: string | null;
  created_at: string;
  employee: {
    name: string;
    email: string;
  };
  assigned_user?: {
    name: string;
  };
}

export const ManagerBookingDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [bookings, setBookings] = useState<ManagerBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<ManagerBooking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'assigned' | 'quoted' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'normal' | 'high' | 'urgent'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<ManagerBooking | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [managers, setManagers] = useState<any[]>([]);

  useEffect(() => {
    fetchBookings();
    fetchManagers();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter, priorityFilter]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('employee_bookings')
        .select(`
          *,
          employee:system_users!employee_id (name, email),
          assigned_user:system_users!assigned_to (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      showError('Error', 'Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const { data, error } = await supabase
        .from('system_users')
        .select('id, name, email')
        .or('role.eq.admin,department.eq.Business Aviation,role.eq.sales')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setManagers(data || []);
    } catch (err: any) {
      console.error('Error fetching managers:', err);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.departure.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.arrival.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(booking => booking.priority === priorityFilter);
    }

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string, finalAmount?: number) => {
    try {
      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user?.email)
        .single();

      if (!systemUser) {
        throw new Error('User not found in system');
      }

      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'completed' && finalAmount) {
        updateData.final_amount = finalAmount;
        updateData.closed_by = systemUser.id;
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('employee_bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      showSuccess('Success', `Booking status updated to ${newStatus}`);
      fetchBookings();
    } catch (err: any) {
      showError('Error', 'Failed to update booking status');
    }
  };

  const assignBooking = async (bookingId: string, managerId: string) => {
    try {
      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user?.email)
        .single();

      if (!systemUser) {
        throw new Error('User not found in system');
      }

      const { error } = await supabase
        .from('employee_bookings')
        .update({
          assigned_to: managerId,
          assigned_at: new Date().toISOString(),
          status: 'assigned'
        })
        .eq('id', bookingId);

      if (error) throw error;

      showSuccess('Success', 'Booking assigned successfully');
      setShowAssignModal(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (err: any) {
      showError('Error', 'Failed to assign booking');
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'jet': return <Plane className="w-5 h-5" />;
      case 'yacht': return <Ship className="w-5 h-5" />;
      case 'helicopter': return <Zap className="w-5 h-5" />;
      case 'car': return <Car className="w-5 h-5" />;
      default: return <Plane className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'assigned': return <User className="w-4 h-4 text-blue-500" />;
      case 'quoted': return <DollarSign className="w-4 h-4 text-yellow-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled': return <X className="w-4 h-4 text-red-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'quoted': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-black mb-4">Booking Requests Management</h2>
        
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by booking number, client, employee, or route..."
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
                <option value="assigned">Assigned</option>
                <option value="quoted">Quoted</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-black">{bookings.length}</p>
            <p className="text-sm text-gray-500">Total Requests</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-black">{bookings.filter(b => b.status === 'pending').length}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-black">{bookings.filter(b => b.status === 'assigned').length}</p>
            <p className="text-sm text-gray-500">Assigned</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-black">{bookings.filter(b => b.status === 'completed').length}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-black">
              {bookings.filter(b => b.final_amount).reduce((sum, b) => sum + (b.final_amount || 0), 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Total Value (USD)</p>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Booking</th>
                <th className="text-left p-4 font-medium text-gray-700">Employee</th>
                <th className="text-left p-4 font-medium text-gray-700">Client</th>
                <th className="text-left p-4 font-medium text-gray-700">Service & Route</th>
                <th className="text-left p-4 font-medium text-gray-700">Date</th>
                <th className="text-left p-4 font-medium text-gray-700">Status</th>
                <th className="text-left p-4 font-medium text-gray-700">Assigned To</th>
                <th className="text-left p-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-black">{booking.booking_number}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(booking.priority)}`}>
                          {booking.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-black">{booking.employee.name}</p>
                      <p className="text-sm text-gray-500">{booking.employee.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-black">{booking.client_name}</p>
                      <p className="text-sm text-gray-500">{booking.client_email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2 mb-1">
                      {getServiceIcon(booking.service_type)}
                      <span className="capitalize text-sm">{booking.service_type}</span>
                    </div>
                    <p className="text-sm text-gray-600">{booking.departure} → {booking.arrival}</p>
                    <p className="text-xs text-gray-500">{booking.passengers} passengers</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm">{new Date(booking.departure_date).toLocaleDateString()}</p>
                        {booking.departure_time && (
                          <p className="text-xs text-gray-500">{booking.departure_time}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(booking.status)}
                      <select
                        value={booking.status}
                        onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(booking.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="quoted">Quoted</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-4">
                    {booking.assigned_user ? (
                      <p className="text-sm font-medium">{booking.assigned_user.name}</p>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowAssignModal(true);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Assign</span>
                      </button>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredBookings.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No booking requests found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'No booking requests have been submitted yet'
            }
          </p>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Assign Booking</h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Assign booking {selectedBooking.booking_number} to a manager:
              </p>
              
              <div className="space-y-2">
                {managers.map((manager) => (
                  <button
                    key={manager.id}
                    onClick={() => assignBooking(selectedBooking.id, manager.id)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-black">{manager.name}</p>
                    <p className="text-sm text-gray-500">{manager.email}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && !showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Booking Request Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-black mb-3">Booking Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500">Booking Number</p>
                      <p className="font-medium text-black">{selectedBooking.booking_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedBooking.status)}
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedBooking.status)}`}>
                          {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Priority</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(selectedBooking.priority)}`}>
                        {selectedBooking.priority.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Submitted By</p>
                      <p className="font-medium text-black">{selectedBooking.employee.name}</p>
                      <p className="text-sm text-gray-500">{selectedBooking.employee.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-black mb-3">Client Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500">Client Name</p>
                      <p className="font-medium text-black">{selectedBooking.client_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-black">{selectedBooking.client_email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-black mb-3">Service Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Service Type</p>
                    <div className="flex items-center space-x-2">
                      {getServiceIcon(selectedBooking.service_type)}
                      <span className="capitalize">{selectedBooking.service_type}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Passengers</p>
                    <p className="font-medium text-black">{selectedBooking.passengers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Route</p>
                    <p className="font-medium text-black">{selectedBooking.departure} → {selectedBooking.arrival}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium text-black">
                      {new Date(selectedBooking.departure_date).toLocaleDateString()}
                      {selectedBooking.departure_time && ` at ${selectedBooking.departure_time}`}
                    </p>
                  </div>
                </div>
              </div>

              {selectedBooking.aircraft_preference && (
                <div>
                  <p className="text-sm text-gray-500">Aircraft Preference</p>
                  <p className="font-medium text-black">{selectedBooking.aircraft_preference}</p>
                </div>
              )}

              {selectedBooking.special_requests && (
                <div>
                  <p className="text-sm text-gray-500">Special Requests</p>
                  <p className="font-medium text-black">{selectedBooking.special_requests}</p>
                </div>
              )}

              {selectedBooking.estimated_budget && (
                <div>
                  <p className="text-sm text-gray-500">Estimated Budget</p>
                  <p className="font-medium text-black">{selectedBooking.currency}{selectedBooking.estimated_budget.toLocaleString()}</p>
                </div>
              )}

              {selectedBooking.final_amount && (
                <div>
                  <p className="text-sm text-gray-500">Final Amount</p>
                  <p className="font-medium text-black text-lg">{selectedBooking.currency}{selectedBooking.final_amount.toLocaleString()}</p>
                </div>
              )}

              {selectedBooking.assigned_user && (
                <div>
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <p className="font-medium text-black">{selectedBooking.assigned_user.name}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="font-medium text-black">{new Date(selectedBooking.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};