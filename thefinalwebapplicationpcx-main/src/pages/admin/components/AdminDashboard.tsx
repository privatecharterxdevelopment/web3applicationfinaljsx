import React, { useState } from 'react';
import { Users, FileCheck, Settings, Plane, Tag, BarChart3, UserCog } from 'lucide-react';
import BookingRequestManagement from './BookingRequestManagement';
import CO2CertificateManagement from './CO2CertificateManagement';
import KYCVerificationManagement from './KYCVerificationManagement';
import UserRequestManagement from './UserRequestManagement';
import AdminAnalytics from './AdminAnalytics';
import AdminManagement from './AdminManagement';
import { useAdminPermissions } from '../../../hooks/useAdminPermissions';

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState('analytics');
  const {
    isSuperAdmin,
    canManageBookings,
    canManageCO2Requests,
    canManageUserRequests,
    canManageKYC
  } = useAdminPermissions();

  const renderView = () => {
    switch (activeView) {
      case 'users':
        return <UserRequestManagement />;
      case 'documents':
        return <KYCVerificationManagement />;
      case 'co2':
        return <CO2CertificateManagement />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'bookings':
        return <BookingRequestManagement />;
      case 'admin_management':
        return <AdminManagement />;
      default:
        return <AdminAnalytics />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          <div className="flex-1 py-6 overflow-y-auto">
            <nav className="px-4 space-y-2">
              <button
                onClick={() => setActiveView('analytics')}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'analytics' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <BarChart3 size={18} />
                <span>Analytics</span>
              </button>

              {canManageBookings && (
                <button
                  onClick={() => setActiveView('bookings')}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'bookings' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Plane size={18} />
                  <span>Booking Requests</span>
                </button>
              )}

              {canManageUserRequests && (
                <button
                  onClick={() => setActiveView('users')}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'users' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Users size={18} />
                  <span>User Requests</span>
                </button>
              )}

              {canManageKYC && (
                <button
                  onClick={() => setActiveView('documents')}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'documents' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <FileCheck size={18} />
                  <span>KYC Verification</span>
                </button>
              )}

              {canManageCO2Requests && (
                <button
                  onClick={() => setActiveView('co2')}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'co2' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Settings size={18} />
                  <span>CO2 Certificates</span>
                </button>
              )}

              {isSuperAdmin && (
                <button
                  onClick={() => setActiveView('admin_management')}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'admin_management' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <UserCog size={18} />
                  <span>Admin Management</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {renderView()}
      </div>
    </div>
  );
}