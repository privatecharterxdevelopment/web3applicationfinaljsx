import React, { useState, useEffect } from 'react';
import {
  Coins,
  Search,
  Filter,
  Eye,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  RefreshCw,
  MessageSquare,
  ExternalLink,
  DollarSign,
  Building2,
  Globe
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface TokenizationRequest {
  id: string;
  user_id: string;
  type: string;
  status: string;
  data: any;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  admin_notes?: string;
  client_email?: string;
  users?: {
    name: string;
    email: string;
  };
}

export default function TokenizationRequestManagement() {
  const [requests, setRequests] = useState<TokenizationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<TokenizationRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Tokenization-related request types
  const tokenizationTypes = [
    'tokenization_request',
    'asset_tokenization',
    'rwa_tokenization',
    'ico_participation',
    'dao_license'
  ];

  useEffect(() => {
    fetchTokenizationRequests();
  }, [statusFilter, typeFilter]);

  const fetchTokenizationRequests = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('user_requests')
        .select(`
          *,
          users:user_id (
            name,
            email
          )
        `)
        .in('type', tokenizationTypes)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching tokenization requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      setIsUpdating(true);
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      if (adminNotes.trim()) {
        updateData.admin_notes = adminNotes;
      }

      const { error } = await supabase
        .from('user_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      // Send notification email
      try {
        await supabase.functions.invoke('user-request-notifications', {
          body: {
            record: { id: requestId },
            type: 'status_update',
            newStatus
          }
        });
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }

      await fetchTokenizationRequests();
      setShowDetailsModal(false);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Failed to update request status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <AlertCircle className="w-4 h-4" />;
      case 'completed':
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'tokenization_request':
        return 'Asset Tokenization';
      case 'asset_tokenization':
        return 'Asset Tokenization';
      case 'rwa_tokenization':
        return 'RWA Tokenization';
      case 'ico_participation':
        return 'ICO Participation';
      case 'dao_license':
        return 'DAO License';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tokenization_request':
      case 'asset_tokenization':
        return 'bg-purple-100 text-purple-800';
      case 'rwa_tokenization':
        return 'bg-indigo-100 text-indigo-800';
      case 'ico_participation':
        return 'bg-blue-100 text-blue-800';
      case 'dao_license':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const filteredRequests = requests.filter(request => {
    const assetName = request.data?.assetName || request.data?.asset_name || '';
    const userEmail = request.users?.email || request.client_email || '';
    const userName = request.users?.name || '';
    const searchLower = searchTerm.toLowerCase();

    return (
      assetName.toLowerCase().includes(searchLower) ||
      userEmail.toLowerCase().includes(searchLower) ||
      userName.toLowerCase().includes(searchLower) ||
      request.id.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed' || r.status === 'approved').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Coins className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tokenization Requests</h1>
            <p className="text-sm text-gray-500">Manage RWA tokenization and Web3 requests</p>
          </div>
        </div>
        <button
          onClick={fetchTokenizationRequests}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Coins className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by asset name, user email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="tokenization_request">Asset Tokenization</option>
            <option value="rwa_tokenization">RWA Tokenization</option>
            <option value="ico_participation">ICO Participation</option>
            <option value="dao_license">DAO License</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
          <Coins className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tokenization Requests Found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No tokenization requests have been submitted yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset / User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {request.data?.assetName || request.data?.asset_name || request.data?.title || 'Unnamed Asset'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.users?.email || request.client_email || 'Unknown user'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(request.type)}`}>
                      {getTypeLabel(request.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">
                      {request.data?.assetValue || request.data?.asset_value || request.data?.amount
                        ? formatCurrency(request.data?.assetValue || request.data?.asset_value || request.data?.amount)
                        : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(request.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setAdminNotes(request.admin_notes || '');
                        setShowDetailsModal(true);
                      }}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Coins className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedRequest.data?.assetName || selectedRequest.data?.asset_name || 'Tokenization Request'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(selectedRequest.type)}`}>
                      {getTypeLabel(selectedRequest.type)}
                    </span>
                    <span className="text-sm text-gray-500">ID: {selectedRequest.id.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
              <div className="space-y-6">
                {/* User Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">User Information</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Name</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRequest.users?.name || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Email</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRequest.users?.email || selectedRequest.client_email || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Asset Details */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Asset Details</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Asset Name</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRequest.data?.assetName || selectedRequest.data?.asset_name || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Asset Type</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRequest.data?.assetType || selectedRequest.data?.asset_type || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Asset Value</div>
                        <div className="text-lg font-bold text-green-600">
                          {selectedRequest.data?.assetValue || selectedRequest.data?.asset_value
                            ? formatCurrency(selectedRequest.data?.assetValue || selectedRequest.data?.asset_value)
                            : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Token Symbol</div>
                        <div className="text-sm font-medium text-purple-600">
                          {selectedRequest.data?.tokenSymbol || selectedRequest.data?.symbol || 'N/A'}
                        </div>
                      </div>
                    </div>
                    {selectedRequest.data?.description && (
                      <div className="mt-4">
                        <div className="text-xs text-gray-500 mb-1">Description</div>
                        <div className="text-sm text-gray-700">
                          {selectedRequest.data.description}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Blockchain Details */}
                {(selectedRequest.data?.blockchain || selectedRequest.data?.walletAddress) && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Blockchain Details</h3>
                    <div className="bg-purple-50 rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-4">
                        {selectedRequest.data?.blockchain && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Blockchain</div>
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              <Globe className="w-4 h-4 text-purple-500" />
                              {selectedRequest.data.blockchain}
                            </div>
                          </div>
                        )}
                        {selectedRequest.data?.walletAddress && (
                          <div className="col-span-2">
                            <div className="text-xs text-gray-500 mb-1">Wallet Address</div>
                            <div className="text-sm font-mono text-gray-700 break-all">
                              {selectedRequest.data.walletAddress}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Overview */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Status Overview</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Current Status</div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                          {getStatusIcon(selectedRequest.status)}
                          {selectedRequest.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Submitted</div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(selectedRequest.created_at)}
                        </div>
                      </div>
                      {selectedRequest.completed_at && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Completed</div>
                          <div className="text-sm font-medium text-green-600">
                            {formatDate(selectedRequest.completed_at)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Admin Notes
                  </h3>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this request..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer - Actions */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex flex-wrap gap-3 justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
                {selectedRequest.status === 'pending' && (
                  <button
                    onClick={() => updateRequestStatus(selectedRequest.id, 'in_progress')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? 'Updating...' : 'Start Review'}
                  </button>
                )}
                {selectedRequest.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => updateRequestStatus(selectedRequest.id, 'approved')}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => updateRequestStatus(selectedRequest.id, 'completed')}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Mark Completed'}
                    </button>
                  </>
                )}
                {(selectedRequest.status === 'pending' || selectedRequest.status === 'in_progress') && (
                  <button
                    onClick={() => updateRequestStatus(selectedRequest.id, 'cancelled')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? 'Updating...' : 'Reject'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
