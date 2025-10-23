import React, { useState, useEffect } from 'react';
import { 
  Plane, 
  Calendar, 
  MapPin, 
  Users, 
  Check, 
  X, 
  ArrowRight, 
  Edit, 
  Send,
  DollarSign,
  Clock,
  Filter,
  Search,
  Eye,
  Globe
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAdminPermissions } from '../../../hooks/useAdminPermissions';

interface BookingRequest {
  id: string;
  user_id?: string;
  origin_airport_code: string;
  destination_airport_code: string;
  departure_date: string;
  departure_time: string;
  passengers: number;
  luggage: number;
  pets: number;
  selected_jet_category: string;
  aviation_services: string[];
  luxury_services: string[];
  carbon_option: string;
  carbon_nft_wallet?: string;
  total_price: number;
  currency: string;
  payment_method: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_company?: string;
  wallet_address?: string;
  nft_discount_applied: boolean;
  nft_free_flight_applied: boolean;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  final_price?: number;
  admin_notes?: string;
}

export default function BookingRequestManagement() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRequest, setEditingRequest] = useState<BookingRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [finalPrice, setFinalPrice] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');

  const { canApprovBookings, hasPermission } = useAdminPermissions();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('booking_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching booking requests:', err);
      setError('Failed to load booking requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    if (!hasPermission('booking_requests', 'write')) {
      setError('You do not have permission to update booking requests');
      return;
    }

    try {
      const oldRequest = requests.find(r => r.id === requestId);
      
      const { error } = await supabase
        .from('booking_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_action_type: 'update',
        p_target_table: 'booking_requests',
        p_target_id: requestId,
        p_old_data: { status: oldRequest?.status },
        p_new_data: { status: newStatus },
        p_admin_notes: `Status changed to ${newStatus}`
      });

      fetchRequests();
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError('Failed to update booking status');
    }
  };

  const openRequestDetails = (request: BookingRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const closeRequestDetails = () => {
    setSelectedRequest(null);
    setShowDetailsModal(false);
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const handleSaveChanges = async () => {
    if (!editingRequest || !hasPermission('booking_requests', 'approve')) return;

    try {
      const updates: any = {
        updated_at: new Date().toISOString()
      };

      if (finalPrice) {
        updates.final_price = parseFloat(finalPrice);
        updates.status = 'price_proposed';
      }

      if (adminNotes) {
        updates.admin_notes = adminNotes;
      }

      const { error } = await supabase
        .from('booking_requests')
        .update(updates)
        .eq('id', editingRequest.id);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_action_type: 'approve',
        p_target_table: 'booking_requests',
        p_target_id: editingRequest.id,
        p_old_data: { 
          final_price: editingRequest.final_price,
          admin_notes: editingRequest.admin_notes 
        },
        p_new_data: updates,
        p_admin_notes: 'Price proposal updated'
      });

      setEditingRequest(null);
      setFinalPrice('');
      setAdminNotes('');
      fetchRequests();
    } catch (err) {
      console.error('Error updating booking request:', err);
      setError('Failed to update booking request');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'price_proposed':
        return 'bg-blue-100 text-blue-800';
      case 'payment_pending':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesTab = activeTab === 'all' || request.status.toLowerCase() === activeTab;
    const matchesSearch = !searchQuery || 
      request.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.origin_airport_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.destination_airport_code.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Booking Requests</h2>
          <p className="text-gray-600">Manage flight booking requests and pricing</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent w-64"
            />
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['all', 'pending', 'price_proposed', 'payment_pending', 'confirmed', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'all' ? 'All Requests' : tab.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                  {tab === 'all' 
                    ? requests.length 
                    : requests.filter(r => r.status.toLowerCase() === tab).length
                  }
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flight Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Users size={20} className="text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {request.contact_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.contact_email}
                        </div>
                        {request.contact_company && (
                          <div className="text-xs text-gray-400">
                            {request.contact_company}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin size={16} className="text-gray-400 mr-1" />
                      <span>{request.origin_airport_code}</span>
                      <ArrowRight size={14} className="mx-2 text-gray-400" />
                      <span>{request.destination_airport_code}</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="flex items-center text-gray-900 mb-1">
                        <Calendar size={16} className="text-gray-400 mr-1" />
                        <span>{formatDate(request.departure_date)}</span>
                        <Clock size={14} className="text-gray-400 ml-2 mr-1" />
                        <span>{request.departure_time}</span>
                      </div>
                      <div className="text-gray-500">
                        {request.selected_jet_category} • {request.passengers} pax
                      </div>
                      {(request.nft_discount_applied || request.nft_free_flight_applied) && (
                        <div className="text-xs text-green-600 font-medium">
                          NFT Benefits Applied
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {request.currency} {request.total_price.toLocaleString()}
                      </div>
                      {request.final_price && (
                        <div className="font-medium text-green-600">
                          Final: {request.currency} {request.final_price.toLocaleString()}
                        </div>
                      )}
                      <div className="text-gray-500 text-xs">
                        {request.payment_method}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                      {request.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openRequestDetails(request)}
                        className="text-gray-600 hover:text-gray-900"
                        title="View details"
                      >
                        <Eye size={18} />
                      </button>
                      
                      {request.status === 'pending' && hasPermission('booking_requests', 'approve') && (
                        <button
                          onClick={() => {
                            setEditingRequest(request);
                            setFinalPrice(request.final_price?.toString() || '');
                            setAdminNotes(request.admin_notes || '');
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit pricing"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      
                      {request.status === 'price_proposed' && hasPermission('booking_requests', 'write') && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'payment_pending')}
                          className="text-green-600 hover:text-green-900"
                          title="Mark as payment pending"
                        >
                          <Send size={18} />
                        </button>
                      )}
                      
                      {request.status === 'payment_pending' && hasPermission('booking_requests', 'approve') && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'confirmed')}
                          className="text-green-600 hover:text-green-900"
                          title="Confirm booking"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      
                      {['pending', 'price_proposed'].includes(request.status) && hasPermission('booking_requests', 'write') && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'cancelled')}
                          className="text-red-600 hover:text-red-900"
                          title="Cancel request"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredRequests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No booking requests found
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Review Booking Request</h3>
              <button
                onClick={() => setEditingRequest(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Client Information */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Client Information</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Name</div>
                      <div className="font-medium">{editingRequest.contact_name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium">{editingRequest.contact_email}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="font-medium">{editingRequest.contact_phone}</div>
                    </div>
                    {editingRequest.contact_company && (
                      <div>
                        <div className="text-sm text-gray-500">Company</div>
                        <div className="font-medium">{editingRequest.contact_company}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Flight Details */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Flight Details</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Route</div>
                      <div className="font-medium">
                        {editingRequest.origin_airport_code} → {editingRequest.destination_airport_code}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Aircraft Category</div>
                      <div className="font-medium">{editingRequest.selected_jet_category}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Departure</div>
                      <div className="font-medium">
                        {formatDate(editingRequest.departure_date)} at {editingRequest.departure_time}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Passengers</div>
                      <div className="font-medium">
                        {editingRequest.passengers} passengers, {editingRequest.luggage} luggage
                        {editingRequest.pets > 0 && `, ${editingRequest.pets} pets`}
                      </div>
                    </div>
                  </div>
                  
                  {(editingRequest.aviation_services.length > 0 || editingRequest.luxury_services.length > 0) && (
                    <div className="mt-4">
                      <div className="text-sm text-gray-500 mb-2">Additional Services</div>
                      <div className="flex flex-wrap gap-2">
                        {editingRequest.aviation_services.map(service => (
                          <span key={service} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {service}
                          </span>
                        ))}
                        {editingRequest.luxury_services.map(service => (
                          <span key={service} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Final Price ({editingRequest.currency})
                  </label>
                  <input
                    type="number"
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter final price"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    Original quote: {editingRequest.currency} {editingRequest.total_price.toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                    placeholder="Add notes about the booking"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditingRequest(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                  disabled={!finalPrice}
                >
                  Save & Propose Price
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">
                  ✈️
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    Booking Request Details
                  </h2>
                  <p className="text-sm text-gray-600">ID: {selectedRequest.id.slice(0, 8)}</p>
                </div>
              </div>
              <button
                onClick={closeRequestDetails}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                {/* Request Overview */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Request Overview</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Status</div>
                        <div className="text-sm font-medium text-gray-900">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                            {selectedRequest.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Created</div>
                        <div className="text-sm font-medium text-gray-900">{formatDate(selectedRequest.created_at)}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Route</div>
                      <div className="text-sm font-medium text-gray-900">
                        {selectedRequest.origin_airport_code} → {selectedRequest.destination_airport_code}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flight Details */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Flight Details</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Departure Date</div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(selectedRequest.departure_date)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Departure Time</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRequest.departure_time}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Passengers</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRequest.passengers}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Luggage</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRequest.luggage}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Pets</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRequest.pets}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Aircraft Category</div>
                      <div className="text-sm font-medium text-gray-900">
                        {selectedRequest.selected_jet_category}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services & Options */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Services & Options</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Aviation Services</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRequest.aviation_services && selectedRequest.aviation_services.length > 0
                            ? selectedRequest.aviation_services.join(', ')
                            : 'None selected'
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Luxury Services</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRequest.luxury_services && selectedRequest.luxury_services.length > 0
                            ? selectedRequest.luxury_services.join(', ')
                            : 'None selected'
                          }
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Carbon Offset</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRequest.carbon_option === 'full' ? 'Full Offset' : 'None'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Payment Method</div>
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {selectedRequest.payment_method}
                        </div>
                      </div>
                    </div>
                    {selectedRequest.carbon_nft_wallet && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Carbon NFT Wallet</div>
                        <div className="text-sm font-medium text-gray-900 font-mono break-all">
                          {selectedRequest.carbon_nft_wallet}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing Information */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Pricing Information</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Total Price</div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(selectedRequest.total_price, selectedRequest.currency)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Currency</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRequest.currency}
                        </div>
                      </div>
                    </div>
                    {selectedRequest.final_price && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Final Price (Admin)</div>
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(selectedRequest.final_price, selectedRequest.currency)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Price Difference</div>
                          <div className="text-sm font-medium text-gray-900">
                            {selectedRequest.final_price !== selectedRequest.total_price && 
                              formatCurrency(selectedRequest.final_price - selectedRequest.total_price, selectedRequest.currency)
                            }
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">NFT Discount Applied</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRequest.nft_discount_applied ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">NFT Free Flight Applied</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRequest.nft_free_flight_applied ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </div>
                    {selectedRequest.wallet_address && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Wallet Address</div>
                        <div className="text-sm font-medium text-gray-900 font-mono break-all">
                          {selectedRequest.wallet_address}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Contact Name</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRequest.contact_name}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Email</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRequest.contact_email}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Phone</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRequest.contact_phone}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Company</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRequest.contact_company || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {(selectedRequest.notes || selectedRequest.admin_notes) && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Notes</h3>
                    <div className="space-y-3">
                      {selectedRequest.notes && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-xs text-gray-500 mb-1">Customer Notes</div>
                          <div className="text-sm text-gray-900">
                            {selectedRequest.notes}
                          </div>
                        </div>
                      )}
                      {selectedRequest.admin_notes && (
                        <div className="bg-blue-50 rounded-xl p-4">
                          <div className="text-xs text-blue-600 mb-1">Admin Notes</div>
                          <div className="text-sm text-blue-900">
                            {selectedRequest.admin_notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}