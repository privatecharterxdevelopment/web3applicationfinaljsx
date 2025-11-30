import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  User,
  MapPin,
  ChevronDown,
  Calendar,
  Info,
  Globe,
  Users,
  Briefcase,
  Plus
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

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
        return 'bg-amber-50 text-amber-700';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700';
      case 'cancelled':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Pagination
  const totalPages = Math.ceil(requests.length / ITEMS_PER_PAGE);
  const paginatedRequests = requests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header - Left aligned with info icon */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">My SPVs</h1>
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Info size={16} className="text-gray-400" />
            </button>
          </div>
          <p className="text-sm text-gray-500">Track your SPV formation requests</p>
        </div>

        {/* Content */}
        {requests.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 size={28} className="text-gray-300" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">No SPV Formations</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
              You haven't submitted any SPV formation requests yet.
            </p>
            <button
              onClick={() => navigate('/spv-formation')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={16} />
              Start SPV Formation
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Stats Bar */}
            <div className="flex items-center justify-between text-xs text-gray-500 py-2 px-1">
              <span>{requests.length} formation{requests.length !== 1 ? 's' : ''}</span>
              <div className="flex gap-3">
                <span>{requests.filter(r => r.status === 'pending').length} pending</span>
                <span>{requests.filter(r => r.status === 'in_progress').length} in progress</span>
                <span>{requests.filter(r => r.status === 'completed').length} completed</span>
              </div>
            </div>

            {/* Pagination Info */}
            {requests.length > ITEMS_PER_PAGE && (
              <div className="text-xs text-gray-400 pb-2">
                Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, requests.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, requests.length)} of {requests.length}
              </div>
            )}

            {/* SPV List */}
            <div className="border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-100">
              {paginatedRequests.map((request) => {
                const isExpanded = expandedId === request.id;
                const companyName = request.data?.companyName || request.data?.companyInfo?.companyName || 'SPV Formation';
                const jurisdiction = request.data?.jurisdiction?.name || request.data?.jurisdiction || request.data?.jurisdictionDetails?.name || '';
                const tier = request.data?.selectedTier || request.data?.tier || '';
                const totalCost = request.data?.pricing?.total || request.data?.totalCost;
                const directors = request.data?.directors || [];

                return (
                  <div key={request.id} className="bg-white">
                    {/* Collapsed Row */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : request.id)}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      {/* Icon */}
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 size={14} className="text-gray-400" />
                      </div>

                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {companyName}
                          </span>
                          {tier && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded capitalize">
                              {tier}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {jurisdiction || formatDate(request.created_at)}
                        </div>
                      </div>

                      {/* Cost */}
                      {totalCost && (
                        <div className="text-sm font-medium text-gray-900 hidden sm:block">
                          {formatCurrency(totalCost)}
                        </div>
                      )}

                      {/* Status */}
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded capitalize ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>

                      {/* Chevron */}
                      <ChevronDown
                        size={16}
                        className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 border-t border-gray-50">
                        {/* Quick Details */}
                        <div className="flex flex-wrap gap-2 py-3">
                          {jurisdiction && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                              <Globe size={12} className="text-gray-400" />
                              {jurisdiction}
                            </div>
                          )}
                          {tier && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                              <Briefcase size={12} className="text-gray-400" />
                              {tier} tier
                            </div>
                          )}
                          {directors.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                              <Users size={12} className="text-gray-400" />
                              {directors.length} director{directors.length !== 1 ? 's' : ''}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            <Calendar size={12} className="text-gray-400" />
                            {formatDate(request.created_at)}
                          </div>
                        </div>

                        {/* Company Info */}
                        {(request.data?.businessActivity || request.data?.companyInfo?.activity) && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">Business Activity</div>
                            <p className="text-xs text-gray-600">
                              {request.data?.businessActivity || request.data?.companyInfo?.activity}
                            </p>
                          </div>
                        )}

                        {/* Directors Preview */}
                        {directors.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">Directors</div>
                            <div className="space-y-2">
                              {directors.slice(0, 3).map((director: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                      <User size={12} className="text-gray-500" />
                                    </div>
                                    <span className="text-xs text-gray-700">{director.fullName || director.name}</span>
                                  </div>
                                  {director.sharePercentage && (
                                    <span className="text-xs text-gray-500">{director.sharePercentage}%</span>
                                  )}
                                </div>
                              ))}
                              {directors.length > 3 && (
                                <p className="text-xs text-gray-400">+{directors.length - 3} more</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Pricing */}
                        {totalCost && (
                          <div className="bg-gray-900 rounded-lg p-3 mb-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">Total First Year Cost</span>
                              <span className="text-lg font-semibold text-white">{formatCurrency(totalCost)}</span>
                            </div>
                          </div>
                        )}

                        {/* Admin Notes */}
                        {request.admin_notes && (
                          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-3">
                            <div className="text-[10px] font-medium text-amber-600 uppercase tracking-wide mb-1">Admin Response</div>
                            <p className="text-xs text-amber-800">{request.admin_notes}</p>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[10px] text-gray-300 font-mono">{request.id.slice(0, 8)}</span>
                          {request.completed_at && (
                            <span className="text-[10px] text-emerald-600">
                              Completed {formatDate(request.completed_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {requests.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 text-xs font-medium rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .slice(0, 5)
                    .map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-6 h-6 text-xs font-medium rounded transition-colors ${
                          currentPage === page
                            ? 'bg-gray-900 text-white'
                            : 'hover:bg-gray-100 text-gray-500'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-2.5 py-1 text-xs font-medium rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">About SPV Formations</h2>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <p className="text-sm text-gray-600">
                A Special Purpose Vehicle (SPV) is a legal entity created for a specific, limited purpose.
                SPVs are commonly used for asset protection, investment structuring, and risk isolation.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Asset Protection</h4>
                    <p className="text-xs text-gray-500">Isolate assets and limit liability exposure</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Multiple Jurisdictions</h4>
                    <p className="text-xs text-gray-500">Choose from UAE, Malta, BVI, and more</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Full Documentation</h4>
                    <p className="text-xs text-gray-500">Receive all legal documents upon completion</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowInfoModal(false);
                  navigate('/spv-formation');
                }}
                className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Start New Formation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
