import React from 'react';
import { 
  Home, 
  Users, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Plane, 
  Ship, 
  Zap, 
  Car,
  FileText,
  Bell,
  UserPlus,
  Activity,
  ShoppingBag,
  Building2,
  UserCog,
  CalendarDays,
  Mail,
  FolderOpen,
  LifeBuoy,
  Package,
  Layers,
  DollarSign,
  Map
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection }) => {
  const { user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'partners', label: 'Partners', icon: Building2 },
    { id: 'partner-map', label: 'Partner Map', icon: Map },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'support', label: 'Support', icon: LifeBuoy },
    { id: 'sales-crm', label: 'Sales CRM', icon: Building2, roles: ['admin', 'sales'] },
    { id: 'newsletter', label: 'Newsletter', icon: Mail, roles: ['admin', 'marketing'] },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'chat', label: 'Team Chat', icon: MessageSquare },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'accounting', label: 'Accounting', icon: DollarSign, roles: ['admin', 'accountant'] },
    { id: 'activity', label: 'Activity Monitor', icon: Activity, roles: ['admin'] },
    { id: 'storage', label: 'Storage', icon: FolderOpen },
  ];

  const serviceItems = [
    { id: 'jets', label: 'Private Jets', icon: Plane },
    { id: 'yachts', label: 'Yachts', icon: Ship },
    { id: 'helicopters', label: 'Helicopters', icon: Zap },
    { id: 'cars', label: 'Luxury Cars', icon: Car },
    { id: 'emptylegs', label: 'Empty Legs', icon: Activity },
    { id: 'fixedoffers', label: 'Fixed Offers', icon: Package },
    { id: 'multibooking', label: 'Multi-Booking', icon: Layers },
  ];

  const adminItems = [
    { id: 'users', label: 'User Management', icon: UserPlus },
    { id: 'employees', label: 'Employee Management', icon: UserCog },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(user?.role || '')
  );

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
                // Fallback to icon if image fails to load
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
            <p className="text-xs text-gray-500">CRM System</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-1">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Main Menu
            </h3>
            {filteredMenuItems.map((item) => (
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

          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Services
            </h3>
            {serviceItems.map((item) => (
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

          {user?.role === 'admin' && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Administration
              </h3>
              {adminItems.map((item) => (
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
          )}
        </nav>
      </div>
    </div>
  );
};