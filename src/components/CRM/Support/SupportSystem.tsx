import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, 
  Search, 
  Filter, 
  Plus, 
  User, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Send,
  MessageSquare,
  FileText,
  Mail,
  Phone,
  UserCheck
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/CRM/AuthContext';
import { useNotification } from '../../../contexts/CRM/NotificationContext';

interface SupportRequest {
  id: string;
  user_id: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  data: {
    client_id?: string;
    client_name?: string;
    message: string;
    subject?: string;
    priority?: string;
  };
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  admin_notes: string | null;
  admin_id: string | null;
  creator?: {
    name: string;
    email: string;
  };
  client?: {
    name: string;
    email: string;
  };
  assigned_to?: string;
  assigned_user?: {
    name: string;
    email: string;
  };
}

interface Client {
  id: string;
  name: string;
  email: string;
}

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const SupportSystem: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<SupportRequest[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [replyText, setReplyText] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');

  const [newRequestData, setNewRequestData] = useState({
    client_id: '',
    subject: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  useEffect(() => {
    fetchSupportRequests();
    fetchClients();
    fetchSystemUsers();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [supportRequests, searchTerm, statusFilter, priorityFilter]);

  const fetchSupportRequests = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_requests')
        .select(`
          *,
          creator:system_users!user_id (name, email)
        `)
        .eq('type', 'support')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extract client IDs from the data field
      const clientIds = data
        ?.map(request => request.data?.client_id)
        .filter(Boolean) || [];

      // If we have client IDs, fetch their names
      let clientData: Record<string, { name: string, email: string }> = {};
      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, name, email')
          .in('id', clientIds);

        if (clients) {
          clientData = clients.reduce((acc, client) => {
            acc[client.id] = { name: client.name, email: client.email };
            return acc;
          }, {} as Record<string, { name: string, email: string }>);
        }
      }

      // Get assigned users
      const adminIds = data
        ?.map(request => request.admin_id)
        .filter(Boolean) || [];

      let assignedUserData: Record<string, { name: string, email: string }> = {};
      if (adminIds.length > 0) {
        const { data: admins } = await supabase
          .from('system_users')
          .select('id, name, email')
          .in('id', adminIds);

        if (admins) {
          assignedUserData = admins.reduce((acc, admin) => {
            acc[admin.id] = { name: admin.name, email: admin.email };
            return acc;
          }, {} as Record<string, { name: string, email: string }>);
        }
      }

      // Add client and assigned user information to each request
      const requestsWithData = data?.map(request => {
        const clientId = request.data?.client_id;
        const client = clientId ? clientData[clientId] : undefined;
        const assignedUser = request.admin_id ? assignedUserData[request.admin_id] : undefined;
        
        return {
          ...request,
          client,
          assigned_to: request.admin_id,
          assigned_user: assignedUser
        };
      }) || [];

      setSupportRequests(requestsWithData);
    } catch (err: any) {
      console.error('Error fetching support requests:', err);
      showError('Error', 'Failed to fetch support requests');
    } finally {
      setIsLoading(false);
    }
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

  const fetchSystemUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('system_users')
        .select('id, name, email, role')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSystemUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching system users:', err);
    }
  };

  const filterRequests = () => {
    let filtered = supportRequests;

    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.data?.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.data?.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.client?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.creator?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(request => request.data?.priority === priorityFilter);
    }

    setFilteredRequests(filtered);
  };

  const createSupportRequest = async () => {
    if (!user?.id) {
      showError('Error', 'You must be logged in to create a support request');
      return;
    }

    if (!newRequestData.client_id || !newRequestData.subject || !newRequestData.message) {
      showError('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);

      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!systemUser) {
        throw new Error('User not found in system');
      }

      const { error } = await supabase
        .from('user_requests')
        .insert([{
          user_id: systemUser.id,
          type: 'support',
          status: 'pending',
          data: {
            client_id: newRequestData.client_id,
            subject: newRequestData.subject,
            message: newRequestData.message,
            priority: newRequestData.priority,
            client_name: clients.find(c => c.id === newRequestData.client_id)?.name
          }
        }]);

      if (error) throw error;

      showSuccess('Success', 'Support request created successfully');
      setShowAddModal(false);
      setNewRequestData({
        client_id: '',
        subject: '',
        message: '',
        priority: 'medium'
      });
      fetchSupportRequests();
    } catch (err: any) {
      console.error('Error creating support request:', err);
      showError('Error', 'Failed to create support request');
    } finally {
      setIsLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
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
            admin_id: systemUser.id,
            assigned_to: systemUser.id,
            assigned_user: {
              name: user.name || '',
              email: user.email
            }
          } : {})
        });
      }
      
      fetchSupportRequests();
    } catch (err: any) {
      console.error('Error updating request status:', err);
      showError('Error', 'Failed to update request status');
    }
  };

  const assignSupportRequest = async () => {
    if (!selectedRequest || !selectedAssignee) {
      showError('Error', 'Please select a user to assign this request to');
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('user_requests')
        .update({
          admin_id: selectedAssignee,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Get the assigned user details
      const assignedUser = systemUsers.find(u => u.id === selectedAssignee);

      showSuccess('Success', `Request assigned to ${assignedUser?.name || 'user'}`);
      setShowAssignModal(false);
      
      // Update local state
      if (selectedRequest) {
        setSelectedRequest({
          ...selectedRequest,
          admin_id: selectedAssignee,
          assigned_to: selectedAssignee,
          assigned_user: assignedUser ? {
            name: assignedUser.name,
            email: assignedUser.email
          } : undefined,
          status: 'in_progress'
        });
      }
      
      fetchSupportRequests();
    } catch (err: any) {
      console.error('Error assigning support request:', err);
      showError('Error', 'Failed to assign support request');
    } finally {
      setIsLoading(false);
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
          status: 'in_progress',
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
        status: 'in_progress',
        updated_at: new Date().toISOString(),
        admin_id: selectedRequest.admin_id || systemUser.id,
        assigned_to: selectedRequest.admin_id || systemUser.id,
        assigned_user: selectedRequest.assigned_user || {
          name: user?.name || '',
          email: user?.email || ''
        }
      });
      
      fetchSupportRequests();
    } catch (err: any) {
      console.error('Error sending reply:', err);
      showError('Error', 'Failed to send reply');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <X className="w-4 h-4 text-red-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string | undefined) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading support requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Support Management</h1>
            <p className="text-gray-600">Manage client support requests and inquiries</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Support Request</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by subject, message, client, or creator..."
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
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{supportRequests.length}</p>
          <p className="text-sm text-gray-500">Total Requests</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{supportRequests.filter(r => r.status === 'pending').length}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{supportRequests.filter(r => r.status === 'in_progress').length}</p>
          <p className="text-sm text-gray-500">In Progress</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{supportRequests.filter(r => r.status === 'completed').length}</p>
          <p className="text-sm text-gray-500">Completed</p>
        </div>
      </div>

      {/* Support Requests */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Client</th>
                <th className="text-left p-4 font-medium text-gray-700">Subject</th>
                <th className="text-left p-4 font-medium text-gray-700">Priority</th>
                <th className="text-left p-4 font-medium text-gray-700">Status</th>
                <th className="text-left p-4 font-medium text-gray-700">Assigned To</th>
                <th className="text-left p-4 font-medium text-gray-700">Created By</th>
                <th className="text-left p-4 font-medium text-gray-700">Created At</th>
                <th className="text-left p-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-black">
                          {request.client?.name || request.data?.client_name || 'Unknown Client'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {request.client?.email || 'No email'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-black">{request.data?.subject || 'No subject'}</p>
                    <p className="text-xs text-gray-500 truncate max-w-xs">{request.data?.message}</p>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(request.data?.priority)}`}>
                      {request.data?.priority?.toUpperCase() || 'MEDIUM'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(request.status)}
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    {request.assigned_user ? (
                      <p className="text-sm">{request.assigned_user.name}</p>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowAssignModal(true);
                        }}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        Assign
                      </button>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="text-sm">{request.creator?.name || 'Unknown'}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">{new Date(request.created_at).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">{new Date(request.created_at).toLocaleTimeString()}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredRequests.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <LifeBuoy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No support requests found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'No support requests have been created yet'
            }
          </p>
        </div>
      )}

      {/* Add Support Request Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">New Support Request</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client *
                </label>
                <select
                  value={newRequestData.client_id}
                  onChange={(e) => setNewRequestData({ ...newRequestData, client_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={newRequestData.subject}
                  onChange={(e) => setNewRequestData({ ...newRequestData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={newRequestData.message}
                  onChange={(e) => setNewRequestData({ ...newRequestData, message: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Detailed description of the support request"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={newRequestData.priority}
                  onChange={(e) => setNewRequestData({ ...newRequestData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createSupportRequest}
                disabled={!newRequestData.client_id || !newRequestData.subject || !newRequestData.message || isLoading}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Support Request Modal */}
      {showAssignModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Assign Support Request</h2>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedAssignee('');
                }}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-black mb-2">Request Details</h3>
                <p className="text-sm text-gray-700"><span className="font-medium">Subject:</span> {selectedRequest.data?.subject}</p>
                <p className="text-sm text-gray-700"><span className="font-medium">Client:</span> {selectedRequest.client?.name || selectedRequest.data?.client_name}</p>
                <p className="text-sm text-gray-700"><span className="font-medium">Priority:</span> {selectedRequest.data?.priority?.toUpperCase() || 'MEDIUM'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To *
                </label>
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                >
                  <option value="">Select a user</option>
                  {systemUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedAssignee('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={assignSupportRequest}
                disabled={!selectedAssignee || isLoading}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>{isLoading ? 'Assigning...' : 'Assign Request'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Support Request Details</h2>
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
                      <p className="text-sm text-gray-500">Subject</p>
                      <p className="font-medium text-black">{selectedRequest.data?.subject || 'No subject'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedRequest.status)}
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedRequest.status)}`}>
                          {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1).replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Priority</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(selectedRequest.data?.priority)}`}>
                        {selectedRequest.data?.priority?.toUpperCase() || 'MEDIUM'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium text-black">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                    </div>
                    {selectedRequest.completed_at && (
                      <div>
                        <p className="text-sm text-gray-500">Completed</p>
                        <p className="font-medium text-black">{new Date(selectedRequest.completed_at).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-black mb-3">Client Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500">Client Name</p>
                      <p className="font-medium text-black">
                        {selectedRequest.client?.name || selectedRequest.data?.client_name || 'Unknown Client'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-black">
                        {selectedRequest.client?.email || 'No email'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created By</p>
                      <p className="font-medium text-black">{selectedRequest.creator?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{selectedRequest.creator?.email || 'No email'}</p>
                    </div>
                    {selectedRequest.assigned_user && (
                      <div>
                        <p className="text-sm text-gray-500">Assigned To</p>
                        <p className="font-medium text-black">{selectedRequest.assigned_user.name}</p>
                        <p className="text-xs text-gray-500">{selectedRequest.assigned_user.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-black mb-3">Message</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-line">{selectedRequest.data?.message}</p>
                </div>
              </div>

              {selectedRequest.admin_notes && (
                <div>
                  <h3 className="font-medium text-black mb-3">Admin Notes & Replies</h3>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-gray-700 whitespace-pre-line">{selectedRequest.admin_notes}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-medium text-black mb-3">Reply to Client</h3>
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
                    <Send className="w-4 h-4" />
                    <span>Send Reply</span>
                  </button>
                  
                  {!selectedRequest.assigned_user && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        setShowAssignModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Assign to User
                    </button>
                  )}
                  
                  <button
                    onClick={() => updateRequestStatus(selectedRequest.id, 'in_progress')}
                    disabled={selectedRequest.status === 'in_progress' || selectedRequest.status === 'completed'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Mark In Progress
                  </button>
                  
                  <button
                    onClick={() => updateRequestStatus(selectedRequest.id, 'completed')}
                    disabled={selectedRequest.status === 'completed'}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Mark Completed
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-medium text-black mb-3">Contact Options</h3>
                <div className="flex flex-wrap gap-4">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Send Email</span>
                  </button>
                  
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>Call Client</span>
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