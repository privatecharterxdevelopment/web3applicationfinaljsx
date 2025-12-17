import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminPermissions, AdminPermissions } from '../hooks/useAdminPermissions';
import LoadingSpinner from './LoadingSpinner';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

// Admin credentials (base64 encoded to hide from console/logs)
const ADMIN_EMAIL = atob('YnVpb2x1Y2VHdWxmc3RyZWFtZzcwMDMzODhAZ2dtYWlsLmNvbQ==');
const ADMIN_PASSWORD = atob('QXVmZGVtYmVzdGVud2VnMyVhdWZkZW1iZXN0ZW53ZWc2NiUu');

// Session storage key for admin auth
const ADMIN_AUTH_KEY = 'pvcx_admin_authenticated';

interface AdminRouteProps {
  children: React.ReactNode;
  requirePermission?: {
    table: keyof AdminPermissions;
    action: string;
  };
  requireSuperAdmin?: boolean;
}

// Admin Login Modal Component
function AdminLoginModal({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate brief loading
    await new Promise(resolve => setTimeout(resolve, 500));

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Store admin auth in session storage (clears when browser closes)
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      sessionStorage.setItem('pvcx_admin_email', email);
      onSuccess();
    } else {
      setError('Invalid admin credentials');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
          <p className="text-gray-500 mt-2">Enter your admin credentials to continue</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              'Access Admin Panel'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          PrivateCharterX Admin Panel
        </p>
      </div>
    </div>
  );
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

  // Check for simple admin auth (session storage)
  const [isSimpleAdminAuth, setIsSimpleAdminAuth] = useState<boolean | null>(null);

  useEffect(() => {
    // Check session storage for admin auth
    const adminAuth = sessionStorage.getItem(ADMIN_AUTH_KEY);
    setIsSimpleAdminAuth(adminAuth === 'true');
  }, []);

  // Show loading while checking auth
  if (isSimpleAdminAuth === null) {
    return <LoadingSpinner />;
  }

  // If simple admin auth is set, allow access
  if (isSimpleAdminAuth) {
    return <>{children}</>;
  }

  // Show loading spinner while checking regular auth and permissions
  if (authLoading || permissionsLoading) {
    return <LoadingSpinner />;
  }

  // Check if user has database admin permissions
  if (isAuthenticated && isAdmin) {
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

  // Show admin login modal for simple auth
  return (
    <AdminLoginModal
      onSuccess={() => {
        setIsSimpleAdminAuth(true);
        // Force re-render
        window.location.reload();
      }}
    />
  );
}
