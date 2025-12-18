import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  X,
  Plane,
  Ship,
  Zap,
  Car,
  User,
  Eye,
  Filter,
  Search
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface EmployeeBooking {
  id: string;
  booking_number: string;
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
  created_at: string;
  assigned_user?: {
    name: string;
  };
  closed_user?: {
    name: string;
  };
}

export const EmployeeBookingHistory: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<EmployeeBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<EmployeeBooking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'assigned' | 'quoted' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<EmployeeBooking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter]);

  const fetchBookings = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!systemUser) return;

      const { data, error } = await supabase
        .from('employee_bookings')
        .select(`
          *,
          assigned_user:system_users!assigned_to (name),
          closed_user:system_users!closed_by (name)
        `)
        .eq('employee_id', systemUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.departure.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.arrival.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
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
            <p className="text-gray-600">Loading your booking history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-black mb-4">My Booking History</h2>
        
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by booking number, client, or route..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-black">{bookings.length}</p>
            <p className="text-sm text-gray-500">Total Requests</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-black">{bookings.filter(b => b.status === 'pending').length}</p>
            <p className="text-sm text-gray-500">Pending</p>
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

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((booking) => (
          <div key={booking.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getServiceIcon(booking.service_type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-black">{booking.booking_number}</h3>
                    <p className="text-sm text-gray-500">{booking.client_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(booking.priority)}`}>
                    {booking.priority.toUpperCase()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="p-2 text-gray-400 hover:text-black transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{booking.departure} → {booking.arrival}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{new Date(booking.departure_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{booking.passengers} passengers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span>
                    {booking.final_amount 
                      ? `${booking.currency}${booking.final_amount.toLocaleString()}`
                      : booking.estimated_budget 
                      ? `~${booking.currency}${booking.estimated_budget.toLocaleString()}`
                      : 'TBD'
                    }
                  </span>
                </div>
              </div>

              {booking.assigned_user && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Assigned to: <span className="font-medium">{booking.assigned_user.name}</span>
                  </p>
                </div>
              )}

              {booking.closed_user && booking.closed_at && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Closed by: <span className="font-medium">{booking.closed_user.name}</span> on {new Date(booking.closed_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredBookings.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No booking requests found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'You haven\'t submitted any booking requests yet'
            }
          </p>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Booking Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
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
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-medium text-black">{selectedBooking.client_name}</p>
                  <p className="text-sm text-gray-500">{selectedBooking.client_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Service Type</p>
                  <div className="flex items-center space-x-2">
                    {getServiceIcon(selectedBooking.service_type)}
                    <span className="capitalize">{selectedBooking.service_type}</span>
                  </div>
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
                <div>
                  <p className="text-sm text-gray-500">Passengers</p>
                  <p className="font-medium text-black">{selectedBooking.passengers}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(selectedBooking.priority)}`}>
                    {selectedBooking.priority.toUpperCase()}
                  </span>
                </div>
              </div>

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
                  <p className="text-sm text-gray-500">Assigned Manager</p>
                  <p className="font-medium text-black">{selectedBooking.assigned_user.name}</p>
                </div>
              )}

              {selectedBooking.closed_user && selectedBooking.closed_at && (
                <div>
                  <p className="text-sm text-gray-500">Deal Closed By</p>
                  <p className="font-medium text-black">{selectedBooking.closed_user.name}</p>
                  <p className="text-sm text-gray-500">on {new Date(selectedBooking.closed_at).toLocaleDateString()}</p>
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