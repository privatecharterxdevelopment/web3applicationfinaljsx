import { useState, useEffect } from 'react';
import {
  Coins,
  Search,
  Eye,
  X,
  CheckCircle,
  Clock,
  RefreshCw,
  Building2,
  DollarSign,
  FileText,
  MapPin,
  Calendar
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
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function TokenizationRequestManagement() {
  const [requests, setRequests] = useState<TokenizationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<TokenizationRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const tokenizationTypes = [
    'tokenization_request',
    'asset_tokenization',
    'rwa_tokenization',
    'ico_participation',
    'dao_license'
  ];

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('user_requests')
        .select(`
          *,
          users:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .in('type', tokenizationTypes)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId: string, newStatus: string) => {
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

      await fetchRequests();
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating request:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const getUserName = (request: TokenizationRequest) => {
    if (request.users?.first_name || request.users?.last_name) {
      return `${request.users.first_name || ''} ${request.users.last_name || ''}`.trim();
    }
    return 'Unknown';
  };

  const getUserEmail = (request: TokenizationRequest) => {
    return request.users?.email || request.client_email || 'No email';
  };

  // Extract clean data from request.data object
  const getAssetInfo = (request: TokenizationRequest) => {
    const data = request.data || {};
    return {
      name: data.assetName || data.asset_name || data.name || 'Unnamed Asset',
      type: data.assetType || data.asset_type || data.type || request.type.replace(/_/g, ' '),
      value: data.estimatedValue || data.estimated_value || data.value || 0,
      currency: data.currency || 'EUR',
      location: data.location || data.address || data.city || '-',
      description: data.description || data.details || '-',
      documents: data.documents || data.files || []
    };
  };

  const filteredRequests = requests.filter(request => {
    const assetInfo = getAssetInfo(request);
    const userEmail = getUserEmail(request);
    const userName = getUserName(request);
    const searchLower = searchTerm.toLowerCase();

    return (
      assetInfo.name.toLowerCase().includes(searchLower) ||
      userEmail.toLowerCase().includes(searchLower) ||
      userName.toLowerCase().includes(searchLower)
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
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tokenization Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage RWA tokenization requests</p>
        </div>
        <button
          onClick={fetchRequests}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Coins },
          { label: 'Pending', value: stats.pending, icon: Clock },
          { label: 'In Progress', value: stats.inProgress, icon: FileText },
          { label: 'Completed', value: stats.completed, icon: CheckCircle }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <stat.icon className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by asset name, user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="approved">Approved</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Coins className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No tokenization requests found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.map((request) => {
                const assetInfo = getAssetInfo(request);
                return (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{assetInfo.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{assetInfo.type}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900">{getUserName(request)}</p>
                        <p className="text-xs text-gray-500">{getUserEmail(request)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {assetInfo.value > 0 ? formatCurrency(assetInfo.value, assetInfo.currency) : '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                        request.status === 'completed' || request.status === 'approved'
                          ? 'bg-gray-900 text-white'
                          : request.status === 'in_progress'
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {request.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600">{formatDate(request.created_at)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {getAssetInfo(selectedRequest).name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                    selectedRequest.status === 'completed' || selectedRequest.status === 'approved'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {selectedRequest.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(selectedRequest.created_at)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Requester</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm text-gray-900">{getUserName(selectedRequest)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-900">{getUserEmail(selectedRequest)}</p>
                  </div>
                </div>
              </div>

              {/* Asset Details */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Asset Details</h3>
                {(() => {
                  const assetInfo = getAssetInfo(selectedRequest);
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <Building2 size={14} className="text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Asset Type</p>
                          <p className="text-sm text-gray-900 capitalize">{assetInfo.type}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <DollarSign size={14} className="text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Estimated Value</p>
                          <p className="text-sm text-gray-900">
                            {assetInfo.value > 0 ? formatCurrency(assetInfo.value, assetInfo.currency) : '-'}
                          </p>
                        </div>
                      </div>
                      {assetInfo.location !== '-' && (
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="text-sm text-gray-900">{assetInfo.location}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <Calendar size={14} className="text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Submitted</p>
                          <p className="text-sm text-gray-900">{formatDate(selectedRequest.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Description */}
              {getAssetInfo(selectedRequest).description !== '-' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {getAssetInfo(selectedRequest).description}
                    </p>
                  </div>
                </div>
              )}

              {/* Additional Data - Clean display */}
              {selectedRequest.data && Object.keys(selectedRequest.data).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Additional Information</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(selectedRequest.data)
                        .filter(([key, value]) =>
                          !['assetName', 'asset_name', 'name', 'description', 'details',
                            'estimatedValue', 'estimated_value', 'value', 'currency',
                            'location', 'address', 'city', 'assetType', 'asset_type', 'type',
                            'documents', 'files'].includes(key) &&
                          value !== null && value !== undefined && value !== ''
                        )
                        .map(([key, value]) => (
                          <div key={key}>
                            <p className="text-xs text-gray-500 capitalize">
                              {key.replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm text-gray-900">
                              {typeof value === 'object'
                                ? JSON.stringify(value).slice(0, 50)
                                : String(value)}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Admin Notes</h3>
                <textarea
                  value={adminNotes || selectedRequest.admin_notes || ''}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes..."
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex gap-2">
                {selectedRequest.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'in_progress')}
                    disabled={isUpdating}
                    className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Start Review
                  </button>
                )}
                {selectedRequest.status !== 'completed' && selectedRequest.status !== 'approved' && (
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'approved')}
                    disabled={isUpdating}
                    className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                )}
              </div>
              {selectedRequest.status !== 'cancelled' && selectedRequest.status !== 'completed' && (
                <button
                  onClick={() => updateStatus(selectedRequest.id, 'cancelled')}
                  disabled={isUpdating}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
