import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Eye,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Car,
  Sparkles,
  Building2,
  Check,
  Loader2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface CardApplication {
  id: string;
  user_id: string | null;
  status: string;
  account_type: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  vat_number: string | null;
  monthly_spending: string;
  expected_volume: string;
  card_tier: string;
  card_price: number;
  min_topup: number;
  ground_transport_included: string | null;
  extra_transport_km: string;
  extra_transport_price: number;
  ai_plan_name: string | null;
  ai_plan_value: number | null;
  staking_apy: string | null;
  discount_booking: string | null;
  discount_empty_legs: string | null;
  discount_hotels: string | null;
  created_at: string;
  updated_at: string;
}

export default function CardApplicationsManagement() {
  const [applications, setApplications] = useState<CardApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<CardApplication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [tierFilter, statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('card_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (tierFilter !== 'all') {
        query = query.eq('card_tier', tierFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching applications:', error);
        return;
      }

      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingStatus(true);

      const { error } = await supabase
        .from('card_applications')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setApplications(prev =>
        prev.map(app => app.id === id ? { ...app, status: newStatus } : app)
      );

      if (selectedApplication?.id === id) {
        setSelectedApplication({ ...selectedApplication, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic':
        return 'bg-gray-100 text-gray-800';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800';
      case 'crew':
        return 'bg-blue-100 text-blue-800';
      case 'black':
        return 'bg-gray-900 text-white';
      case 'platinum':
        return 'bg-gradient-to-r from-gray-200 to-gray-400 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'waitlist':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-3 h-3" />;
      case 'rejected':
        return <XCircle className="w-3 h-3" />;
      case 'under_review':
        return <Clock className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
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

  const filteredApplications = applications.filter(app => {
    const searchLower = searchTerm.toLowerCase();
    return (
      app.first_name.toLowerCase().includes(searchLower) ||
      app.last_name.toLowerCase().includes(searchLower) ||
      app.email.toLowerCase().includes(searchLower) ||
      app.phone.includes(searchTerm) ||
      app.country.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    underReview: applications.filter(a => a.status === 'under_review').length,
    totalRevenue: applications
      .filter(a => a.status === 'approved')
      .reduce((sum, a) => sum + a.card_price + a.extra_transport_price, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Card Applications</h1>
            <p className="text-sm text-gray-500">DebitCardX applications management</p>
          </div>
        </div>
        <button
          onClick={fetchApplications}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Under Review</p>
              <p className="text-2xl font-bold text-blue-600">{stats.underReview}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-green-600">${stats.totalRevenue}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="all">All Tiers</option>
            <option value="basic">Basic</option>
            <option value="gold">Gold</option>
            <option value="crew">Crew</option>
            <option value="black">Black</option>
            <option value="platinum">Platinum</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="waitlist">Waitlist</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
          <p className="text-gray-500">
            {searchTerm || tierFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No card applications yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Card Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Fee
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
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {app.account_type === 'corporate' ? (
                            <Building2 className="w-5 h-5 text-gray-500" />
                          ) : (
                            <User className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {app.first_name} {app.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{app.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTierColor(app.card_tier)}`}>
                        {app.card_tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ${app.card_price}/mo
                      </div>
                      {app.extra_transport_price > 0 && (
                        <div className="text-xs text-gray-500">
                          +${app.extra_transport_price} transport
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                        {getStatusIcon(app.status)}
                        {app.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(app.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedApplication(app);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTierColor(selectedApplication.card_tier)}`}>
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedApplication.first_name} {selectedApplication.last_name}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedApplication.card_tier.toUpperCase()} Card Application</p>
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
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                {/* Status Update */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Application Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'under_review', 'approved', 'rejected', 'waitlist'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateApplicationStatus(selectedApplication.id, status)}
                        disabled={updatingStatus || selectedApplication.status === status}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                          selectedApplication.status === status
                            ? getStatusColor(status)
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {updatingStatus && selectedApplication.status !== status ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : selectedApplication.status === status ? (
                          <Check className="w-4 h-4" />
                        ) : null}
                        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
                  <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Full Name</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedApplication.first_name} {selectedApplication.last_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900">{selectedApplication.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{selectedApplication.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Country</p>
                        <p className="text-sm font-medium text-gray-900">{selectedApplication.country}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Account Type</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{selectedApplication.account_type}</p>
                      </div>
                    </div>
                    {selectedApplication.vat_number && (
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">VAT Number</p>
                          <p className="text-sm font-medium text-gray-900">{selectedApplication.vat_number}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Financial Information</h3>
                  <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Monthly Spending</p>
                      <p className="text-sm font-medium text-gray-900">${selectedApplication.monthly_spending}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Expected Annual Volume</p>
                      <p className="text-sm font-medium text-gray-900">${selectedApplication.expected_volume}</p>
                    </div>
                  </div>
                </div>

                {/* Card Selection */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Card Selection</h3>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTierColor(selectedApplication.card_tier)}`}>
                        {selectedApplication.card_tier.toUpperCase()}
                      </span>
                      <span className="text-2xl font-bold text-gray-900">
                        ${selectedApplication.card_price}/mo
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Min. Top-up</p>
                        <p className="text-sm font-medium text-gray-900">${selectedApplication.min_topup}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Staking APY</p>
                        <p className="text-sm font-medium text-gray-900">{selectedApplication.staking_apy || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ground Transport */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Ground Transport
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Included</p>
                      <p className="text-sm font-medium text-gray-900">{selectedApplication.ground_transport_included || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Extra Km Add-on</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedApplication.extra_transport_km === '0'
                          ? 'None'
                          : `+${selectedApplication.extra_transport_km} km (+$${selectedApplication.extra_transport_price}/mo)`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Plan */}
                {selectedApplication.ai_plan_name && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      AI Assistant Plan
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Plan Name</p>
                        <p className="text-sm font-medium text-gray-900">{selectedApplication.ai_plan_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Value</p>
                        <p className="text-sm font-medium text-gray-900">${selectedApplication.ai_plan_value}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Discounts */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Discounts</h3>
                  <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{selectedApplication.discount_booking || '-'}</p>
                      <p className="text-xs text-gray-500">Bookings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{selectedApplication.discount_empty_legs || '-'}</p>
                      <p className="text-xs text-gray-500">Empty Legs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{selectedApplication.discount_hotels || '-'}</p>
                      <p className="text-xs text-gray-500">Hotels</p>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Timestamps</h3>
                  <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Applied At</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(selectedApplication.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Last Updated</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(selectedApplication.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center">
                <a
                  href={`mailto:${selectedApplication.email}?subject=Your DebitCardX Application`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Contact Applicant
                </a>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
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
