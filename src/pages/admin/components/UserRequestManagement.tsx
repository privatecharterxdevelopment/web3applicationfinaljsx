import React, { useState, useEffect } from 'react';
import {
  FileText,
  User,
  Calendar,
  Check,
  X,
  Clock,
  Mail,
  Phone,
  MessageSquare,
  Search,
  Filter,
  Eye,
  MapPin,
  Plane,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAdminPermissions } from '../../../hooks/useAdminPermissions';

interface UserRequest {
  id: string;
  user_id: string;
  type: string;
  status: string;
  data: any;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  admin_notes?: string;
  admin_id?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  aircraft_model?: string;
  aircraft_type?: string;
  capacity?: string;
  range?: string;
  speed?: string;
  users?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const REQUEST_TYPES = [
  { value: 'flight_quote', label: 'Flight Quote' },
  { value: 'support', label: 'Support' },
  { value: 'document', label: 'Document' },
  { value: 'visa', label: 'Visa' },
  { value: 'payment', label: 'Payment' },
  { value: 'booking', label: 'Booking' },
  { value: 'cancellation', label: 'Cancellation' },
  { value: 'modification', label: 'Modification' },
  { value: 'private_jet_charter', label: 'Private Jet Charter' },
  { value: 'fixed_offer', label: 'Fixed Offer' },
  { value: 'helicopter_charter', label: 'Helicopter Charter' },
  { value: 'empty_leg', label: 'Empty Leg' },
  { value: 'luxury_car_rental', label: 'Luxury Car Rental' },
  { value: 'luxury_car', label: 'Luxury Car' },
  { value: 'adventure_package', label: 'Adventure Package' },
  { value: 'co2_certificate', label: 'CO2 Certificate' },
  { value: 'taxi_concierge', label: 'Taxi/Concierge' },
  { value: 'nft_discount_empty_leg', label: 'NFT Discount Empty Leg' },
  { value: 'nft_free_flight', label: 'NFT Free Flight' },
  { value: 'spv_formation', label: 'SPV Formation' },
  { value: 'tokenization', label: 'Asset Tokenization' }
];

export default function UserRequestManagement() {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRequest, setEditingRequest] = useState<UserRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { canCompleteUserRequests, hasPermission } = useAdminPermissions();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_requests')
        .select(`
          *,
          users:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching user requests:', err);
      setError('Failed to load user requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    if (!hasPermission('user_requests', 'write')) {
      setError('You do not have permission to update user requests');
      return;
    }

    try {
      const oldRequest = requests.find(r => r.id === requestId);

      // Get current admin user
      const { data: { user } } = await supabase.auth.getUser();

      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        admin_id: user?.id // Track which admin updated the request
      };

      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('user_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_action_type: 'update',
        p_target_table: 'user_requests',
        p_target_id: requestId,
        p_old_data: { status: oldRequest?.status },
        p_new_data: { status: newStatus },
        p_admin_notes: `Status changed to ${newStatus}`
      });

      // Database trigger will automatically create notification for user
      fetchRequests();
    } catch (err) {
      console.error('Error updating user request status:', err);
      setError('Failed to update user request status');
    }
  };

  const handleSaveNotes = async () => {
    if (!editingRequest || !hasPermission('user_requests', 'write')) return;

    try {
      // Get current admin user
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('user_requests')
        .update({
          admin_notes: adminNotes,
          admin_id: user?.id, // Track which admin responded
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRequest.id);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_action_type: 'update',
        p_target_table: 'user_requests',
        p_target_id: editingRequest.id,
        p_old_data: { admin_notes: editingRequest.admin_notes },
        p_new_data: { admin_notes: adminNotes },
        p_admin_notes: 'Admin notes updated'
      });

      // Database trigger will automatically create notification for user
      setEditingRequest(null);
      setAdminNotes('');
      fetchRequests();
    } catch (err) {
      console.error('Error saving admin notes:', err);
      setError('Failed to save admin notes');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-gray-200 text-gray-700';
      case 'in_progress':
        return 'bg-gray-300 text-gray-800';
      case 'completed':
        return 'bg-gray-900 text-white';
      case 'cancelled':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (_type: string): string => {
    return 'bg-gray-100 text-gray-700';
  };

  const getUserName = (user: { first_name?: string; last_name?: string } | null) => {
    if (!user) return null;
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return name || null;
  };

  const getTypeLabel = (type: string): string => {
    const typeConfig = REQUEST_TYPES.find(t => t.value === type);
    return typeConfig?.label || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const openRequestDetails = (request: UserRequest) => {
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

  const filteredRequests = requests.filter(request => {
    const matchesTab = activeTab === 'all' || request.status.toLowerCase() === activeTab;
    const matchesType = typeFilter === 'all' || request.type === typeFilter;
    const matchesSearch = !searchQuery || 
      (request.client_name && request.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (request.client_email && request.client_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      request.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(request.data).toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesType && matchesSearch;
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
        <div className="bg-gray-100 text-gray-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">User Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all service requests and inquiries</p>
        </div>
        <button
          onClick={fetchRequests}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="all">All Types</option>
            {REQUEST_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab === 'all' ? 'All' : tab.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
              activeTab === tab ? 'bg-white/20' : 'bg-gray-100'
            }`}>
              {tab === 'all'
                ? requests.length
                : requests.filter(r => r.status.toLowerCase() === tab).length
              }
            </span>
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-gray-500" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.id.substring(0, 8)}
                        </div>
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                          {getTypeLabel(request.type)}
                        </span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      {(request.client_name || getUserName(request.users || null)) ? (
                        <div>
                          <div className="font-medium text-gray-900 flex items-center">
                            <User size={14} className="text-gray-400 mr-1" />
                            {request.client_name || getUserName(request.users || null)}
                          </div>
                          {(request.client_email || request.users?.email) && (
                            <div className="text-gray-500 flex items-center mt-0.5 text-xs">
                              <Mail size={12} className="text-gray-400 mr-1" />
                              {request.client_email || request.users?.email}
                            </div>
                          )}
                          {request.client_phone && (
                            <div className="text-gray-400 flex items-center text-xs">
                              <Phone size={12} className="text-gray-400 mr-1" />
                              {request.client_phone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="text-gray-500 text-xs">
                            ID: {request.user_id?.substring(0, 8)}...
                          </div>
                          {request.users?.email && (
                            <div className="text-gray-600 flex items-center mt-0.5 text-xs">
                              <Mail size={12} className="text-gray-400 mr-1" />
                              {request.users.email}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="text-sm max-w-xs">
                      {request.aircraft_model && (
                        <div className="font-medium text-gray-900 mb-0.5">
                          {request.aircraft_model}
                        </div>
                      )}
                      {request.aircraft_type && (
                        <div className="text-xs text-gray-500">{request.aircraft_type}</div>
                      )}
                      {request.capacity && (
                        <div className="text-xs text-gray-500">Capacity: {request.capacity}</div>
                      )}
                      {!request.aircraft_model && request.data && (
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          {typeof request.data === 'object'
                            ? (request.data.from || request.data.origin || '-')
                            : '-'
                          }
                          {(request.data?.to || request.data?.destination) && (
                            <> → {request.data.to || request.data.destination}</>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600">
                      {formatDate(request.created_at)}
                    </div>
                    {request.completed_at && (
                      <div className="text-xs text-gray-400">
                        Done: {formatDate(request.completed_at)}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(request.status)}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openRequestDetails(request)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingRequest(request);
                          setAdminNotes(request.admin_notes || '');
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                        title="Add notes"
                      >
                        <MessageSquare size={16} />
                      </button>

                      {request.status === 'pending' && hasPermission('user_requests', 'write') && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'in_progress')}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                          title="Start processing"
                        >
                          <Clock size={16} />
                        </button>
                      )}

                      {request.status === 'in_progress' && canCompleteUserRequests && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'completed')}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
                          title="Mark completed"
                        >
                          <Check size={16} />
                        </button>
                      )}

                      {['pending', 'in_progress'].includes(request.status) && hasPermission('user_requests', 'write') && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'cancelled')}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                          title="Cancel request"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No requests found</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes Modal */}
      {editingRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Admin Notes</h2>
                <p className="text-sm text-gray-500">Request {editingRequest.id.slice(0, 8)}</p>
              </div>
              <button
                onClick={() => setEditingRequest(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Request Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Type</div>
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                      {getTypeLabel(editingRequest.type)}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Status</div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(editingRequest.status)}`}>
                      {editingRequest.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Created</div>
                    <div className="text-sm text-gray-900">{formatDate(editingRequest.created_at)}</div>
                  </div>
                </div>

                {(editingRequest.client_name || editingRequest.client_email || editingRequest.users?.email) && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-2">Client</div>
                    <div className="space-y-0.5">
                      {editingRequest.client_name && (
                        <div className="text-sm font-medium text-gray-900">{editingRequest.client_name}</div>
                      )}
                      {(editingRequest.client_email || editingRequest.users?.email) && (
                        <div className="text-sm text-gray-600">{editingRequest.client_email || editingRequest.users?.email}</div>
                      )}
                      {editingRequest.client_phone && (
                        <div className="text-sm text-gray-600">{editingRequest.client_phone}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
                  placeholder="Add notes about this request..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingRequest(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <FileText size={20} className="text-gray-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {getTypeLabel(selectedRequest.type)}
                  </h2>
                  <p className="text-sm text-gray-500">ID: {selectedRequest.id.slice(0, 8)}</p>
                </div>
              </div>
              <button
                onClick={closeRequestDetails}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Request Overview */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide mb-3">Overview</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Status</div>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(selectedRequest.status)}`}>
                          {selectedRequest.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Type</div>
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                          {getTypeLabel(selectedRequest.type)}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Submitted</div>
                        <div className="text-sm text-gray-900">{formatDate(selectedRequest.created_at)}</div>
                      </div>
                    </div>
                    {selectedRequest.completed_at && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Completed</div>
                        <div className="text-sm text-gray-900">{formatDate(selectedRequest.completed_at)}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Client Information */}
                {(selectedRequest.client_name || selectedRequest.client_email || selectedRequest.client_phone) && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Client Information</h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      {selectedRequest.client_name && (
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{selectedRequest.client_name}</span>
                        </div>
                      )}
                      {selectedRequest.client_email && (
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{selectedRequest.client_email}</span>
                        </div>
                      )}
                      {selectedRequest.client_phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{selectedRequest.client_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Aircraft Information */}
                {(selectedRequest.aircraft_model || selectedRequest.aircraft_type) && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Aircraft Information</h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        {selectedRequest.aircraft_model && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Aircraft Model</div>
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              <Plane size={16} className="text-gray-400" />
                              {selectedRequest.aircraft_model}
                            </div>
                          </div>
                        )}
                        {selectedRequest.aircraft_type && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Aircraft Type</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.aircraft_type}</div>
                          </div>
                        )}
                        {selectedRequest.capacity && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Capacity</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.capacity}</div>
                          </div>
                        )}
                        {selectedRequest.range && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Range</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.range}</div>
                          </div>
                        )}
                        {selectedRequest.speed && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Speed</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.speed}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Request Data - Different display based on type */}
                {selectedRequest.data && Object.keys(selectedRequest.data).length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Request Details</h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      {/* Private Jet Charter Details */}
                      {(selectedRequest.type === 'private_jet_charter' || selectedRequest.type === 'jets') && (
                        <div className="space-y-4">
                          {selectedRequest.data.from && selectedRequest.data.to && (
                            <div>
                              <div className="text-xs text-gray-500 mb-2">Route</div>
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                <MapPin size={16} className="text-gray-500" />
                                {selectedRequest.data.from}
                                <ArrowRight size={16} className="text-gray-400" />
                                <MapPin size={16} className="text-gray-400" />
                                {selectedRequest.data.to}
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            {selectedRequest.data.departure_date && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Departure Date</div>
                                <div className="text-sm font-medium text-gray-900">{formatDate(selectedRequest.data.departure_date)}</div>
                              </div>
                            )}
                            {selectedRequest.data.departure_time && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Departure Time</div>
                                <div className="text-sm font-medium text-gray-900">{selectedRequest.data.departure_time}</div>
                              </div>
                            )}
                            {selectedRequest.data.passengers && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Passengers</div>
                                <div className="text-sm font-medium text-gray-900">{selectedRequest.data.passengers}</div>
                              </div>
                            )}
                            {selectedRequest.data.luggage && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Luggage</div>
                                <div className="text-sm font-medium text-gray-900">{selectedRequest.data.luggage}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Empty Leg Details */}
                      {(selectedRequest.type === 'empty_leg' || selectedRequest.type === 'nft_discount_empty_leg' || selectedRequest.type === 'nft_free_flight') && (
                        <div className="space-y-4">
                          {selectedRequest.data.departure_iata && selectedRequest.data.arrival_iata && (
                            <div>
                              <div className="text-xs text-gray-500 mb-2">Route</div>
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                <MapPin size={16} className="text-gray-500" />
                                {selectedRequest.data.departure_iata}
                                <ArrowRight size={16} className="text-gray-400" />
                                <MapPin size={16} className="text-gray-400" />
                                {selectedRequest.data.arrival_iata}
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            {selectedRequest.data.departure_date && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Departure Date</div>
                                <div className="text-sm font-medium text-gray-900">{formatDate(selectedRequest.data.departure_date)}</div>
                              </div>
                            )}
                            {selectedRequest.data.departure_time && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Departure Time</div>
                                <div className="text-sm font-medium text-gray-900">{selectedRequest.data.departure_time}</div>
                              </div>
                            )}
                            {selectedRequest.data.passengers && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Passengers</div>
                                <div className="text-sm font-medium text-gray-900">{selectedRequest.data.passengers}</div>
                              </div>
                            )}
                            {selectedRequest.data.total_price && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Total Price</div>
                                <div className="text-sm font-medium text-gray-900">{formatCurrency(selectedRequest.data.total_price)}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Adventure Package Details */}
                      {selectedRequest.type === 'adventures' && (
                        <div className="space-y-4">
                          {selectedRequest.data.offer_title && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Package Title</div>
                              <div className="text-sm font-medium text-gray-900">{selectedRequest.data.offer_title}</div>
                            </div>
                          )}
                          {selectedRequest.data.origin && selectedRequest.data.destination && (
                            <div>
                              <div className="text-xs text-gray-500 mb-2">Route</div>
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                <MapPin size={16} className="text-gray-500" />
                                {selectedRequest.data.origin}
                                <ArrowRight size={16} className="text-gray-400" />
                                <MapPin size={16} className="text-gray-400" />
                                {selectedRequest.data.destination}
                              </div>
                            </div>
                          )}
                          {selectedRequest.data.total_price && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Package Price</div>
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(selectedRequest.data.total_price)}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* CO2 Certificate Details */}
                      {selectedRequest.type === 'co2-certificate' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            {selectedRequest.data.flight_date && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Flight Date</div>
                                <div className="text-sm font-medium text-gray-900">{formatDate(selectedRequest.data.flight_date)}</div>
                              </div>
                            )}
                            {selectedRequest.data.flight_duration && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Flight Duration</div>
                                <div className="text-sm font-medium text-gray-900">{selectedRequest.data.flight_duration}h</div>
                              </div>
                            )}
                            {selectedRequest.data.co2_amount && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">CO2 Amount</div>
                                <div className="text-sm font-medium text-gray-900">{selectedRequest.data.co2_amount} kg</div>
                              </div>
                            )}
                            {selectedRequest.data.offset_price && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Offset Price</div>
                                <div className="text-sm font-medium text-gray-900">{formatCurrency(selectedRequest.data.offset_price)}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Luxury Car Details */}
                      {selectedRequest.type === 'luxury_car_rental' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            {selectedRequest.data.pickup_location && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Pickup Location</div>
                                <div className="text-sm font-medium text-gray-900">{selectedRequest.data.pickup_location}</div>
                              </div>
                            )}
                            {selectedRequest.data.dropoff_location && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Drop-off Location</div>
                                <div className="text-sm font-medium text-gray-900">{selectedRequest.data.dropoff_location}</div>
                              </div>
                            )}
                            {selectedRequest.data.rental_date && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Rental Date</div>
                                <div className="text-sm font-medium text-gray-900">{formatDate(selectedRequest.data.rental_date)}</div>
                              </div>
                            )}
                            {selectedRequest.data.duration && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Duration</div>
                                <div className="text-sm font-medium text-gray-900">{selectedRequest.data.duration}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Helicopter Charter Details */}
                      {selectedRequest.type === 'helicopter_charter' && (
                        <div className="space-y-4">
                          {selectedRequest.data.from && selectedRequest.data.to && (
                            <div>
                              <div className="text-xs text-gray-500 mb-2">Route</div>
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                <MapPin size={16} className="text-gray-500" />
                                {selectedRequest.data.from}
                                <ArrowRight size={16} className="text-gray-400" />
                                <MapPin size={16} className="text-gray-400" />
                                {selectedRequest.data.to}
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            {selectedRequest.data.departure_date && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Departure Date</div>
                                <div className="text-sm font-medium text-gray-900">{formatDate(selectedRequest.data.departure_date)}</div>
                              </div>
                            )}
                            {selectedRequest.data.passengers && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Passengers</div>
                                <div className="text-sm font-medium text-gray-900">{selectedRequest.data.passengers}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* SPV Formation Details */}
                      {selectedRequest.type === 'spv_formation' && (
                        <div className="space-y-6">
                          {/* Tier & Jurisdiction */}
                          <div>
                            <div className="text-sm font-semibold text-gray-900 mb-3">Tier & Jurisdiction</div>
                            <div className="grid grid-cols-2 gap-4">
                              {selectedRequest.data.tier && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Tier</div>
                                  <div className="text-sm font-medium text-gray-900">{selectedRequest.data.tier}</div>
                                </div>
                              )}
                              {selectedRequest.data.jurisdiction && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Jurisdiction</div>
                                  <div className="text-sm font-medium text-gray-900">{selectedRequest.data.jurisdiction.name || selectedRequest.data.jurisdiction}</div>
                                </div>
                              )}
                              {selectedRequest.data.pricing?.total && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Total Cost</div>
                                  <div className="text-sm font-medium text-gray-900 text-lg">{formatCurrency(selectedRequest.data.pricing.total, 'EUR')}</div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Company Information */}
                          {selectedRequest.data.companyInfo && (
                            <div>
                              <div className="text-sm font-semibold text-gray-900 mb-3">Company Information</div>
                              <div className="space-y-3">
                                {selectedRequest.data.companyInfo.companyName && (
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Company Name</div>
                                    <div className="text-sm font-medium text-gray-900">{selectedRequest.data.companyInfo.companyName}</div>
                                  </div>
                                )}
                                {selectedRequest.data.companyInfo.activity && (
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Business Activity</div>
                                    <div className="text-sm text-gray-700">{selectedRequest.data.companyInfo.activity}</div>
                                  </div>
                                )}
                                {selectedRequest.data.companyInfo.description && (
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Description</div>
                                    <div className="text-sm text-gray-700">{selectedRequest.data.companyInfo.description}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Directors & Shareholders */}
                          {selectedRequest.data.directors && selectedRequest.data.directors.length > 0 && (
                            <div>
                              <div className="text-sm font-semibold text-gray-900 mb-3">Directors & Shareholders</div>
                              <div className="space-y-3">
                                {selectedRequest.data.directors.map((director: any, idx: number) => (
                                  <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <div className="text-xs text-gray-500">Full Name</div>
                                        <div className="text-sm font-medium">{director.fullName}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-gray-500">Nationality</div>
                                        <div className="text-sm">{director.nationality}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-gray-500">Role</div>
                                        <div className="text-sm">{director.role || 'Director'}</div>
                                      </div>
                                      {director.sharePercentage && (
                                        <div>
                                          <div className="text-xs text-gray-500">Share %</div>
                                          <div className="text-sm font-medium text-gray-700">{director.sharePercentage}%</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Additional Services */}
                          {selectedRequest.data.additionalServices && Object.keys(selectedRequest.data.additionalServices).length > 0 && (
                            <div>
                              <div className="text-sm font-semibold text-gray-900 mb-3">Additional Services</div>
                              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                                {Object.entries(selectedRequest.data.additionalServices).map(([key, value]) => {
                                  if (value) {
                                    return (
                                      <div key={key} className="flex items-center gap-2">
                                        <Check size={16} className="text-gray-900" />
                                        <span className="text-sm text-gray-700">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })}
                              </div>
                            </div>
                          )}

                          {/* Documents */}
                          {selectedRequest.data.documents && selectedRequest.data.documents.length > 0 && (
                            <div>
                              <div className="text-sm font-semibold text-gray-900 mb-3">Uploaded Documents</div>
                              <div className="space-y-2">
                                {selectedRequest.data.documents.map((doc: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                    <FileText size={16} className="text-gray-400" />
                                    <span>{doc.name || `Document ${idx + 1}`}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tokenization Details */}
                      {selectedRequest.type === 'tokenization' && (
                        <div className="space-y-6">
                          {/* Asset Information */}
                          <div>
                            <div className="text-sm font-semibold text-gray-900 mb-3">Asset Information</div>
                            <div className="grid grid-cols-2 gap-4">
                              {selectedRequest.data.assetInfo?.assetName && (
                                <div className="col-span-2">
                                  <div className="text-xs text-gray-500 mb-1">Asset Name</div>
                                  <div className="text-sm font-medium text-gray-900">{selectedRequest.data.assetInfo.assetName}</div>
                                </div>
                              )}
                              {selectedRequest.data.assetInfo?.category && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Category</div>
                                  <div className="text-sm font-medium text-gray-900">{selectedRequest.data.assetInfo.category}</div>
                                </div>
                              )}
                              {selectedRequest.data.assetInfo?.assetValue && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Asset Value</div>
                                  <div className="text-sm font-medium text-gray-900 text-lg">{formatCurrency(selectedRequest.data.assetInfo.assetValue)}</div>
                                </div>
                              )}
                              {selectedRequest.data.assetInfo?.location && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Location</div>
                                  <div className="text-sm text-gray-700">{selectedRequest.data.assetInfo.location}</div>
                                </div>
                              )}
                            </div>
                            {selectedRequest.data.assetInfo?.description && (
                              <div className="mt-3">
                                <div className="text-xs text-gray-500 mb-1">Description</div>
                                <div className="text-sm text-gray-700">{selectedRequest.data.assetInfo.description}</div>
                              </div>
                            )}
                          </div>

                          {/* Token Configuration */}
                          {selectedRequest.data.tokenConfig && (
                            <div>
                              <div className="text-sm font-semibold text-gray-900 mb-3">Token Configuration</div>
                              <div className="grid grid-cols-2 gap-4">
                                {selectedRequest.data.tokenConfig.tokenStandard && (
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Token Standard</div>
                                    <div className="text-sm font-medium text-gray-900">{selectedRequest.data.tokenConfig.tokenStandard}</div>
                                  </div>
                                )}
                                {selectedRequest.data.tokenConfig.tokenSymbol && (
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Token Symbol</div>
                                    <div className="text-sm font-medium text-gray-700">{selectedRequest.data.tokenConfig.tokenSymbol}</div>
                                  </div>
                                )}
                                {selectedRequest.data.tokenConfig.totalSupply && (
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Total Supply</div>
                                    <div className="text-sm font-medium text-gray-900">{selectedRequest.data.tokenConfig.totalSupply.toLocaleString()}</div>
                                  </div>
                                )}
                                {selectedRequest.data.tokenConfig.pricePerToken && (
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Price per Token</div>
                                    <div className="text-sm font-medium text-gray-900">{formatCurrency(selectedRequest.data.tokenConfig.pricePerToken)}</div>
                                  </div>
                                )}
                                {selectedRequest.data.tokenConfig.expectedAPY && (
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Expected APY</div>
                                    <div className="text-sm font-medium text-gray-900">{selectedRequest.data.tokenConfig.expectedAPY}%</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Token Type */}
                          {selectedRequest.data.tokenType && (
                            <div>
                              <div className="text-sm font-semibold text-gray-900 mb-3">Token Type</div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-sm font-medium text-gray-900">
                                  {selectedRequest.data.tokenType === 'utility' ? 'Utility Token (UTO)' : 'Security Token (STO)'}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Compliance & Jurisdiction */}
                          {selectedRequest.data.compliance && (
                            <div>
                              <div className="text-sm font-semibold text-gray-900 mb-3">Compliance & Jurisdiction</div>
                              <div className="grid grid-cols-2 gap-4">
                                {selectedRequest.data.compliance.jurisdiction && (
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Jurisdiction</div>
                                    <div className="text-sm font-medium text-gray-900">{selectedRequest.data.compliance.jurisdiction}</div>
                                  </div>
                                )}
                                {selectedRequest.data.compliance.hasSPV !== undefined && (
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">SPV Structure</div>
                                    <div className={`text-sm font-medium ${selectedRequest.data.compliance.hasSPV ? 'text-gray-900' : 'text-gray-500'}`}>
                                      {selectedRequest.data.compliance.hasSPV ? 'Yes - SPV Exists' : 'No - Needs SPV'}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Legal Documents */}
                          {selectedRequest.data.legalDocuments && Object.keys(selectedRequest.data.legalDocuments).length > 0 && (
                            <div>
                              <div className="text-sm font-semibold text-gray-900 mb-3">Legal Documents</div>
                              <div className="space-y-2">
                                {Object.entries(selectedRequest.data.legalDocuments).map(([key, value]) => {
                                  if (value) {
                                    return (
                                      <div key={key} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                        <FileText size={16} className="text-gray-900" />
                                        <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <Check size={16} className="text-gray-900 ml-auto" />
                                      </div>
                                    );
                                  }
                                  return null;
                                })}
                              </div>
                            </div>
                          )}

                          {/* Payment Package */}
                          {selectedRequest.data.paymentPackage && (
                            <div>
                              <div className="text-sm font-semibold text-gray-900 mb-3">Selected Package</div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="font-medium text-gray-900">{selectedRequest.data.paymentPackage.name}</div>
                                    <div className="text-xs text-gray-600 mt-1">{selectedRequest.data.paymentPackage.description}</div>
                                  </div>
                                  <div className="text-xl font-bold text-gray-900">
                                    {formatCurrency(selectedRequest.data.paymentPackage.price)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Generic data display for other types or when specific parsing isn't available */}
                      {!['private_jet_charter', 'jets', 'empty_leg', 'nft_discount_empty_leg', 'nft_free_flight', 'adventures', 'co2-certificate', 'luxury_car_rental', 'helicopter_charter', 'spv_formation', 'tokenization'].includes(selectedRequest.type) && (
                        <div>
                          <pre className="text-sm text-gray-600 whitespace-pre-wrap bg-white p-3 rounded border">
                            {JSON.stringify(selectedRequest.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {selectedRequest.admin_notes && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Admin Notes</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRequest.admin_notes}</p>
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