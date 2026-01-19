import React from 'react';
import {
  Home,
  Users,
  Calendar,
  Plane,
  FileText,
  Shield,
  CreditCard,
  Settings,
  LogOut,
  Wallet,
  Globe,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../../contexts/CRM/AuthContext';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection }) => {
  const { user, logout } = useAuth();

  // RWS (Real World Services) menu items
  const rwsMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'users', label: 'Registered Users', icon: Users },
    { id: 'requests', label: 'User Requests', icon: FileText },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'emptylegs', label: 'Empty Legs', icon: Plane },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'kyc', label: 'KYC Verification', icon: Shield },
    { id: 'live-support', label: 'Live Support', icon: MessageCircle },
  ];

  // Web3.0 menu items
  const web3MenuItems = [
    { id: 'tokenization', label: 'Tokenization', icon: Wallet },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center">
            <img
              src="https://sgfnbormqiqgvhdfwmhz.supabase.co/storage/v1/object/public/logos//PrivatecharterX_logo_vectorized.png"
              alt="PrivatecharterX Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center hidden">
              <Plane className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-lg text-black">PrivatecharterX</h1>
            <p className="text-xs text-gray-500">Platform CRM</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-1">
          {/* RWS - Real World Services */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center">
              <Globe className="w-3 h-3 mr-1.5" />
              RWS - Real World
            </h3>
            {rwsMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeSection === item.id
                    ? 'bg-gray-100 text-black font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Web3.0 Services */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-3 flex items-center">
              <Wallet className="w-3 h-3 mr-1.5" />
              Web3.0 Services
            </h3>
            {web3MenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeSection === item.id
                    ? 'bg-purple-100 text-purple-700 font-medium'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* User info and logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {(user?.name?.[0] || 'A').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};
