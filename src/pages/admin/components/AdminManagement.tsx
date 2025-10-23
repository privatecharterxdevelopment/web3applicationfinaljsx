import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Edit, 
  Save, 
  X, 
  Crown,
  UserCheck,
  UserMinus,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Search
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAdminPermissions } from '../../../hooks/useAdminPermissions';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  is_admin: boolean;
}

interface AdminSettings {
  role: 'super_admin' | 'booking_admin' | 'kyc_admin' | 'co2_admin' | 'none';
  permissions: {
    booking_requests: {
      read: boolean;
      write: boolean;
      approve: boolean;
    };
    co2_certificate_requests: {
      read: boolean;
      write: boolean;
      assign_ngo: boolean;
      approve: boolean;
    };
    user_requests: {
      read: boolean;
      write: boolean;
      complete: boolean;
    };
    kyc_applications: {
      read: boolean;
      write: boolean;
      approve: boolean;
      reject: boolean;
    };
  };
}

interface UserWithAdmin extends User {
  adminSettings?: AdminSettings;
  hasAdminRecord: boolean;
}

export default function AdminManagement() {
  const [users, setUsers] = useState<UserWithAdmin[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingSettings, setEditingSettings] = useState<AdminSettings | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  
  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  const { isSuperAdmin } = useAdminPermissions();

  // Role definitions with their permissions
  const roleTemplates: Record<string, AdminSettings> = {
    super_admin: {
      role: 'super_admin',
      permissions: {
        booking_requests: { read: true, write: true, approve: true },
        co2_certificate_requests: { read: true, write: true, assign_ngo: true, approve: true },
        user_requests: { read: true, write: true, complete: true },
        kyc_applications: { read: true, write: true, approve: true, reject: true }
      }
    },
    booking_admin: {
      role: 'booking_admin',
      permissions: {
        booking_requests: { read: true, write: true, approve: true },
        co2_certificate_requests: { read: false, write: false, assign_ngo: false, approve: false },
        user_requests: { read: true, write: true, complete: true },
        kyc_applications: { read: false, write: false, approve: false, reject: false }
      }
    },
    kyc_admin: {
      role: 'kyc_admin',
      permissions: {
        booking_requests: { read: false, write: false, approve: false },
        co2_certificate_requests: { read: false, write: false, assign_ngo: false, approve: false },
        user_requests: { read: true, write: true, complete: true },
        kyc_applications: { read: true, write: true, approve: true, reject: true }
      }
    },
    co2_admin: {
      role: 'co2_admin',
      permissions: {
        booking_requests: { read: false, write: false, approve: false },
        co2_certificate_requests: { read: true, write: true, assign_ngo: true, approve: true },
        user_requests: { read: true, write: true, complete: true },
        kyc_applications: { read: false, write: false, approve: false, reject: false }
      }
    },
    none: {
      role: 'none',
      permissions: {
        booking_requests: { read: false, write: false, approve: false },
        co2_certificate_requests: { read: false, write: false, assign_ngo: false, approve: false },
        user_requests: { read: false, write: false, complete: false },
        kyc_applications: { read: false, write: false, approve: false, reject: false }
      }
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) {
      setError('Access denied. Only super admins can manage admin users.');
      setLoading(false);
      return;
    }
    
    fetchUsers();
  }, [isSuperAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, created_at, is_admin')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch all admin settings (don't throw error if this fails)
      const { data: adminData, error: adminError } = await supabase
        .from('admin_settings')
        .select('user_id, settings');

      if (adminError) {
        console.warn('Could not fetch admin settings:', adminError);
      }

      // Merge user data with admin settings - all users are included
      const usersWithAdmin: UserWithAdmin[] = (usersData || []).map(user => {
        const adminRecord = adminData?.find(admin => admin.user_id === user.id);
        return {
          ...user,
          adminSettings: adminRecord?.settings || undefined,
          hasAdminRecord: !!adminRecord
        };
      });

      console.log(`Loaded ${usersWithAdmin.length} total users, ${usersWithAdmin.filter(u => u.hasAdminRecord).length} with admin records`);
      setUsers(usersWithAdmin);
      setFilteredUsers(usersWithAdmin);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Search and filter logic
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      if (roleFilter === 'admin') {
        filtered = filtered.filter(user => user.hasAdminRecord);
      } else if (roleFilter === 'regular') {
        filtered = filtered.filter(user => !user.hasAdminRecord);
      } else {
        filtered = filtered.filter(user => user.adminSettings?.role === roleFilter);
      }
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchTerm, roleFilter]);

  const startEditing = (user: UserWithAdmin) => {
    setEditingUser(user.id);
    setEditingSettings(user.adminSettings || roleTemplates.none);
  };

  const promoteToAdmin = (user: UserWithAdmin, role: string = 'booking_admin') => {
    setEditingUser(user.id);
    setEditingSettings(roleTemplates[role]);
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setEditingSettings(null);
  };

  const applyRoleTemplate = (role: string) => {
    if (editingSettings) {
      setEditingSettings(roleTemplates[role]);
    }
  };

  const updatePermission = (
    table: keyof AdminSettings['permissions'],
    action: string,
    value: boolean
  ) => {
    if (!editingSettings) return;

    setEditingSettings({
      ...editingSettings,
      permissions: {
        ...editingSettings.permissions,
        [table]: {
          ...editingSettings.permissions[table],
          [action]: value
        }
      }
    });
  };

  const saveUserSettings = async (userId: string) => {
    if (!editingSettings) return;

    try {
      setSaving(userId);

      // Check if admin record exists
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');

      if (user.hasAdminRecord) {
        // Update existing record
        const { error } = await supabase
          .from('admin_settings')
          .update({ 
            settings: editingSettings,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('admin_settings')
          .insert([{
            user_id: userId,
            settings: editingSettings
          }]);

        if (error) throw error;
      }

      // Refresh users list
      await fetchUsers();
      setEditingUser(null);
      setEditingSettings(null);
    } catch (err) {
      console.error('Error saving admin settings:', err);
      setError('Failed to save admin settings');
    } finally {
      setSaving(null);
    }
  };

  const removeAdminAccess = async (userId: string) => {
    if (!confirm('Are you sure you want to remove admin access for this user?')) {
      return;
    }

    try {
      setSaving(userId);

      const { error } = await supabase
        .from('admin_settings')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      await fetchUsers();
    } catch (err) {
      console.error('Error removing admin access:', err);
      setError('Failed to remove admin access');
    } finally {
      setSaving(null);
    }
  };

  const toggleUserExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'super_admin': return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'booking_admin': return <Shield className="h-4 w-4 text-blue-600" />;
      case 'kyc_admin': return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'co2_admin': return <Shield className="h-4 w-4 text-emerald-600" />;
      default: return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'super_admin': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'booking_admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'kyc_admin': return 'bg-green-100 text-green-800 border-green-200';
      case 'co2_admin': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
          <span className="text-red-700">Access denied. Only super admins can manage admin users.</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{users.length} total users</span>
          </div>
          <div className="flex items-center space-x-1">
            <Shield className="h-4 w-4" />
            <span>{users.filter(u => u.hasAdminRecord).length} admins</span>
          </div>
          <div className="flex items-center space-x-1">
            <UserCheck className="h-4 w-4" />
            <span>{users.filter(u => !u.hasAdminRecord).length} regular users</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Role Filter */}
          <div className="sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Users</option>
              <option value="admin">All Admins</option>
              <option value="regular">Regular Users</option>
              <option value="super_admin">Super Admins</option>
              <option value="booking_admin">Booking Admins</option>
              <option value="kyc_admin">KYC Admins</option>
              <option value="co2_admin">CO2 Admins</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || roleFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
              }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Summary */}
        <div className="mt-3 text-sm text-gray-600">
          Showing {currentUsers.length} of {filteredUsers.length} users
          {filteredUsers.length !== users.length && ` (filtered from ${users.length} total)`}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.map((user) => (
                <React.Fragment key={user.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name || user.last_name 
                              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                              : 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.adminSettings?.role)}
                        <span className={`px-2 py-1 text-xs rounded-full border ${getRoleBadgeColor(user.adminSettings?.role)}`}>
                          {user.adminSettings?.role ? 
                            user.adminSettings.role.replace('_', ' ').toUpperCase() : 
                            'NO ACCESS'
                          }
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.hasAdminRecord ? (
                        <button
                          onClick={() => toggleUserExpanded(user.id)}
                          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                        >
                          {expandedUsers.has(user.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span>View Permissions</span>
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">No permissions</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {editingUser === user.id ? (
                          <>
                            <button
                              onClick={() => saveUserSettings(user.id)}
                              disabled={saving === user.id}
                              className="inline-flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              {saving === user.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                              ) : (
                                <Save className="h-4 w-4 mr-1" />
                              )}
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="inline-flex items-center px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </button>
                          </>
                        ) : user.hasAdminRecord ? (
                          // User already has admin record - show edit/remove buttons
                          <>
                            <button
                              onClick={() => startEditing(user)}
                              className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => removeAdminAccess(user.id)}
                              disabled={saving === user.id}
                              className="inline-flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              <UserMinus className="h-4 w-4 mr-1" />
                              Remove
                            </button>
                          </>
                        ) : (
                          // Regular user - show promote to admin options
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => promoteToAdmin(user, 'booking_admin')}
                              className="inline-flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                              title="Promote to Booking Admin"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Promote
                            </button>
                            <div className="relative">
                              <select
                                onChange={(e) => promoteToAdmin(user, e.target.value)}
                                className="text-xs bg-gray-100 border border-gray-300 rounded px-2 py-1 text-gray-700"
                                defaultValue=""
                              >
                                <option value="" disabled>Role</option>
                                <option value="booking_admin">Booking Admin</option>
                                <option value="kyc_admin">KYC Admin</option>
                                <option value="co2_admin">CO2 Admin</option>
                                <option value="super_admin">Super Admin</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded permissions view */}
                  {expandedUsers.has(user.id) && user.adminSettings && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-900">Current Permissions</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Object.entries(user.adminSettings.permissions).map(([table, perms]) => (
                              <div key={table} className="bg-white p-3 rounded border">
                                <h5 className="text-xs font-medium text-gray-700 mb-2 capitalize">
                                  {table.replace('_', ' ')}
                                </h5>
                                <div className="space-y-1">
                                  {Object.entries(perms).map(([action, enabled]) => (
                                    <div key={action} className="flex items-center justify-between text-xs">
                                      <span className="text-gray-600 capitalize">{action}</span>
                                      {enabled ? (
                                        <Check className="h-3 w-3 text-green-600" />
                                      ) : (
                                        <X className="h-3 w-3 text-red-400" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Edit form */}
                  {editingUser === user.id && editingSettings && (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 bg-blue-50">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-medium text-gray-900">
                              Editing: {user.first_name || user.last_name 
                                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                : user.email}
                            </h4>
                          </div>

                          {/* Role Templates */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quick Role Assignment
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {Object.keys(roleTemplates).map((role) => (
                                <button
                                  key={role}
                                  onClick={() => applyRoleTemplate(role)}
                                  className={`px-3 py-1 text-sm rounded border ${
                                    editingSettings.role === role
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {role.replace('_', ' ').toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Custom Permissions */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Custom Permissions
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {Object.entries(editingSettings.permissions).map(([table, perms]) => (
                                <div key={table} className="bg-white p-4 rounded border">
                                  <h5 className="text-sm font-medium text-gray-900 mb-3 capitalize">
                                    {table.replace('_', ' ')}
                                  </h5>
                                  <div className="space-y-2">
                                    {Object.entries(perms).map(([action, enabled]) => (
                                      <label key={action} className="flex items-center">
                                        <input
                                          type="checkbox"
                                          checked={enabled}
                                          onChange={(e) => updatePermission(
                                            table as keyof AdminSettings['permissions'],
                                            action,
                                            e.target.checked
                                          )}
                                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700 capitalize">
                                          {action.replace('_', ' ')}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{startIndex + 1}</span>
                    {' '} to{' '}
                    <span className="font-medium">
                      {Math.min(endIndex, filteredUsers.length)}
                    </span>
                    {' '} of{' '}
                    <span className="font-medium">{filteredUsers.length}</span>
                    {' '} results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="h-5 w-5 transform rotate-90" />
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span
                            key={page}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                    
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="h-5 w-5 transform -rotate-90" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}