import React, { useState, useEffect } from 'react';
import {
  User,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  ExternalLink,
  AlertCircle,
  Shield,
  CreditCard
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface Partner {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  partner_type: string;
  phone: string;
  logo_url: string;
  biography: string;
  partner_verified: boolean;
  stripe_connect_account_id: string;
  stripe_verification_status: string;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_onboarding_completed: boolean;
  created_at: string;
  partner_details?: {
    business_registration: string;
    tax_id: string;
    id_document_type: string;
    id_document_number: string;
    date_of_birth: string;
    nationality: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
    verification_status: string;
  };
}

export default function PartnerVerificationManagement() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  useEffect(() => {
    filterPartnersList();
  }, [partners, searchTerm, filterStatus]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          partner_details (*)
        `)
        .eq('user_role', 'partner')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPartnersList = () => {
    let filtered = partners;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => {
        if (filterStatus === 'pending') {
          return !p.partner_verified && p.stripe_verification_status !== 'verified';
        } else if (filterStatus === 'stripe_verified') {
          return p.stripe_verification_status === 'verified' && !p.partner_verified;
        } else if (filterStatus === 'approved') {
          return p.partner_verified;
        } else if (filterStatus === 'rejected') {
          return p.partner_details?.verification_status === 'rejected';
        }
        return true;
      });
    }

    setFilteredPartners(filtered);
  };

  const handleApprovePartner = async (partnerId: string) => {
    setActionLoading(true);
    try {
      // Update partner as verified
      const { error } = await supabase
        .from('users')
        .update({
          partner_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);

      if (error) throw error;

      // Update partner_details verification status
      await supabase
        .from('partner_details')
        .update({
          verification_status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('user_id', partnerId);

      // Send notification to partner
      await supabase
        .from('partner_notifications')
        .insert({
          partner_id: partnerId,
          type: 'service_approved',
          title: 'Partner Application Approved!',
          message: 'Congratulations! Your partner application has been approved. You can now start offering services and accepting bookings.',
          read: false
        });

      // Refresh list
      await fetchPartners();
      setShowDetailModal(false);
      alert('Partner approved successfully!');
    } catch (error) {
      console.error('Error approving partner:', error);
      alert('Failed to approve partner. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPartner = async (partnerId: string) => {
    const reason = prompt('Please provide a reason for rejecting this partner:');
    if (!reason) return;

    setActionLoading(true);
    try {
      // Update partner_details verification status
      await supabase
        .from('partner_details')
        .update({
          verification_status: 'rejected',
          rejection_reason: reason
        })
        .eq('user_id', partnerId);

      // Send notification to partner
      await supabase
        .from('partner_notifications')
        .insert({
          partner_id: partnerId,
          type: 'service_rejected',
          title: 'Partner Application Rejected',
          message: `Unfortunately, your partner application has been rejected. Reason: ${reason}`,
          read: false
        });

      // Refresh list
      await fetchPartners();
      setShowDetailModal(false);
      alert('Partner rejected.');
    } catch (error) {
      console.error('Error rejecting partner:', error);
      alert('Failed to reject partner. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const syncStripeStatus = async (partnerId: string, stripeAccountId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/partners/account-status?partnerId=${partnerId}`, {
        method: 'GET'
      });

      if (response.ok) {
        await fetchPartners();
        alert('Stripe status synced successfully');
      }
    } catch (error) {
      console.error('Error syncing Stripe status:', error);
      alert('Failed to sync Stripe status');
    }
  };

  const getVerificationStatusBadge = (partner: Partner) => {
    if (partner.partner_verified) {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Approved</span>;
    }

    if (partner.partner_details?.verification_status === 'rejected') {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Rejected</span>;
    }

    if (partner.stripe_verification_status === 'verified') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium flex items-center gap-1">
        <Shield size={12} />
        Stripe Verified
      </span>;
    }

    if (partner.stripe_verification_status === 'pending') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">Stripe Pending</span>;
    }

    return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">Pending Review</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500">Loading partners...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Verification</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and approve partner applications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
            <span className="text-xs text-gray-500">Total Partners:</span>
            <span className="ml-2 text-sm font-semibold text-gray-900">{partners.length}</span>
          </div>
          <div className="bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
            <span className="text-xs text-yellow-700">Pending:</span>
            <span className="ml-2 text-sm font-semibold text-yellow-900">
              {partners.filter(p => !p.partner_verified).length}
            </span>
          </div>
        </div>
      </div>

      {/* Stripe Admin Dashboard Links */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={20} className="text-blue-600" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Stripe Dashboard</h3>
              <p className="text-xs text-gray-600">Manage payments, payouts, and disputes</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <a
              href="https://dashboard.stripe.com/connect/accounts/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-white text-gray-700 text-xs rounded-md hover:bg-gray-50 transition-colors border border-gray-300"
            >
              <Shield size={12} />
              Partners
              <ExternalLink size={10} />
            </a>
            <a
              href="https://dashboard.stripe.com/connect/transfers"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-white text-gray-700 text-xs rounded-md hover:bg-gray-50 transition-colors border border-gray-300"
            >
              Transfers
              <ExternalLink size={10} />
            </a>
            <a
              href="https://dashboard.stripe.com/payouts"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-white text-gray-700 text-xs rounded-md hover:bg-gray-50 transition-colors border border-gray-300"
            >
              Payouts
              <ExternalLink size={10} />
            </a>
            <a
              href="https://dashboard.stripe.com/disputes"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-white text-gray-700 text-xs rounded-md hover:bg-gray-50 transition-colors border border-gray-300"
            >
              Disputes
              <ExternalLink size={10} />
            </a>
            <a
              href="https://dashboard.stripe.com/payments"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
            >
              All Payments
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="stripe_verified">Stripe Verified</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Partners List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stripe Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">
                    No partners found
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {partner.logo_url ? (
                          <img
                            src={partner.logo_url}
                            alt="Logo"
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User size={20} className="text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {partner.company_name || `${partner.first_name} ${partner.last_name}`}
                          </p>
                          <p className="text-xs text-gray-500">{partner.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {partner.partner_type?.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {partner.stripe_connect_account_id ? (
                          <>
                            <span className={`text-xs font-medium ${
                              partner.stripe_verification_status === 'verified' ? 'text-green-600' :
                              partner.stripe_verification_status === 'pending' ? 'text-yellow-600' :
                              'text-gray-600'
                            }`}>
                              {partner.stripe_verification_status || 'unverified'}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              {partner.stripe_charges_enabled && (
                                <span className="text-green-600">✓ Charges</span>
                              )}
                              {partner.stripe_payouts_enabled && (
                                <span className="text-green-600">✓ Payouts</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">No Stripe account</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getVerificationStatusBadge(partner)}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {formatDistanceToNow(new Date(partner.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPartner(partner);
                            setShowDetailModal(true);
                          }}
                          className="px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md hover:bg-black transition-colors flex items-center gap-1"
                        >
                          <Eye size={12} />
                          Review
                        </button>
                        {partner.stripe_connect_account_id && (
                          <button
                            onClick={() => syncStripeStatus(partner.id, partner.stripe_connect_account_id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Sync Stripe status"
                          >
                            <CreditCard size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedPartner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedPartner.logo_url ? (
                    <img
                      src={selectedPartner.logo_url}
                      alt="Logo"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <Building2 size={32} className="text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedPartner.company_name || `${selectedPartner.first_name} ${selectedPartner.last_name}`}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">{selectedPartner.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{selectedPartner.email}</span>
                  </div>
                  {selectedPartner.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{selectedPartner.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Biography */}
              {selectedPartner.biography && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {selectedPartner.biography}
                  </p>
                </div>
              )}

              {/* KYC Details */}
              {selectedPartner.partner_details && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Business & KYC Details</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Business Registration</p>
                      <p className="text-sm text-gray-900 font-medium">{selectedPartner.partner_details.business_registration}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tax ID</p>
                      <p className="text-sm text-gray-900 font-medium">{selectedPartner.partner_details.tax_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ID Document</p>
                      <p className="text-sm text-gray-900">{selectedPartner.partner_details.id_document_type}: {selectedPartner.partner_details.id_document_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Nationality</p>
                      <p className="text-sm text-gray-900">{selectedPartner.partner_details.nationality}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm text-gray-900">
                        {selectedPartner.partner_details.address}, {selectedPartner.partner_details.city}, {selectedPartner.partner_details.postal_code}, {selectedPartner.partner_details.country}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stripe Status */}
              {selectedPartner.stripe_connect_account_id && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield size={16} />
                    Stripe Connect Status
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Account ID:</span>
                      <code className="text-xs bg-white px-2 py-1 rounded border border-blue-200">
                        {selectedPartner.stripe_connect_account_id}
                      </code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Verification:</span>
                      <span className={`text-xs font-medium ${
                        selectedPartner.stripe_verification_status === 'verified' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {selectedPartner.stripe_verification_status || 'pending'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Onboarding:</span>
                      <span className="text-xs">{selectedPartner.stripe_onboarding_completed ? '✓ Complete' : '⏳ Pending'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Can receive payments:</span>
                      <span className="text-xs">{selectedPartner.stripe_charges_enabled ? '✓ Yes' : '✗ No'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Can receive payouts:</span>
                      <span className="text-xs">{selectedPartner.stripe_payouts_enabled ? '✓ Yes' : '✗ No'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {!selectedPartner.partner_verified && selectedPartner.partner_details?.verification_status !== 'rejected' && (
              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => handleRejectPartner(selectedPartner.id)}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <XCircle size={16} />
                  Reject Partner
                </button>
                <button
                  onClick={() => handleApprovePartner(selectedPartner.id)}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Approve Partner
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
