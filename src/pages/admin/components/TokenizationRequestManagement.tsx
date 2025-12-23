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
  Calendar,
  Download,
  Image,
  ExternalLink,
  Shield,
  Wallet,
  TrendingUp,
  Users,
  Globe,
  Percent,
  Lock,
  AlertCircle
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
  // Extended fields from tokenization_drafts
  draft?: TokenizationDraft;
}

interface TokenizationDraft {
  id: string;
  user_id: string;
  token_type: string;
  status: string;
  asset_name: string;
  asset_category: string;
  asset_description: string;
  asset_value: number;
  asset_location: string;
  logo_url: string;
  header_image_url: string;
  token_standard: string;
  total_supply: number;
  token_symbol: string;
  price_per_token: number;
  minimum_investment: number;
  expected_apy: number;
  revenue_distribution: string;
  revenue_currency: string;
  lockup_period: number;
  has_spv: boolean;
  spv_details: string;
  operator: string;
  management_fee: number;
  access_rights: string;
  validity_period: string;
  is_transferable: boolean;
  is_burnable: boolean;
  jurisdiction: string;
  needs_audit: boolean;
  issuer_wallet_address: string;
  membership_package: string;
  package_setup_fee: number;
  package_monthly_fee: number;
  terms_accepted: boolean;
  wallet_signature: string;
  signer_address: string;
  signature_timestamp: string;
  submitted_at: string;
  form_data: any; // Contains uploaded docs info
  created_at: string;
  updated_at: string;
}

