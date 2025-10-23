import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../../thefinalwebapplicationpcx-main/src/context/AuthContext';

export interface AdminPermissions {
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
}

export interface AdminSettings {
  role: 'super_admin' | 'booking_admin' | 'kyc_admin' | 'co2_admin' | 'none';
  permissions: AdminPermissions;
}

export function useAdminPermissions() {
  const { user, isAuthenticated, initializing } = useAuth();
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If still initializing auth, keep loading
    if (initializing) {
      return;
    }
    
    // If not authenticated or no user after initialization, stop loading
    if (!isAuthenticated || !user) {
      setAdminSettings(null);
      setIsLoading(false);
      return;
    }

    // User is authenticated, fetch admin settings
    fetchAdminSettings();
  }, [user, isAuthenticated, initializing]);

  const fetchAdminSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('admin_settings')
        .select('settings')
        .eq('user_id', user?.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No admin settings found - user is not an admin
          console.log('No admin settings found for user:', user?.id);
          setAdminSettings(null);
        } else {
          console.error('Error fetching admin settings:', fetchError);
          throw fetchError;
        }
      } else {
        console.log('Admin settings loaded:', data.settings);
        setAdminSettings(data.settings as AdminSettings);
      }
    } catch (err) {
      console.error('Error fetching admin settings:', err);
      setError('Failed to load admin permissions');
      setAdminSettings(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to check specific permission
  const hasPermission = (table: keyof AdminPermissions, action: string): boolean => {
    if (!adminSettings) return false;
    
    const tablePermissions = adminSettings.permissions[table];
    if (!tablePermissions) return false;
    
    return Boolean((tablePermissions as any)[action]);
  };

  // Helper function to check if user is admin at all
  const isAdmin = Boolean(adminSettings && adminSettings.role !== 'none');

  // Helper function to check if user is super admin
  const isSuperAdmin = Boolean(adminSettings?.role === 'super_admin');


  // Helper function to get admin role
  const adminRole = adminSettings?.role || 'none';

  // Helper functions for specific permissions
  const canManageBookings = hasPermission('booking_requests', 'read');
  const canApprovBookings = hasPermission('booking_requests', 'approve');
  
  const canManageCO2Requests = hasPermission('co2_certificate_requests', 'read');
  const canAssignNGO = hasPermission('co2_certificate_requests', 'assign_ngo');
  
  const canManageUserRequests = hasPermission('user_requests', 'read');
  const canCompleteUserRequests = hasPermission('user_requests', 'complete');
  
  const canManageKYC = hasPermission('kyc_applications', 'read');
  const canApproveKYC = hasPermission('kyc_applications', 'approve');
  const canRejectKYC = hasPermission('kyc_applications', 'reject');

  return {
    // Core state
    adminSettings,
    isLoading,
    error,
    
    // Helper functions
    hasPermission,
    isAdmin,
    isSuperAdmin,
    adminRole,
    
    // Specific permission checks
    canManageBookings,
    canApprovBookings,
    canManageCO2Requests,
    canAssignNGO,
    canManageUserRequests,
    canCompleteUserRequests,
    canManageKYC,
    canApproveKYC,
    canRejectKYC,
    
    // Refresh function
    refetch: fetchAdminSettings,
  };
}