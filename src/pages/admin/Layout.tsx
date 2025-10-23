import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Users, FileCheck, Settings, Plane, BarChart3, UserCog } from 'lucide-react';
import AdminRoute from '../../components/AdminRoute';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';

export default function AdminLayout() {
  const location = useLocation();
  const {
    isSuperAdmin,
    canManageBookings,
    canManageCO2Requests,
    canManageUserRequests,
    canManageKYC
  } = useAdminPermissions();

  const navItems = [
    {
      path: '/admin/analytics',
      name: 'Analytics',
      icon: BarChart3,
      permission: true
    },
    {
      path: '/admin/booking-requests',
      name: 'Booking Requests',
      icon: Plane,
      permission: canManageBookings
    },
    {
      path: '/admin/user-requests',
      name: 'User Requests',
      icon: Users,
      permission: canManageUserRequests
    },
    {
      path: '/admin/kyc-verification',
      name: 'KYC Verification',
      icon: FileCheck,
      permission: canManageKYC
    },
    {
      path: '/admin/co2-certificates',
      name: 'CO2 Certificates',
      icon: Settings,
      permission: canManageCO2Requests
    },
    {
      path: '/admin/management',
      name: 'Admin Management',
      icon: UserCog,
      permission: isSuperAdmin
    }
  ];

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
          <div className="flex flex-col h-full">
            <div className="flex-1 py-6 overflow-y-auto">
              <nav className="px-4 space-y-2">
                {navItems
                  .filter(item => item.permission)
                  .map(({ path, name, icon: Icon }) => (
                    <NavLink
                      key={path}
                      to={path}
                      className={({ isActive }) =>
                        `w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-black text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`
                      }
                    >
                      <Icon size={18} />
                      <span>{name}</span>
                    </NavLink>
                  ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="ml-64 p-8">
          <Outlet />
        </div>
      </div>
    </AdminRoute>
  );
}