export default function TokenizationRequestManagement() {
  const [requests, setRequests] = useState<TokenizationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<TokenizationRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [viewMode, setViewMode] = useState<'requests' | 'drafts'>('drafts');
  const [drafts, setDrafts] = useState<TokenizationDraft[]>([]);

  const tokenizationTypes = [
    'tokenization',           // Main tokenization type from TokenizeAssetFlow
    'tokenization_request',
    'asset_tokenization',
    'rwa_tokenization',
    'ico_participation',
    'dao_license'
  ];

  useEffect(() => {
    if (viewMode === 'drafts') {
      fetchDrafts();
    } else {
      fetchRequests();
    }
  }, [statusFilter, viewMode]);

  // Fetch directly from tokenization_drafts table (primary source)
  const fetchDrafts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('tokenization_drafts')
        .select(`
          *,
          users:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error('Error fetching tokenization drafts:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Fetch draft details by ID (if linked from user_requests)
  const fetchDraftById = async (draftId: string): Promise<TokenizationDraft | null> => {
    try {
      const { data, error } = await supabase
        .from('tokenization_drafts')
        .select('*')
        .eq('id', draftId)
        .single();

      if (error) return null;
      return data;
    } catch {
      return null;
    }
  };

  const [selectedDraft, setSelectedDraft] = useState<TokenizationDraft | null>(null);

  const updateStatus = async (requestId: string, newStatus: string, isDraft = false) => {
    try {
      setIsUpdating(true);
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'completed' || newStatus === 'approved') {
        updateData.completed_at = new Date().toISOString();
      }

      if (adminNotes.trim()) {
        updateData.admin_notes = adminNotes;
      }

      // Update in appropriate table
      const tableName = isDraft ? 'tokenization_drafts' : 'user_requests';
      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      // Refresh data
      if (isDraft) {
        await fetchDrafts();
        setSelectedDraft(null);
      } else {
        await fetchRequests();
        setSelectedRequest(null);
      }
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating status:', error);
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
      name: data.asset_name || data.assetName || data.name || 'Unnamed Asset',
      type: data.token_type || data.assetType || data.asset_type || data.type || request.type.replace(/_/g, ' '),
      value: data.asset_value || data.estimatedValue || data.estimated_value || data.value || 0,
      currency: data.currency || 'USD',
      location: data.asset_location || data.location || data.address || data.city || '-',
      description: data.asset_description || data.description || data.details || '-',
      documents: data.documents || data.files || [],
      // Additional tokenization-specific fields
      tokenSymbol: data.token_symbol || '-',
      totalSupply: data.total_supply || 0,
      pricePerToken: data.price_per_token || 0,
      jurisdiction: data.jurisdiction || '-',
      walletAddress: data.issuer_wallet_address || data.signer_address || '-',
      membershipPackage: data.membership_package || '-'
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

  // Get documents from form_data
  const getDocuments = (draft: TokenizationDraft) => {
    const formData = draft.form_data || {};
    const docs: { name: string; type: string; url: string }[] = [];

    if (formData.prospectus?.url) {
      docs.push({ name: formData.prospectus.name || 'Prospectus', type: 'Prospectus', url: formData.prospectus.url });
    }
    if (formData.legalOpinion?.url) {
      docs.push({ name: formData.legalOpinion.name || 'Legal Opinion', type: 'Legal Opinion', url: formData.legalOpinion.url });
    }
    if (formData.ownershipProof?.url) {
      docs.push({ name: formData.ownershipProof.name || 'Ownership Proof', type: 'Ownership Proof', url: formData.ownershipProof.url });
    }
    if (formData.insurance?.url) {
      docs.push({ name: formData.insurance.name || 'Insurance', type: 'Insurance', url: formData.insurance.url });
    }
    if (formData.logo?.url) {
      docs.push({ name: formData.logo.name || 'Logo', type: 'Logo', url: formData.logo.url });
    }
    if (formData.headerImage?.url) {
      docs.push({ name: formData.headerImage.name || 'Header Image', type: 'Header Image', url: formData.headerImage.url });
    }
    // Additional images
    if (formData.images && Array.isArray(formData.images)) {
      formData.images.forEach((img: any, idx: number) => {
        if (img.url) {
          docs.push({ name: img.name || `Image ${idx + 1}`, type: 'Asset Image', url: img.url });
        }
      });
    }

    return docs;
  };

  // Get user info from draft
  const getDraftUserInfo = (draft: any) => {
    const users = draft.users;
    return {
      name: users?.first_name || users?.last_name
        ? `${users?.first_name || ''} ${users?.last_name || ''}`.trim()
        : 'Unknown',
      email: users?.email || 'No email'
    };
  };

  // Stats based on view mode
  const dataSource = viewMode === 'drafts' ? drafts : requests;
  const stats = {
    total: dataSource.length,
    pending: dataSource.filter((r: any) => r.status === 'pending').length,
    inProgress: dataSource.filter((r: any) => r.status === 'in_progress' || r.status === 'submitted').length,
    completed: dataSource.filter((r: any) => r.status === 'completed' || r.status === 'approved').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tokenization Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage RWA tokenization requests & submitted drafts</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('drafts')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'drafts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Drafts (Full Data)
            </button>
            <button
              onClick={() => setViewMode('requests')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'requests' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              User Requests
            </button>
          </div>
          <button
            onClick={() => viewMode === 'drafts' ? fetchDrafts() : fetchRequests()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={18} className="text-gray-600" />
          </button>
        </div>
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
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="approved">Approved</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Data List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
        </div>
      ) : viewMode === 'drafts' ? (
        /* ========== DRAFTS TABLE (Full Data) ========== */
        drafts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Coins className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No tokenization drafts found</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Docs</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drafts.filter(d => {
                  if (statusFilter === 'all') return true;
                  return d.status === statusFilter;
                }).map((draft) => {
                  const userInfo = getDraftUserInfo(draft);
                  const docs = getDocuments(draft);
                  return (
                    <tr key={draft.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {draft.logo_url && (
                            <img src={draft.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{draft.asset_name || 'Unnamed'}</p>
                            <p className="text-xs text-gray-500">{draft.asset_category || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-900">{userInfo.name}</p>
                          <p className="text-xs text-gray-500">{userInfo.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-mono text-gray-900">${draft.token_symbol || '-'}</p>
                          <p className="text-xs text-gray-500 capitalize">{draft.token_type || '-'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {draft.asset_value > 0 ? formatCurrency(draft.asset_value) : '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <FileText size={14} className={docs.length > 0 ? 'text-green-600' : 'text-gray-300'} />
                          <span className={`text-xs ${docs.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {docs.length}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                          draft.status === 'approved' || draft.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : draft.status === 'submitted'
                            ? 'bg-blue-100 text-blue-700'
                            : draft.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {draft.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">{formatDate(draft.created_at)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedDraft(draft)}
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
        )
      ) : (
        /* ========== USER REQUESTS TABLE ========== */
        filteredRequests.length === 0 ? (
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
        )
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
                          <p className="text-xs text-gray-500">Token Type</p>
                          <p className="text-sm text-gray-900 capitalize">{assetInfo.type === 'utility' ? 'UTO (Utility Token)' : assetInfo.type === 'security' ? 'STO (Security Token)' : assetInfo.type}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <DollarSign size={14} className="text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Asset Value</p>
                          <p className="text-sm text-gray-900">
                            {assetInfo.value > 0 ? formatCurrency(assetInfo.value, assetInfo.currency) : '-'}
                          </p>
                        </div>
                      </div>
                      {assetInfo.tokenSymbol !== '-' && (
                        <div className="flex items-start gap-2">
                          <Coins size={14} className="text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Token Symbol</p>
                            <p className="text-sm text-gray-900 font-mono">${assetInfo.tokenSymbol}</p>
                          </div>
                        </div>
                      )}
                      {assetInfo.totalSupply > 0 && (
                        <div className="flex items-start gap-2">
                          <FileText size={14} className="text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Total Supply</p>
                            <p className="text-sm text-gray-900">{assetInfo.totalSupply.toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                      {assetInfo.location !== '-' && (
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="text-sm text-gray-900">{assetInfo.location}</p>
                          </div>
                        </div>
                      )}
                      {assetInfo.jurisdiction !== '-' && (
                        <div className="flex items-start gap-2">
                          <FileText size={14} className="text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Jurisdiction</p>
                            <p className="text-sm text-gray-900">{assetInfo.jurisdiction}</p>
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
                      {assetInfo.membershipPackage !== '-' && (
                        <div className="flex items-start gap-2">
                          <CheckCircle size={14} className="text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Package</p>
                            <p className="text-sm text-gray-900 capitalize">{assetInfo.membershipPackage}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Wallet Info */}
              {(() => {
                const assetInfo = getAssetInfo(selectedRequest);
                if (assetInfo.walletAddress !== '-') {
                  return (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Wallet Address</h3>
                      <p className="text-xs font-mono text-gray-600 break-all">{assetInfo.walletAddress}</p>
                    </div>
                  );
                }
                return null;
              })()}

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

      {/* Draft Detail Modal - Full Form Data & Documents */}
      {selectedDraft && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {selectedDraft.logo_url && (
                  <img src={selectedDraft.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-200" />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedDraft.asset_name || 'Unnamed Asset'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      selectedDraft.status === 'approved' || selectedDraft.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : selectedDraft.status === 'submitted'
                        ? 'bg-blue-100 text-blue-700'
                        : selectedDraft.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedDraft.status?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(selectedDraft.created_at)}</span>
                    {selectedDraft.token_symbol && (
                      <span className="px-2 py-0.5 text-xs font-mono bg-gray-100 text-gray-700 rounded">
                        ${selectedDraft.token_symbol}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDraft(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Header Image */}
              {selectedDraft.header_image_url && (
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={selectedDraft.header_image_url}
                    alt="Header"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {/* User Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Users size={14} className="text-gray-500" />
                  Requester Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm text-gray-900">{getDraftUserInfo(selectedDraft).name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-900">{getDraftUserInfo(selectedDraft).email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">User ID</p>
                    <p className="text-xs text-gray-600 font-mono">{selectedDraft.user_id}</p>
                  </div>
                  {selectedDraft.membership_package && (
                    <div>
                      <p className="text-xs text-gray-500">Membership Package</p>
                      <p className="text-sm text-gray-900 capitalize">{selectedDraft.membership_package}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Asset Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 size={14} className="text-gray-500" />
                  Asset Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Asset Name</p>
                    <p className="text-sm text-gray-900">{selectedDraft.asset_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm text-gray-900 capitalize">{selectedDraft.asset_category || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Asset Value</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedDraft.asset_value ? formatCurrency(selectedDraft.asset_value) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm text-gray-900">{selectedDraft.asset_location || '-'}</p>
                  </div>
                  {selectedDraft.asset_description && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Description</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{selectedDraft.asset_description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Token Configuration */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Coins size={14} className="text-gray-500" />
                  Token Configuration
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Token Type</p>
                    <p className="text-sm text-gray-900 capitalize">
                      {selectedDraft.token_type === 'utility' ? 'UTO (Utility Token)' :
                       selectedDraft.token_type === 'security' ? 'STO (Security Token)' :
                       selectedDraft.token_type || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Token Symbol</p>
                    <p className="text-sm font-mono text-gray-900">${selectedDraft.token_symbol || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Token Standard</p>
                    <p className="text-sm text-gray-900">{selectedDraft.token_standard || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Supply</p>
                    <p className="text-sm text-gray-900">{selectedDraft.total_supply?.toLocaleString() || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Price per Token</p>
                    <p className="text-sm text-gray-900">
                      {selectedDraft.price_per_token ? formatCurrency(selectedDraft.price_per_token) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Minimum Investment</p>
                    <p className="text-sm text-gray-900">
                      {selectedDraft.minimum_investment ? formatCurrency(selectedDraft.minimum_investment) : '-'}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp size={14} className="text-green-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Expected APY</p>
                      <p className="text-sm font-medium text-green-600">
                        {selectedDraft.expected_apy ? `${selectedDraft.expected_apy}%` : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lock size={14} className="text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Lockup Period</p>
                      <p className="text-sm text-gray-900">
                        {selectedDraft.lockup_period ? `${selectedDraft.lockup_period} months` : '-'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Jurisdiction</p>
                    <p className="text-sm text-gray-900">{selectedDraft.jurisdiction || '-'}</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedDraft.is_transferable ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-xs text-gray-600">Transferable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedDraft.is_burnable ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-xs text-gray-600">Burnable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedDraft.needs_audit ? 'bg-yellow-500' : 'bg-gray-300'}`} />
                    <span className="text-xs text-gray-600">Needs Audit</span>
                  </div>
                </div>
              </div>

              {/* Revenue Distribution */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Percent size={14} className="text-gray-500" />
                  Revenue & Distribution
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Revenue Distribution</p>
                    <p className="text-sm text-gray-900 capitalize">{selectedDraft.revenue_distribution || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Revenue Currency</p>
                    <p className="text-sm text-gray-900">{selectedDraft.revenue_currency || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Management Fee</p>
                    <p className="text-sm text-gray-900">
                      {selectedDraft.management_fee ? `${selectedDraft.management_fee}%` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Validity Period</p>
                    <p className="text-sm text-gray-900">{selectedDraft.validity_period || '-'}</p>
                  </div>
                  {selectedDraft.access_rights && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Access Rights</p>
                      <p className="text-sm text-gray-900">{selectedDraft.access_rights}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SPV Details */}
              {selectedDraft.has_spv && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Shield size={14} className="text-blue-500" />
                    SPV (Special Purpose Vehicle)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">SPV Required</p>
                      <p className="text-sm text-green-600 font-medium">Yes</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Operator</p>
                      <p className="text-sm text-gray-900">{selectedDraft.operator || '-'}</p>
                    </div>
                    {selectedDraft.spv_details && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">SPV Details</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{selectedDraft.spv_details}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Package & Fees */}
              {selectedDraft.membership_package && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign size={14} className="text-gray-500" />
                    Tokenization Package
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Package</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{selectedDraft.membership_package}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Setup Fee</p>
                      <p className="text-sm text-gray-900">
                        {selectedDraft.package_setup_fee ? formatCurrency(selectedDraft.package_setup_fee) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Monthly Fee</p>
                      <p className="text-sm text-gray-900">
                        {selectedDraft.package_monthly_fee ? formatCurrency(selectedDraft.package_monthly_fee) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Wallet Signature Verification */}
              {selectedDraft.wallet_signature && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Wallet size={14} className="text-green-600" />
                    Wallet Verification
                    <CheckCircle size={14} className="text-green-600" />
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Issuer Wallet Address</p>
                      <p className="text-xs font-mono text-gray-700 break-all">{selectedDraft.issuer_wallet_address || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Signer Address</p>
                      <p className="text-xs font-mono text-gray-700 break-all">{selectedDraft.signer_address || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Signature</p>
                      <p className="text-xs font-mono text-gray-600 break-all bg-white p-2 rounded-lg border border-gray-200 mt-1">
                        {selectedDraft.wallet_signature}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Signature Timestamp</p>
                      <p className="text-sm text-gray-700">
                        {selectedDraft.signature_timestamp ? formatDate(selectedDraft.signature_timestamp) : '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${selectedDraft.terms_accepted ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-xs text-gray-600">Terms & Conditions Accepted</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Uploaded Documents */}
              {(() => {
                const docs = getDocuments(selectedDraft);
                if (docs.length === 0) return null;
                return (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <FileText size={14} className="text-gray-500" />
                      Uploaded Documents ({docs.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {docs.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            {doc.type === 'Logo' || doc.type === 'Header Image' || doc.type === 'Asset Image' ? (
                              <Image size={16} className="text-blue-500" />
                            ) : (
                              <FileText size={16} className="text-gray-500" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                              <p className="text-xs text-gray-500">{doc.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Download size={14} className="text-gray-400 group-hover:text-gray-600" />
                            <ExternalLink size={14} className="text-gray-400 group-hover:text-gray-600" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Asset Images Gallery */}
              {(() => {
                const formData = selectedDraft.form_data || {};
                const images: string[] = [];
                if (selectedDraft.logo_url) images.push(selectedDraft.logo_url);
                if (selectedDraft.header_image_url) images.push(selectedDraft.header_image_url);
                if (formData.images && Array.isArray(formData.images)) {
                  formData.images.forEach((img: any) => {
                    if (img.url) images.push(img.url);
                  });
                }
                if (images.length <= 1) return null; // Already showing header
                return (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Image size={14} className="text-gray-500" />
                      Asset Images ({images.length})
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative rounded-lg overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors aspect-video"
                        >
                          <img src={url} alt={`Asset ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                            <ExternalLink size={20} className="text-white opacity-0 hover:opacity-100 drop-shadow-lg" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Raw Form Data (for debugging/completeness) */}
              {selectedDraft.form_data && Object.keys(selectedDraft.form_data).length > 0 && (
                <details className="bg-gray-50 rounded-xl p-4">
                  <summary className="text-sm font-medium text-gray-900 cursor-pointer flex items-center gap-2">
                    <AlertCircle size={14} className="text-gray-500" />
                    Raw Form Data (Debug)
                  </summary>
                  <pre className="mt-3 text-xs text-gray-600 bg-white p-3 rounded-lg overflow-x-auto border border-gray-200">
                    {JSON.stringify(selectedDraft.form_data, null, 2)}
                  </pre>
                </details>
              )}

              {/* Admin Notes */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Admin Notes</h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes for this tokenization request..."
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex gap-2">
                {(selectedDraft.status === 'pending' || selectedDraft.status === 'draft') && (
                  <button
                    onClick={() => updateStatus(selectedDraft.id, 'in_progress', true)}
                    disabled={isUpdating}
                    className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Start Review
                  </button>
                )}
                {selectedDraft.status === 'submitted' && (
                  <button
                    onClick={() => updateStatus(selectedDraft.id, 'in_progress', true)}
                    disabled={isUpdating}
                    className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                  >
                    Begin Processing
                  </button>
                )}
                {selectedDraft.status !== 'completed' && selectedDraft.status !== 'approved' && (
                  <button
                    onClick={() => updateStatus(selectedDraft.id, 'approved', true)}
                    disabled={isUpdating}
                    className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Approve Tokenization
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {selectedDraft.status !== 'cancelled' && selectedDraft.status !== 'completed' && selectedDraft.status !== 'approved' && (
                  <button
                    onClick={() => updateStatus(selectedDraft.id, 'cancelled', true)}
                    disabled={isUpdating}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                )}
                <button
                  onClick={() => setSelectedDraft(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
