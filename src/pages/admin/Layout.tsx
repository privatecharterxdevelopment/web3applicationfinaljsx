import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  FileCheck,
  Settings,
  Plane,
  BarChart3,
  UserCog,
  Mail,
  DollarSign,
  Handshake,
  Building2,
  Coins,
  MessageSquare,
  MessageCircle,
  CreditCard,
  ShoppingBag,
  Bell,
  TrendingUp,
  LogOut,
  Menu,
  X,
  ChevronLeft
} from 'lucide-react';
import AdminRoute from '../../components/AdminRoute';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';

// Check if using simple admin auth (session storage)
const isSimpleAdminAuth = () => sessionStorage.getItem('pvcx_admin_authenticated') === 'true';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
    isSuperAdmin: dbSuperAdmin,
    canManageBookings: dbCanManageBookings,
    canManageCO2Requests: dbCanManageCO2Requests,
    canManageUserRequests: dbCanManageUserRequests,
    canManageKYC: dbCanManageKYC
  } = useAdminPermissions();

  // If simple admin auth, grant all permissions
  const simpleAuth = isSimpleAdminAuth();
  const isSuperAdmin = simpleAuth || dbSuperAdmin;
  const canManageBookings = simpleAuth || dbCanManageBookings;
  const canManageCO2Requests = simpleAuth || dbCanManageCO2Requests;
  const canManageUserRequests = simpleAuth || dbCanManageUserRequests;
  const canManageKYC = simpleAuth || dbCanManageKYC;

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    sessionStorage.removeItem('pvcx_admin_authenticated');
    sessionStorage.removeItem('pvcx_admin_email');
    window.location.href = '/admin';
  };

  const navItems = [
    {
      path: '/admin/analytics',
      name: 'Analytics',
      icon: BarChart3,
      permission: true
    },
    {
      path: '/admin/earnings',
      name: 'Earnings',
      icon: TrendingUp,
      permission: isSuperAdmin
    },
    {
      path: '/admin/users',
      name: 'Users',
      icon: Users,
      permission: isSuperAdmin || canManageBookings
    },
    {
      path: '/admin/booking-requests',
      name: 'Booking Requests',
      icon: Plane,
      permission: canManageBookings
    },
    {
      path: '/admin/empty-legs',
      name: 'Empty Legs',
      icon: Plane,
      permission: canManageBookings || isSuperAdmin
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
      path: '/admin/partners',
      name: 'Partners',
      icon: Handshake,
      permission: canManageBookings || isSuperAdmin
    },
    {
      path: '/admin/transactions',
      name: 'Transactions',
      icon: DollarSign,
      permission: canManageBookings || isSuperAdmin
    },
    {
      path: '/admin/bookings',
      name: 'User Bookings',
      icon: ShoppingBag,
      permission: canManageBookings || isSuperAdmin
    },
    {
      path: '/admin/subscriptions',
      name: 'Subscriptions',
      icon: CreditCard,
      permission: isSuperAdmin
    },
    {
      path: '/admin/spv-formations',
      name: 'SPV Formations',
      icon: Building2,
      permission: isSuperAdmin
    },
    {
      path: '/admin/tokenization',
      name: 'Tokenization',
      icon: Coins,
      permission: isSuperAdmin
    },
    {
      path: '/admin/support-tickets',
      name: 'Support Tickets',
      icon: MessageSquare,
      permission: isSuperAdmin
    },
    {
      path: '/admin/chat-messages',
      name: 'Chat Messages',
      icon: MessageCircle,
      permission: isSuperAdmin
    },
    {
      path: '/admin/notifications',
      name: 'User Notifications',
      icon: Bell,
      permission: isSuperAdmin
    },
    {
      path: '/admin/management',
      name: 'Admin Management',
      icon: UserCog,
      permission: isSuperAdmin
    },
    {
      path: '/admin/newsletter',
      name: 'Newsletter',
      icon: Mail,
      permission: isSuperAdmin
    }
  ];

  // Get current page name
  const currentPage = navItems.find(item => item.path === location.pathname)?.name || 'Admin';

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} />
            </button>
            <span className="font-semibold text-gray-900">{currentPage}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div
          className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Mobile Sidebar Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <span className="font-bold text-lg">Admin Panel</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex-1 py-4 overflow-y-auto">
              <nav className="px-3 space-y-1">
                {navItems
                  .filter(item => item.permission)
                  .map(({ path, name, icon: Icon }) => (
                    <NavLink
                      key={path}
                      to={path}
                      className={({ isActive }) =>
                        `w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
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

            {/* Mobile Logout Button */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
          <div className="flex flex-col h-full">
            {/* Desktop Header */}
            <div className="px-6 py-5 border-b border-gray-200">
              <h1 className="font-bold text-lg">Admin Panel</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="flex-1 py-4 overflow-y-auto">
              <nav className="px-4 space-y-1">
                {navItems
                  .filter(item => item.permission)
                  .map(({ path, name, icon: Icon }) => (
                    <NavLink
                      key={path}
                      to={path}
                      className={({ isActive }) =>
                        `w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
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

            {/* Desktop Logout Button */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
