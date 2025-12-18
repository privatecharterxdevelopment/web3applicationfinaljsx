import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  X,
  Key,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/CRM/AuthContext';
import { useNotification } from '../../../contexts/CRM/NotificationContext';

interface Employee {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee' | 'sales';
  department: string | null;
  phone: string | null;
  hire_date: string | null;
  is_active: boolean;
  last_login: string | null;
  total_sales: number;
  created_at: string;
  updated_at: string;
}

export const EmployeeManagement: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'employee' | 'sales'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState('');

  const [newEmployeeData, setNewEmployeeData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'employee' as 'admin' | 'employee' | 'sales',
    department: '',
    phone: ''
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchEmployees();
    }
  }, [user]);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, roleFilter, statusFilter]);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('system_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setEmployees(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch employees');
      console.error('Error fetching employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(employee => employee.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(employee => 
        statusFilter === 'active' ? employee.is_active : !employee.is_active
      );
    }

    setFilteredEmployees(filtered);
  };

  const createEmployee = async () => {
    try {
      setIsLoading(true);
      setError('');

      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'create_user',
          userData: newEmployeeData
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      showSuccess('Success', `Employee ${newEmployeeData.name} has been created successfully`);
      setShowAddModal(false);
      setNewEmployeeData({
        email: '',
        password: '',
        name: '',
        role: 'employee',
        department: '',
        phone: ''
      });
      
      await fetchEmployees();
    } catch (err: any) {
      console.error('Create employee error:', err);
      
      // Enhanced error handling to extract specific error details
      let errorMessage = 'Failed to create employee';
      
      // Check if error has context property (from Supabase Edge Function)
      if (err.context) {
        try {
          const contextData = typeof err.context === 'string' ? JSON.parse(err.context) : err.context;
          if (contextData.error) {
            errorMessage = contextData.error;
          } else if (contextData.message) {
            errorMessage = contextData.message;
          }
        } catch (parseError) {
          console.error('Error parsing context:', parseError);
        }
      }
      
      // Check if error message contains specific information
      if (err.message) {
        if (err.message.includes('User already registered') || err.message.includes('already exists')) {
          errorMessage = `A user with email ${newEmployeeData.email} already exists`;
        } else if (err.message.includes('Invalid email')) {
          errorMessage = 'Please provide a valid email address';
        } else if (err.message.includes('Password')) {
          errorMessage = 'Password must be at least 6 characters long';
        } else if (err.message !== 'Failed to create employee') {
          errorMessage = err.message;
        }
      }
      
      // Check for specific HTTP status codes
      if (err.status) {
        switch (err.status) {
          case 400:
            errorMessage = 'Invalid request data. Please check all required fields.';
            break;
          case 401:
            errorMessage = 'You are not authorized to create employees.';
            break;
          case 403:
            errorMessage = 'Access denied. Admin privileges required.';
            break;
          case 409:
            errorMessage = `A user with email ${newEmployeeData.email} already exists`;
            break;
          case 422:
            errorMessage = 'Invalid data provided. Please check all fields.';
            break;
          case 500:
            errorMessage = 'Server error occurred. Please try again later.';
            break;
        }
      }
      
      setError(errorMessage);
      showError('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetEmployeePassword = async () => {
    if (!selectedEmployee) return;
    
    try {
      setIsLoading(true);
      setError('');

      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'reset_password',
          userId: selectedEmployee.id,
          newPassword
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      showSuccess('Success', `Password for ${selectedEmployee.name} has been reset`);
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedEmployee(null);
    } catch (err: any) {
      console.error('Password reset error:', err);
      
      // Enhanced error handling to extract specific error details from Edge Function
      let errorMessage = 'Failed to reset password';
      
      // Check if error has context property with body (from Supabase Edge Function)
      if (err.context && err.context.body) {
        try {
          const bodyData = typeof err.context.body === 'string' ? JSON.parse(err.context.body) : err.context.body;
          if (bodyData.error) {
            errorMessage = bodyData.error;
          } else if (bodyData.message) {
            errorMessage = bodyData.message;
          }
        } catch (parseError) {
          console.error('Error parsing context body:', parseError);
        }
      }
      
      // Check if error has context property (from Supabase Edge Function)
      if (err.context && !err.context.body) {
        try {
          const contextData = typeof err.context === 'string' ? JSON.parse(err.context) : err.context;
          if (contextData.error) {
            errorMessage = contextData.error;
          } else if (contextData.message) {
            errorMessage = contextData.message;
          }
        } catch (parseError) {
          console.error('Error parsing context:', parseError);
        }
      }
      
      // Check if error message contains specific information
      if (err.message && err.message !== 'Edge Function returned a non-2xx status code') {
        if (err.message.includes('User not found')) {
          errorMessage = 'Employee not found in the system';
        } else if (err.message.includes('Password')) {
          errorMessage = 'Password must be at least 6 characters long';
        } else if (err.message.includes('Invalid')) {
          errorMessage = 'Invalid request. Please check the data and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      // Check for specific HTTP status codes
      if (err.status) {
        switch (err.status) {
          case 400:
            errorMessage = 'Invalid request. Please check the password requirements.';
            break;
          case 401:
            errorMessage = 'You are not authorized to reset passwords.';
            break;
          case 403:
            errorMessage = 'Access denied. Admin privileges required.';
            break;
          case 404:
            errorMessage = 'Employee not found in the system.';
            break;
          case 422:
            errorMessage = 'Invalid password provided. Password must be at least 6 characters long.';
            break;
          case 500:
            errorMessage = 'Server error occurred. Please try again later.';
            break;
        }
      }
      
      setError(errorMessage);
      showError('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEmployeeStatus = async (employeeId: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'update_user_status',
          userId: employeeId,
          userData: { is_active: !currentStatus }
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      showSuccess('Success', `Employee status has been ${!currentStatus ? 'activated' : 'deactivated'}`);
      await fetchEmployees();
    } catch (err: any) {
      console.error('Error updating employee status:', err);
      setError('Failed to update employee status');
      showError('Error', 'Failed to update employee status');
    }
  };

  const deleteEmployee = async () => {
    if (!selectedEmployee) return;
    
    if (confirmDelete !== selectedEmployee.email) {
      showError('Error', 'Email confirmation does not match');
      return;
    }

    try {
      setIsLoading(true);
      
      // Only update the is_active status to false in system_users
      // This keeps the employee in the database but removes them from the dashboard
      const { error } = await supabase
        .from('system_users')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedEmployee.id);

      if (error) throw error;

      showSuccess('Success', `Employee ${selectedEmployee.name} has been removed from the dashboard`);
      setShowDeleteConfirmModal(false);
      setConfirmDelete('');
      setSelectedEmployee(null);
      await fetchEmployees();
    } catch (err: any) {
      console.error('Error removing employee:', err);
      setError('Failed to remove employee from dashboard');
      showError('Error', err.message || 'Failed to remove employee from dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading employees...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Employee Management</h1>
            <p className="text-gray-600">Manage employee accounts and access</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employees by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
                <option value="sales">Sales</option>
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{employees.length}</p>
          <p className="text-sm text-gray-500">Total Employees</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{employees.filter(e => e.is_active).length}</p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">{employees.filter(e => e.role === 'admin').length}</p>
          <p className="text-sm text-gray-500">Admins</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-black">
            ${employees.reduce((sum, e) => sum + e.total_sales, 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Total Sales</p>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Employee</th>
                <th className="text-left p-4 font-medium text-gray-700">Role</th>
                <th className="text-left p-4 font-medium text-gray-700">Department</th>
                <th className="text-left p-4 font-medium text-gray-700">Sales</th>
                <th className="text-left p-4 font-medium text-gray-700">Last Login</th>
                <th className="text-left p-4 font-medium text-gray-700">Status</th>
                <th className="text-left p-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-black">{employee.name}</p>
                        <p className="text-sm text-gray-500">{employee.email}</p>
                        {employee.phone && (
                          <p className="text-sm text-gray-500">{employee.phone}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      {employee.role === 'admin' ? (
                        <Shield className="w-4 h-4 text-blue-500" />
                      ) : (
                        <User className="w-4 h-4 text-gray-500" />
                      )}
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        employee.role === 'admin' 
                          ? 'bg-blue-100 text-blue-800' 
                          : employee.role === 'sales'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-gray-600">{employee.department || 'N/A'}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold">${employee.total_sales.toLocaleString()}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">
                      {employee.last_login 
                        ? new Date(employee.last_login).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      {employee.is_active ? (
                        <UserCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <UserX className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        employee.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setSelectedEmployee(employee)}
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setShowPasswordModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                        title="Reset Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => toggleEmployeeStatus(employee.id, employee.is_active)}
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                        title={employee.is_active ? "Deactivate Employee" : "Activate Employee"}
                      >
                        {employee.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setShowDeleteConfirmModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Add New Employee</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newEmployeeData.name}
                  onChange={(e) => setNewEmployeeData({ ...newEmployeeData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newEmployeeData.email}
                  onChange={(e) => setNewEmployeeData({ ...newEmployeeData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={newEmployeeData.password}
                  onChange={(e) => setNewEmployeeData({ ...newEmployeeData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={newEmployeeData.role}
                  onChange={(e) => setNewEmployeeData({ ...newEmployeeData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="employee">Employee</option>
                  <option value="sales">Sales</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={newEmployeeData.department}
                  onChange={(e) => setNewEmployeeData({ ...newEmployeeData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., Sales, Operations"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newEmployeeData.phone}
                  onChange={(e) => setNewEmployeeData({ ...newEmployeeData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createEmployee}
                disabled={!newEmployeeData.name || !newEmployeeData.email || !newEmployeeData.password || isLoading}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Reset Password</h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                }}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-start">
                <Lock className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  You are about to reset the password for <strong>{selectedEmployee.name}</strong> ({selectedEmployee.email}).
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                  minLength={6}
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={resetEmployeePassword}
                disabled={!newPassword || newPassword.length < 6 || isLoading}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Remove Employee</h2>
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setConfirmDelete('');
                }}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg flex items-start">
                <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Confirm employee removal</p>
                  <p className="text-sm mt-1">
                    You are about to remove <strong>{selectedEmployee.name}</strong> ({selectedEmployee.email}) 
                    from the dashboard. The employee will remain in the database but will be marked as inactive.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm by typing the employee's email address:
                </label>
                <input
                  type="text"
                  value={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder={selectedEmployee.email}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setConfirmDelete('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteEmployee}
                disabled={confirmDelete !== selectedEmployee.email || isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Removing...' : 'Remove Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {selectedEmployee && !showPasswordModal && !showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Employee Details</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedEmployee(null);
                    setShowPasswordModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-black transition-colors"
                  title="Reset Password"
                >
                  <Key className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedEmployee(null);
                    setShowDeleteConfirmModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove Employee"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-2 text-gray-400 hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-black">{selectedEmployee.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-black">{selectedEmployee.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium text-black capitalize">{selectedEmployee.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium text-black">{selectedEmployee.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <p className="font-medium text-black">${selectedEmployee.total_sales.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hire Date</p>
                  <p className="font-medium text-black">
                    {selectedEmployee.hire_date 
                      ? new Date(selectedEmployee.hire_date).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    selectedEmployee.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedEmployee.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Login</p>
                  <p className="font-medium text-black">
                    {selectedEmployee.last_login 
                      ? new Date(selectedEmployee.last_login).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};