import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminPermissions, AdminPermissions } from '../hooks/useAdminPermissions';
import LoadingSpinner from './LoadingSpinner';

interface AdminRouteProps {
  children: React.ReactNode;
  requirePermission?: {
    table: keyof AdminPermissions;
    action: string;
  };
  requireSuperAdmin?: boolean;
}

export default function AdminRoute({ 
  children, 
  requirePermission, 
  requireSuperAdmin = false 
}: AdminRouteProps) {
  const { isAuthenticated, initializing: authLoading, user } = useAuth();
  const { 
    isAdmin, 
    isSuperAdmin, 
    hasPermission, 
    isLoading: permissionsLoading,
    error,
    adminSettings
  } = useAdminPermissions();
  const location = useLocation();

  // Show loading spinner while checking auth and permissions
  if (authLoading || permissionsLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is admin at all
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Check super admin requirement
  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Check specific permission requirement
  if (requirePermission) {
    const { table, action } = requirePermission;
    if (!hasPermission(table, action)) {
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
}