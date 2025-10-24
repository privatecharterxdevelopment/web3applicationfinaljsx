import React, { useState } from 'react';
import { 
  FileText, 
  Plane, 
  Leaf, 
  Shield, 
  BarChart3,
  Filter,
  Search,
  Download
} from 'lucide-react';
import { useAdminPermissions } from '../../../hooks/useAdminPermissions';
import BookingRequestManagement from './BookingRequestManagement';
import CO2CertificateManagement from './CO2CertificateManagement';
import UserRequestManagement from './UserRequestManagement';
import KYCVerificationManagement from './KYCVerificationManagement';
import AdminAnalytics from './AdminAnalytics';
import LoadingSpinner from '../../../components/LoadingSpinner';

type RequestTab = 'overview' | 'bookings' | 'co2' | 'user_requests' | 'kyc' | 'analytics';

interface TabConfig {
  id: RequestTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  requiredPermission?: {
    table: 'booking_requests' | 'co2_certificate_requests' | 'user_requests' | 'kyc_applications';
    action: string;
  };
}

const tabs: TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: BarChart3,
    description: 'System overview and quick stats'
  },
  {
    id: 'bookings',
    label: 'Booking Requests',
    icon: Plane,
    description: 'Manage flight booking requests',
    requiredPermission: { table: 'booking_requests', action: 'read' }
  },
  {
    id: 'co2',
    label: 'CO2 Certificates',
    icon: Leaf,
    description: 'Manage carbon offset certificate requests',
    requiredPermission: { table: 'co2_certificate_requests', action: 'read' }
  },
  {
    id: 'user_requests',
    label: 'User Requests',
    icon: FileText,
    description: 'Manage general user service requests',
    requiredPermission: { table: 'user_requests', action: 'read' }
  },
  {
    id: 'kyc',
    label: 'KYC Verification',
    icon: Shield,
    description: 'Manage KYC application reviews',
    requiredPermission: { table: 'kyc_applications', action: 'read' }
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Admin analytics and reporting'
  }
];

export default function RequestManagement() {
  const [activeTab, setActiveTab] = useState<RequestTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    isLoading,
    hasPermission,
    adminRole,
    isAdmin
  } = useAdminPermissions();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  // Filter tabs based on permissions
  const availableTabs = tabs.filter(tab => {
    if (!tab.requiredPermission) return true;
    return hasPermission(tab.requiredPermission.table, tab.requiredPermission.action);
  });

  // If current tab is not available, switch to overview
  if (!availableTabs.find(tab => tab.id === activeTab)) {
    setActiveTab('overview');
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminAnalytics />;
      case 'bookings':
        return <BookingRequestManagement />;
      case 'co2':
        return <CO2CertificateManagement />;
      case 'user_requests':
        return <UserRequestManagement />;
      case 'kyc':
        return <KYCVerificationManagement />;
      case 'analytics':
        return <AdminAnalytics />;
      default:
        return <AdminAnalytics />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Request Management</h1>
            <p className="mt-2 text-gray-600">
              Manage all request types from a unified dashboard
            </p>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {adminRole === 'super_admin' ? 'Super Admin' : `${adminRole.replace('_', ' ')} Admin`}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent w-64"
              />
            </div>
            
            {/* Export */}
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              <Download size={20} className="mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    isActive
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon
                    size={20}
                    className={`mr-2 ${
                      isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Description */}
      <div className="mb-6">
        {availableTabs.find(tab => tab.id === activeTab) && (
          <p className="text-gray-600">
            {availableTabs.find(tab => tab.id === activeTab)?.description}
          </p>
        )}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {renderTabContent()}
      </div>
    </div>
  );
}