import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  X,
  User,
  MapPin,
  DollarSign,
  Users
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface SPVRequest {
  id: string;
  type: string;
  status: string;
  data: any;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  admin_notes?: string;
}

export default function MySPVs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<SPVRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SPVRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchSPVRequests();
  }, [user, navigate]);

  const fetchSPVRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'spv_formation')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching SPV requests:', error);
    } finally {
      setLoading(false);
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'in_progress':
        return <AlertCircle className="w-5 h-5" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const openDetails = (request: SPVRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const closeDetails = () => {
    setSelectedRequest(null);
    setShowDetailsModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My SPV Formations</h1>
              <p className="text-gray-600">Track and manage your SPV formation requests</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {requests.filter(r => r.status === 'in_progress').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {requests.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No SPV Formations Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't submitted any SPV formation requests yet.
            </p>
            <button
              onClick={() => navigate('/spv-formation')}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Start SPV Formation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(request.status).replace('text-', 'bg-').replace('-800', '-100')}`}>
                      {getStatusIcon(request.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.data.companyInfo?.companyName || 'SPV Formation Request'}
                        </h3>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {request.data.tier && (
                          <div>
                            <span className="text-gray-500">Tier:</span>
                            <span className="ml-2 font-medium text-gray-900">{request.data.tier}</span>
                          </div>
                        )}
                        {request.data.jurisdiction && (
                          <div>
                            <span className="text-gray-500">Jurisdiction:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {request.data.jurisdiction.name || request.data.jurisdiction}
                            </span>
                          </div>
                        )}
                        {request.data.pricing?.total && (
                          <div>
                            <span className="text-gray-500">Cost:</span>
                            <span className="ml-2 font-medium text-green-600">
                              {formatCurrency(request.data.pricing.total, 'EUR')}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Submitted:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {request.admin_notes && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm font-medium text-yellow-900 mb-1">Admin Notes:</p>
                          <p className="text-sm text-yellow-800">{request.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openDetails(request)}
                    className="ml-4 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="View details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(selectedRequest.status).replace('text-', 'bg-').replace('-800', '-100')}`}>
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedRequest.data.companyInfo?.companyName || 'SPV Formation Request'}
                  </h2>
                  <p className="text-sm text-gray-600">ID: {selectedRequest.id.slice(0, 8)}</p>
                </div>
              </div>
              <button
                onClick={closeDetails}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-6">
                {/* Status Overview */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Request Overview</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Status</div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedRequest.status)}`}>
                          {selectedRequest.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Submitted</div>
                        <div className="text-sm font-medium text-gray-900">{formatDate(selectedRequest.created_at)}</div>
                      </div>
                      {selectedRequest.completed_at && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Completed</div>
                          <div className="text-sm font-medium text-green-600">{formatDate(selectedRequest.completed_at)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tier & Jurisdiction */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Tier & Jurisdiction</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
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
                          <div className="text-sm font-medium text-gray-900">
                            {selectedRequest.data.jurisdiction.name || selectedRequest.data.jurisdiction}
                          </div>
                        </div>
                      )}
                      {selectedRequest.data.pricing?.total && (
                        <div className="col-span-2">
                          <div className="text-xs text-gray-500 mb-1">Total Cost</div>
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(selectedRequest.data.pricing.total, 'EUR')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company Information */}
                {selectedRequest.data.companyInfo && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Company Information</h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-4">
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
                    <h3 className="font-semibold text-gray-900 mb-4">Directors & Shareholders</h3>
                    <div className="space-y-3">
                      {selectedRequest.data.directors.map((director: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 rounded-xl p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Full Name</div>
                              <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                {director.fullName}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Nationality</div>
                              <div className="text-sm text-gray-700">{director.nationality}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Role</div>
                              <div className="text-sm text-gray-700">{director.role || 'Director'}</div>
                            </div>
                            {director.sharePercentage && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Share Percentage</div>
                                <div className="text-sm font-medium text-blue-600">{director.sharePercentage}%</div>
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
                    <h3 className="font-semibold text-gray-900 mb-4">Additional Services</h3>
                    <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                      {Object.entries(selectedRequest.data.additionalServices).map(([key, value]) => {
                        if (value) {
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
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
                    <h3 className="font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
                    <div className="space-y-2">
                      {selectedRequest.data.documents.map((doc: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-700">{doc.name || `Document ${idx + 1}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {selectedRequest.admin_notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Admin Notes</h3>
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
