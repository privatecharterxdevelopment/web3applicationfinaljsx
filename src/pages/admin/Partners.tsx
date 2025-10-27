import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, CheckCircle, XCircle, Clock, ExternalLink, DollarSign, AlertCircle } from 'lucide-react';

interface Partner {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone: string;
  partner_type: string;
  stripe_connect_account_id: string;
  stripe_onboarding_completed: boolean;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_verification_status: string;
  partner_verified: boolean;
  created_at: string;
}

interface PartnerStats {
  total: number;
  verified: number;
  pending: number;
  stripeActive: number;
}

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stats, setStats] = useState<PartnerStats>({
    total: 0,
    verified: 0,
    pending: 0,
    stripeActive: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);

      // Fetch partners (users with partner_type set)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .not('partner_type', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPartners(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const verified = data?.filter(p => p.partner_verified).length || 0;
      const pending = total - verified;
      const stripeActive = data?.filter(p => p.stripe_charges_enabled && p.stripe_payouts_enabled).length || 0;

      setStats({ total, verified, pending, stripeActive });
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyPartner = async (partnerId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ partner_verified: true })
        .eq('id', partnerId);

      if (error) throw error;

      // Send notification to partner
      await supabase.from('notifications').insert({
        user_id: partnerId,
        type: 'admin',
        title: 'Partner Verified!',
        message: 'Congratulations! Your partner account has been verified. You can now start accepting bookings.',
        is_read: false
      });

      fetchPartners();
    } catch (error) {
      console.error('Error verifying partner:', error);
    }
  };

  const filteredPartners = partners.filter(p => {
    if (filter === 'verified') return p.partner_verified;
    if (filter === 'pending') return !p.partner_verified;
    return true;
  });

  const getVerificationBadge = (partner: Partner) => {
    if (partner.partner_verified) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

  const getStripeBadge = (partner: Partner) => {
    if (partner.stripe_charges_enabled && partner.stripe_payouts_enabled) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    }
    if (partner.stripe_connect_account_id) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Incomplete
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <XCircle className="w-3 h-3 mr-1" />
        Not Connected
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Partner Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage partner registrations, verifications, and Stripe Connect accounts
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Partners</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Verified</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.verified}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.pending}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Stripe Active</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.stripeActive}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'verified'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Verified ({stats.verified})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({stats.pending})
          </button>
        </div>
      </div>

      {/* Partners Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Partner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Verification
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stripe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registered
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPartners.map((partner) => (
              <tr key={partner.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {partner.first_name} {partner.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{partner.email}</div>
                      {partner.company_name && (
                        <div className="text-xs text-gray-400">{partner.company_name}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                    {partner.partner_type || 'General'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getVerificationBadge(partner)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStripeBadge(partner)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(partner.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    {!partner.partner_verified && (
                      <button
                        onClick={() => verifyPartner(partner.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Verify
                      </button>
                    )}
                    {partner.stripe_connect_account_id && (
                      <a
                        href={`https://dashboard.stripe.com/connect/accounts/${partner.stripe_connect_account_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                      >
                        Stripe <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPartners.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No partners found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all'
                ? 'No partners have registered yet.'
                : `No ${filter} partners found.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
