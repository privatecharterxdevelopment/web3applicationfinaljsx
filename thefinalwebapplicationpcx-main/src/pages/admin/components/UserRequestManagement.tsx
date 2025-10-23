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
  AlertCircle,
  Search,
  Filter,
  Eye,
  MapPin,
  Plane,
  ArrowRight
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
}

const REQUEST_TYPES = [
  { value: 'flight_quote', label: 'Flight Quote', color: 'blue' },
  { value: 'support', label: 'Support', color: 'green' },
  { value: 'document', label: 'Document', color: 'purple' },
  { value: 'visa', label: 'Visa', color: 'orange' },
  { value: 'payment', label: 'Payment', color: 'red' },
  { value: 'booking', label: 'Booking', color: 'indigo' },
  { value: 'cancellation', label: 'Cancellation', color: 'red' },
  { value: 'modification', label: 'Modification', color: 'yellow' },
  { value: 'private_jet_charter', label: 'Private Jet Charter', color: 'blue' },
  { value: 'fixed_offer', label: 'Fixed Offer', color: 'cyan' },
  { value: 'helicopter_charter', label: 'Helicopter Charter', color: 'teal' },
  { value: 'empty_leg', label: 'Empty Leg', color: 'pink' },
  { value: 'luxury_car_rental', label: 'Luxury Car Rental', color: 'gray' },
  { value: 'nft_discount_empty_leg', label: 'NFT Discount Empty Leg', color: 'violet' },
  { value: 'nft_free_flight', label: 'NFT Free Flight', color: 'emerald' }
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
        .select('*')
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
      
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
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

      fetchRequests();
    } catch (err) {
      console.error('Error updating user request status:', err);
      setError('Failed to update user request status');
    }
  };

  const handleSaveNotes = async () => {
    if (!editingRequest || !hasPermission('user_requests', 'write')) return;

    try {
      const { error } = await supabase
        .from('user_requests')
        .update({
          admin_notes: adminNotes,
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
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string): string => {
    const typeConfig = REQUEST_TYPES.find(t => t.value === type);
    const color = typeConfig?.color || 'gray';
    
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      orange: 'bg-orange-100 text-orange-800',
      red: 'bg-red-100 text-red-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      cyan: 'bg-cyan-100 text-cyan-800',
      teal: 'bg-teal-100 text-teal-800',
      pink: 'bg-pink-100 text-pink-800',
      gray: 'bg-gray-100 text-gray-800',
      violet: 'bg-violet-100 text-violet-800',
      emerald: 'bg-emerald-100 text-emerald-800'
    };
    
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
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
          <h2 className="text-2xl font-bold">User Requests</h2>
          <p className="text-gray-600">Manage general user service requests and inquiries</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Types</option>
              {REQUEST_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
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
            {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map((tab) => (
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
                  Request
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
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
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText size={20} className="text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {request.id.substring(0, 8)}...
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(request.type)}`}>
                          {getTypeLabel(request.type)}
                        </span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {request.client_name ? (
                        <div>
                          <div className="font-medium text-gray-900 flex items-center">
                            <User size={16} className="text-gray-400 mr-1" />
                            {request.client_name}
                          </div>
                          {request.client_email && (
                            <div className="text-gray-500 flex items-center mt-1">
                              <Mail size={14} className="text-gray-400 mr-1" />
                              {request.client_email}
                            </div>
                          )}
                          {request.client_phone && (
                            <div className="text-gray-500 flex items-center">
                              <Phone size={14} className="text-gray-400 mr-1" />
                              {request.client_phone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm">
                          User ID: {request.user_id.substring(0, 8)}...
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      {request.aircraft_model && (
                        <div className="font-medium mb-1">
                          {request.aircraft_model} ({request.aircraft_type})
                        </div>
                      )}
                      {request.capacity && (
                        <div className="text-gray-500">
                          Capacity: {request.capacity}
                        </div>
                      )}
                      {request.range && (
                        <div className="text-gray-500">
                          Range: {request.range}
                        </div>
                      )}
                      {request.data && Object.keys(request.data).length > 0 && (
                        <div className="text-gray-500 text-xs mt-2 truncate">
                          {JSON.stringify(request.data).length > 100
                            ? `${JSON.stringify(request.data).substring(0, 100)}...`
                            : JSON.stringify(request.data)
                          }
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400 mr-1" />
                      <div>
                        <div>{formatDate(request.created_at)}</div>
                        {request.completed_at && (
                          <div className="text-xs text-green-600">
                            Completed: {formatDate(request.completed_at)}
                          </div>
                        )}
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
                        className="text-purple-600 hover:text-purple-900"
                        title="View details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingRequest(request);
                          setAdminNotes(request.admin_notes || '');
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Add notes"
                      >
                        <MessageSquare size={18} />
                      </button>
                      
                      {request.status === 'pending' && hasPermission('user_requests', 'write') && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'in_progress')}
                          className="text-orange-600 hover:text-orange-900"
                          title="Start processing"
                        >
                          <Clock size={18} />
                        </button>
                      )}
                      
                      {request.status === 'in_progress' && canCompleteUserRequests && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'completed')}
                          className="text-green-600 hover:text-green-900"
                          title="Mark completed"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      
                      {['pending', 'in_progress'].includes(request.status) && hasPermission('user_requests', 'write') && (
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
              No user requests found
            </div>
          )}
        </div>
      </div>

      {/* Notes Modal */}
      {editingRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Add Admin Notes</h3>
              <button
                onClick={() => setEditingRequest(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Request Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Request ID</div>
                    <div className="font-medium">{editingRequest.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Type</div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(editingRequest.type)}`}>
                      {getTypeLabel(editingRequest.type)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Status</div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(editingRequest.status)}`}>
                      {editingRequest.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Created</div>
                    <div className="font-medium">{formatDate(editingRequest.created_at)}</div>
                  </div>
                </div>
                
                {editingRequest.client_name && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500 mb-2">Client Information</div>
                    <div className="space-y-1">
                      <div className="font-medium">{editingRequest.client_name}</div>
                      {editingRequest.client_email && (
                        <div className="text-gray-600">{editingRequest.client_email}</div>
                      )}
                      {editingRequest.client_phone && (
                        <div className="text-gray-600">{editingRequest.client_phone}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Request Data */}
              {editingRequest.data && Object.keys(editingRequest.data).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Request Data
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(editingRequest.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                  placeholder="Add notes about this request..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditingRequest(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNotes}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${getTypeColor(selectedRequest.type).replace('text-', 'bg-').replace('-800', '-100')}`}>
                  <FileText size={24} className={getTypeColor(selectedRequest.type)} />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {getTypeLabel(selectedRequest.type)} Request
                  </h2>
                  <p className="text-sm text-gray-600">ID: {selectedRequest.id.slice(0, 8)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={closeRequestDetails}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                {/* Request Overview */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Request Overview</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Status</div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedRequest.status)}`}>
                          {selectedRequest.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Type</div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(selectedRequest.type)}`}>
                          {getTypeLabel(selectedRequest.type)}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Submitted</div>
                        <div className="text-sm font-medium text-gray-900">{formatDate(selectedRequest.created_at)}</div>
                      </div>
                    </div>
                    {selectedRequest.completed_at && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Completed</div>
                        <div className="text-sm font-medium text-green-600">{formatDate(selectedRequest.completed_at)}</div>
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
                                <MapPin size={16} className="text-blue-500" />
                                {selectedRequest.data.from}
                                <ArrowRight size={16} className="text-gray-400" />
                                <MapPin size={16} className="text-green-500" />
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
                                <MapPin size={16} className="text-blue-500" />
                                {selectedRequest.data.departure_iata}
                                <ArrowRight size={16} className="text-gray-400" />
                                <MapPin size={16} className="text-green-500" />
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
                                <MapPin size={16} className="text-blue-500" />
                                {selectedRequest.data.origin}
                                <ArrowRight size={16} className="text-gray-400" />
                                <MapPin size={16} className="text-green-500" />
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
                                <MapPin size={16} className="text-blue-500" />
                                {selectedRequest.data.from}
                                <ArrowRight size={16} className="text-gray-400" />
                                <MapPin size={16} className="text-green-500" />
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

                      {/* Generic data display for other types or when specific parsing isn't available */}
                      {!['private_jet_charter', 'jets', 'empty_leg', 'nft_discount_empty_leg', 'nft_free_flight', 'adventures', 'co2-certificate', 'luxury_car_rental', 'helicopter_charter'].includes(selectedRequest.type) && (
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
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
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