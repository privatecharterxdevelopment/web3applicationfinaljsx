import { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  Search,
  Shield,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  X,
  CreditCard,
  Plane,
  MessageSquare,
  FileText,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  user_role: string;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  partner_type: string | null;
  partner_verified: boolean | null;
  company_name: string | null;
}

interface UserDetails {
  profile: any;
  kyc: any;
  bookings: any[];
  requests: any[];
  supportTickets: any[];
  transactions: any[];
  subscriptions: any[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    verified: 0,
    partners: 0
  });

  // User detail modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersData: User[]) => {
    setStats({
      total: usersData.length,
      active: usersData.filter(u => u.is_active).length,
      verified: usersData.filter(u => u.email_verified).length,
      partners: usersData.filter(u => u.user_role === 'partner').length
    });
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.email?.toLowerCase().includes(query) ||
          u.first_name?.toLowerCase().includes(query) ||
          u.last_name?.toLowerCase().includes(query) ||
          u.phone?.toLowerCase().includes(query) ||
          u.company_name?.toLowerCase().includes(query)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.user_role === roleFilter);
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter(u => u.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(u => !u.is_active);
    } else if (statusFilter === 'verified') {
      filtered = filtered.filter(u => u.email_verified);
    } else if (statusFilter === 'unverified') {
      filtered = filtered.filter(u => !u.email_verified);
    }

    setFilteredUsers(filtered);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const toggleVerification = async (userId: string, currentVerified: boolean) => {
    try {
      // Update users table
      const { error: userError } = await supabase
        .from('users')
        .update({ email_verified: !currentVerified })
        .eq('id', userId);

      if (userError) throw userError;

      // Also update user_profiles if exists
      await supabase
        .from('user_profiles')
        .update({ is_verified: !currentVerified })
        .eq('user_id', userId);

      // Also update KYC application status if exists
      if (!currentVerified) {
        // If verifying user, approve their KYC
        await supabase
          .from('kyc_applications')
          .update({ status: 'approved', reviewed_at: new Date().toISOString() })
          .eq('user_id', userId);
      }

      fetchUsers();

      // Refresh selected user if open
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, email_verified: !currentVerified } : null);
        // Refresh user details to show updated KYC status
        if (userDetails) {
          fetchUserDetails({ ...selectedUser, email_verified: !currentVerified } as User);
        }
      }
    } catch (error) {
      console.error('Error toggling verification:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      // Delete from users table first
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Check console for details.');
    }
  };

  const fetchUserDetails = async (user: User) => {
    setSelectedUser(user);
    setLoadingDetails(true);
    setActiveTab('overview');

    try {
      // Fetch all related data in parallel
      const [
        profileRes,
        kycRes,
        bookingsRes,
        requestsRes,
        supportRes,
        transactionsRes,
        subscriptionsRes
      ] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('kyc_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
        supabase.from('user_bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('user_subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
      ]);

      setUserDetails({
        profile: profileRes.data,
        kyc: kycRes.data?.[0] || null,
        bookings: bookingsRes.data || [],
        requests: requestsRes.data || [],
        supportTickets: supportRes.data || [],
        transactions: transactionsRes.data || [],
        subscriptions: subscriptionsRes.data || []
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all registered users</p>
        </div>
        <button
          onClick={fetchUsers}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Stats - Monochromatic */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: UsersIcon },
          { label: 'Active', value: stats.active, icon: CheckCircle },
          { label: 'Verified', value: stats.verified, icon: Shield },
          { label: 'Partners', value: stats.partners, icon: UsersIcon }
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="partner">Partners</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.first_name || ''} {user.last_name || ''}
                        {!user.first_name && !user.last_name && <span className="text-gray-400">No name</span>}
                      </p>
                      {user.company_name && (
                        <p className="text-xs text-gray-500">{user.company_name}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.phone && (
                        <p className="text-xs text-gray-400">{user.phone}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                      user.user_role === 'admin'
                        ? 'bg-gray-900 text-white'
                        : user.user_role === 'partner'
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.user_role || 'user'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className={`inline-flex items-center gap-1 text-xs ${
                          user.is_active ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {user.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => toggleVerification(user.id, user.email_verified)}
                        className={`inline-flex items-center gap-1 text-xs ${
                          user.email_verified ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {user.email_verified ? 'Verified' : 'Unverified'}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">
                      {formatDate(user.created_at)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => fetchUserDetails(user)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-red-600"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedUser.first_name} {selectedUser.last_name}
                </h2>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleVerification(selectedUser.id, selectedUser.email_verified)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    selectedUser.email_verified
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {selectedUser.email_verified ? 'Verified' : 'Mark Verified'}
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-gray-200">
              <div className="flex gap-6">
                {[
                  { id: 'overview', label: 'Overview', icon: UsersIcon },
                  { id: 'bookings', label: 'Bookings', icon: Plane },
                  { id: 'requests', label: 'Requests', icon: FileText },
                  { id: 'support', label: 'Support', icon: MessageSquare },
                  { id: 'transactions', label: 'Transactions', icon: CreditCard }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
                </div>
              ) : (
                <>
                  {/* Overview Tab */}
                  {activeTab === 'overview' && userDetails && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* User Info */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">User Info</h3>
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Email</span>
                            <span className="text-sm text-gray-900">{selectedUser.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Phone</span>
                            <span className="text-sm text-gray-900">{selectedUser.phone || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Role</span>
                            <span className="text-sm text-gray-900">{selectedUser.user_role || 'user'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Registered</span>
                            <span className="text-sm text-gray-900">{formatDate(selectedUser.created_at)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Last Sign In</span>
                            <span className="text-sm text-gray-900">
                              {selectedUser.last_sign_in_at ? formatDate(selectedUser.last_sign_in_at) : '-'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* KYC Status */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">KYC Status</h3>
                        <div className="bg-gray-50 rounded-xl p-4">
                          {userDetails.kyc ? (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Status</span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  userDetails.kyc.status === 'approved' ? 'bg-gray-900 text-white' :
                                  userDetails.kyc.status === 'pending' ? 'bg-gray-200 text-gray-700' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  {userDetails.kyc.status}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Submitted</span>
                                <span className="text-sm text-gray-900">
                                  {formatDate(userDetails.kyc.submitted_at || userDetails.kyc.created_at)}
                                </span>
                              </div>
                              {userDetails.kyc.application_data && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Name</span>
                                    <span className="text-sm text-gray-900">
                                      {userDetails.kyc.application_data.firstName} {userDetails.kyc.application_data.lastName}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Nationality</span>
                                    <span className="text-sm text-gray-900">
                                      {userDetails.kyc.application_data.nationality || '-'}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No KYC application</p>
                          )}
                        </div>
                      </div>

                      {/* Profile Data */}
                      {userDetails.profile && (
                        <div className="space-y-4 md:col-span-2">
                          <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Profile Data</h3>
                          <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {userDetails.profile.address && (
                              <div>
                                <p className="text-xs text-gray-500">Address</p>
                                <p className="text-sm text-gray-900">{userDetails.profile.address}</p>
                              </div>
                            )}
                            {userDetails.profile.city && (
                              <div>
                                <p className="text-xs text-gray-500">City</p>
                                <p className="text-sm text-gray-900">{userDetails.profile.city}</p>
                              </div>
                            )}
                            {userDetails.profile.country && (
                              <div>
                                <p className="text-xs text-gray-500">Country</p>
                                <p className="text-sm text-gray-900">{userDetails.profile.country}</p>
                              </div>
                            )}
                            {userDetails.profile.wallet_address && (
                              <div>
                                <p className="text-xs text-gray-500">Wallet</p>
                                <p className="text-sm text-gray-900 font-mono truncate">
                                  {userDetails.profile.wallet_address.slice(0, 6)}...{userDetails.profile.wallet_address.slice(-4)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Quick Stats */}
                      <div className="space-y-4 md:col-span-2">
                        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Activity Summary</h3>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="bg-gray-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-semibold text-gray-900">{userDetails.bookings.length}</p>
                            <p className="text-xs text-gray-500">Bookings</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-semibold text-gray-900">{userDetails.requests.length}</p>
                            <p className="text-xs text-gray-500">Requests</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-semibold text-gray-900">{userDetails.supportTickets.length}</p>
                            <p className="text-xs text-gray-500">Tickets</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-semibold text-gray-900">{userDetails.transactions.length}</p>
                            <p className="text-xs text-gray-500">Transactions</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bookings Tab */}
                  {activeTab === 'bookings' && userDetails && (
                    <div className="space-y-4">
                      {userDetails.bookings.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">No bookings found</p>
                      ) : (
                        <div className="space-y-3">
                          {userDetails.bookings.map((booking: any) => (
                            <div key={booking.id} className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {booking.service_type || booking.type || 'Booking'}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {booking.origin && booking.destination
                                      ? `${booking.origin} → ${booking.destination}`
                                      : booking.details || '-'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                    booking.status === 'confirmed' ? 'bg-gray-900 text-white' :
                                    booking.status === 'pending' ? 'bg-gray-200 text-gray-700' :
                                    'bg-gray-100 text-gray-500'
                                  }`}>
                                    {booking.status || 'pending'}
                                  </span>
                                  {booking.total_price && (
                                    <p className="text-sm font-medium text-gray-900 mt-1">
                                      {formatCurrency(booking.total_price)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatDate(booking.created_at)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Requests Tab */}
                  {activeTab === 'requests' && userDetails && (
                    <div className="space-y-4">
                      {userDetails.requests.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">No requests found</p>
                      ) : (
                        <div className="space-y-3">
                          {userDetails.requests.map((request: any) => (
                            <div key={request.id} className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {request.service_type || request.type || 'Request'}
                                  </p>
                                  {request.from && request.to && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {request.from} → {request.to}
                                    </p>
                                  )}
                                  {request.date && (
                                    <p className="text-xs text-gray-500">Date: {request.date}</p>
                                  )}
                                  {request.passengers && (
                                    <p className="text-xs text-gray-500">{request.passengers} passengers</p>
                                  )}
                                </div>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  request.status === 'confirmed' || request.status === 'completed' ? 'bg-gray-900 text-white' :
                                  request.status === 'pending' ? 'bg-gray-200 text-gray-700' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  {request.status || 'pending'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatDate(request.created_at)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Support Tab */}
                  {activeTab === 'support' && userDetails && (
                    <div className="space-y-4">
                      {userDetails.supportTickets.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">No support tickets</p>
                      ) : (
                        <div className="space-y-3">
                          {userDetails.supportTickets.map((ticket: any) => (
                            <div key={ticket.id} className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {ticket.subject || ticket.category || 'Support Ticket'}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                    {ticket.message || ticket.description || '-'}
                                  </p>
                                </div>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  ticket.status === 'resolved' || ticket.status === 'closed' ? 'bg-gray-900 text-white' :
                                  ticket.status === 'open' || ticket.status === 'pending' ? 'bg-gray-200 text-gray-700' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  {ticket.status || 'open'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatDate(ticket.created_at)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Transactions Tab */}
                  {activeTab === 'transactions' && userDetails && (
                    <div className="space-y-4">
                      {userDetails.transactions.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">No transactions</p>
                      ) : (
                        <div className="space-y-3">
                          {userDetails.transactions.map((tx: any) => (
                            <div key={tx.id} className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {tx.type || tx.description || 'Transaction'}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {tx.reference || tx.transaction_id || '-'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatCurrency(tx.amount || 0)}
                                  </p>
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                    tx.status === 'completed' || tx.status === 'success' ? 'bg-gray-900 text-white' :
                                    tx.status === 'pending' ? 'bg-gray-200 text-gray-700' :
                                    'bg-gray-100 text-gray-500'
                                  }`}>
                                    {tx.status || 'pending'}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatDate(tx.created_at)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
