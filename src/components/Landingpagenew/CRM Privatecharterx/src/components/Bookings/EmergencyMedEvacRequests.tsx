import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Bell, 
  User, 
  Calendar, 
  Users, 
  MapPin, 
  Clock, 
  CheckCircle, 
  X, 
  AlertTriangle,
  Eye,
  MessageSquare,
  Send
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

// Custom components for medical icons
const Ambulance = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M6 19v2"></path>
    <path d="M10 19h8"></path>
    <path d="M18 19v2"></path>
    <rect width="18" height="12" x="3" y="5" rx="2"></rect>
    <path d="M6 9h12"></path>
    <path d="M6 12h12"></path>
    <path d="M8 2v3"></path>
    <path d="M16 2v3"></path>
    <path d="M12 12v-3"></path>
    <path d="M10.5 12h3"></path>
  </svg>
);

const Stethoscope = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"></path>
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"></path>
    <circle cx="20" cy="10" r="2"></circle>
  </svg>
);

const Clipboard = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="14" height="18" x="5" y="3" rx="2"></rect>
    <path d="M9 3v4"></path>
    <path d="M15 3v4"></path>
    <path d="M9 13h6"></path>
    <path d="M9 17h6"></path>
  </svg>
);

interface EmptyLegRequest {
  id: string;
  user_id: string;
  username: string;
  email: string;
  patient_name: string;
  patient_age: number;
  patient_condition: string;
  departure: string;
  arrival: string;
  departure_date: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  priority: 'normal' | 'urgent' | 'critical';
  notes: string | null;
  medical_notes: string | null;
  created_at: string;
  updated_at: string;
  admin_notes: string | null;
  admin_id: string | null;
}

interface EmergencyMedEvacRequestsProps {
  onStatusChange?: () => void;
}

export const EmergencyMedEvacRequests: React.FC<EmergencyMedEvacRequestsProps> = ({ onStatusChange }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [requests, setRequests] = useState<EmptyLegRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<EmptyLegRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'normal' | 'urgent' | 'critical'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EmptyLegRequest | null>(null);
  const [replyText, setReplyText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchRequests();
    
    // Set up real-time subscription for new requests
    const subscription = supabase
      .channel('medevac-requests')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'user_requests',
        filter: 'type=eq.medevac'
      }, payload => {
        fetchRequests();
        showNotification();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter, priorityFilter]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      
      // For demo purposes, we'll use the user_requests table with type 'medevac'
      const { data, error } = await supabase
        .from('user_requests')
        .select(`
          *,
          creator:system_users!user_id (name, email)
        `)
        .eq('type', 'medevac')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = data?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        username: item.creator?.name || 'Unknown',
        email: item.creator?.email || 'unknown@example.com',
        patient_name: item.data?.patient_name || 'Unknown',
        patient_age: item.data?.patient_age || 0,
        patient_condition: item.data?.patient_condition || 'Unknown',
        departure: item.data?.departure || 'Unknown',
        arrival: item.data?.arrival || 'Unknown',
        departure_date: item.data?.departure_date || new Date().toISOString(),
        status: item.status,
        priority: item.data?.priority || 'normal',
        notes: item.data?.notes || null,
        medical_notes: item.data?.medical_notes || null,
        created_at: item.created_at,
        updated_at: item.updated_at,
        admin_notes: item.admin_notes,
        admin_id: item.admin_id
      })) || [];
      
      setRequests(transformedData);
      
      // Count unread (pending) requests
      const pendingCount = transformedData.filter(req => req.status === 'pending').length;
      setUnreadCount(pendingCount);
      
      // Notify parent component if status has changed
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (err: any) {
      console.error('Error fetching medevac requests:', err);
      showError('Error', 'Failed to fetch emergency medevac requests');
    } finally {
      setIsLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.departure.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.arrival.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.patient_condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(request => request.priority === priorityFilter);
    }

    setFilteredRequests(filtered);
  };

  const updateRequestStatus = async (requestId: string, newStatus: 'pending' | 'processing' | 'completed' | 'cancelled') => {
    if (!user?.id) return;

    try {
      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!systemUser) {
        throw new Error('User not found in system');
      }

      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      // Only set admin_id if it's not already set
      if (!selectedRequest?.admin_id) {
        updateData.admin_id = systemUser.id;
      }

      const { error } = await supabase
        .from('user_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      showSuccess('Success', `Request status updated to ${newStatus}`);
      
      // Update local state
      if (selectedRequest) {
        setSelectedRequest({
          ...selectedRequest,
          status: newStatus,
          ...(newStatus === 'completed' ? { 
            completed_at: new Date().toISOString()
          } : {}),
          ...(!selectedRequest.admin_id ? {
            admin_id: systemUser.id
          } : {})
        });
      }
      
      fetchRequests();
    } catch (err: any) {
      console.error('Error updating request status:', err);
      showError('Error', 'Failed to update request status');
    }
  };

  const sendReply = async () => {
    if (!selectedRequest || !replyText.trim()) return;

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

      // Update the admin notes
      const { error } = await supabase
        .from('user_requests')
        .update({
          admin_notes: (selectedRequest.admin_notes ? selectedRequest.admin_notes + '\n\n' : '') + 
                       `Reply (${new Date().toLocaleString()}):\n${replyText}`,
          status: 'processing',
          updated_at: new Date().toISOString(),
          admin_id: selectedRequest.admin_id || systemUser.id
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      showSuccess('Success', 'Reply sent successfully');
      setReplyText('');
      
      // Update local state
      setSelectedRequest({
        ...selectedRequest,
        admin_notes: (selectedRequest.admin_notes ? selectedRequest.admin_notes + '\n\n' : '') + 
                    `Reply (${new Date().toLocaleString()}):\n${replyText}`,
        status: 'processing',
        updated_at: new Date().toISOString(),
        admin_id: selectedRequest.admin_id || systemUser.id
      });
      
      fetchRequests();
    } catch (err: any) {
      console.error('Error sending reply:', err);
      showError('Error', 'Failed to send reply');
    }
  };

  const showNotification = () => {
    // Show browser notification if supported
    if (Notification && Notification.permission === 'granted') {
      new Notification('New Emergency MedEvac Request', {
        body: 'A new emergency medical evacuation request has been received',
        icon: '/vite.svg'
      });
    }
    
    // Show in-app notification
    showSuccess('Emergency Request', 'A new medical evacuation request has been received', 10000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <X className="w-4 h-4 text-red-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'normal': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading emergency requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-black">EmptyLeg Requests</h2>
            {unreadCount > 0 && (
              <span className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                <Bell className="w-3 h-3" />
                <span>{unreadCount} new</span>
              </span>
            )}
          </div>
          <button 
            onClick={fetchRequests}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Refresh
          </button>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by patient, condition, departure, or arrival..."
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
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-black">{requests.length}</p>
            <p className="text-sm text-gray-500">Total Requests</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-black">{requests.filter(r => r.status === 'pending').length}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-black">{requests.filter(r => r.status === 'processing').length}</p>
            <p className="text-sm text-gray-500">Processing</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-black">{requests.filter(r => r.status === 'completed').length}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <div 
            key={request.id} 
            className={`bg-white rounded-lg border ${
              request.status === 'pending' ? 'border-yellow-300 shadow-md' : 'border-gray-200'
            } shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black">{request.username}</h3>
                    <p className="text-sm text-gray-500">{request.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                  <button 
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowDetailsModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-black transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{request.departure} → {request.arrival}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-sm">{new Date(request.departure_date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <p className="text-sm">{request.patient_name}, {request.patient_age} years</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <p className="text-sm">{new Date(request.created_at).toLocaleString()}</p>
                </div>
              </div>

              {request.notes && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 line-clamp-2">{request.notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateRequestStatus(request.id, 'processing')}
                  disabled={request.status === 'processing' || request.status === 'completed' || request.status === 'cancelled'}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                >
                  Process
                </button>
                <button
                  onClick={() => updateRequestStatus(request.id, 'completed')}
                  disabled={request.status === 'completed' || request.status === 'cancelled'}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                >
                  Complete
                </button>
                <button
                  onClick={() => updateRequestStatus(request.id, 'cancelled')}
                  disabled={request.status === 'cancelled'}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowDetailsModal(true);
                  }}
                  className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Ambulance className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No emergency requests found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search criteria'
                : 'No emergency medical evacuation requests have been submitted yet'
              }
            </p>
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">EmptyLeg Request Details</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedRequest(null);
                  setReplyText('');
                }}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-black mb-3">Request Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedRequest.status)}
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedRequest.status)}`}>
                          {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Route</p>
                      <p className="font-medium text-black">{selectedRequest.departure} → {selectedRequest.arrival}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium text-black">{new Date(selectedRequest.departure_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Priority</p>
                      <div className="flex items-center space-x-2">
                        {getPriorityIcon(selectedRequest.priority)}
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(selectedRequest.priority)}`}>
                          {selectedRequest.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium text-black">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-black mb-3">Patient Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-black">{selectedRequest.patient_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="font-medium text-black">{selectedRequest.patient_age} years</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Condition</p>
                      <p className="font-medium text-black">{selectedRequest.patient_condition}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Requester</p>
                      <p className="font-medium text-black">{selectedRequest.username}</p>
                      <p className="text-xs text-gray-500">{selectedRequest.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedRequest.notes && (
                <div>
                  <h3 className="font-medium text-black mb-3">Request Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-700 whitespace-pre-line">{selectedRequest.notes}</p>
                  </div>
                </div>
              )}

              {selectedRequest.medical_notes && (
                <div>
                  <h3 className="font-medium text-black mb-3">Medical Notes</h3>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-gray-700 whitespace-pre-line">{selectedRequest.medical_notes}</p>
                  </div>
                </div>
              )}

              {selectedRequest.admin_notes && (
                <div>
                  <h3 className="font-medium text-black mb-3">Admin Notes & Replies</h3>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-gray-700 whitespace-pre-line">{selectedRequest.admin_notes}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-medium text-black mb-3">Reply to User</h3>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Type your reply here..."
                />
                
                <div className="flex flex-wrap gap-3 mt-3">
                  <button
                    onClick={() => sendReply()}
                    disabled={!replyText.trim()}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Reply</span>
                  </button>
                  
                  <button
                    onClick={() => updateRequestStatus(selectedRequest.id, 'processing')}
                    disabled={selectedRequest.status === 'processing' || selectedRequest.status === 'completed' || selectedRequest.status === 'cancelled'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Mark Processing
                  </button>
                  
                  <button
                    onClick={() => updateRequestStatus(selectedRequest.id, 'completed')}
                    disabled={selectedRequest.status === 'completed' || selectedRequest.status === 'cancelled'}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Mark Completed
                  </button>
                  
                  <button
                    onClick={() => updateRequestStatus(selectedRequest.id, 'cancelled')}
                    disabled={selectedRequest.status === 'cancelled'}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Cancel Request
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-medium text-black mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-4">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                    <Ambulance className="w-4 h-4" />
                    <span>Dispatch Aircraft</span>
                  </button>
                  
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                    <Stethoscope className="w-4 h-4" />
                    <span>Contact Medical Team</span>
                  </button>
                  
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
                    <Clipboard className="w-4 h-4" />
                    <span>Generate Medical Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};