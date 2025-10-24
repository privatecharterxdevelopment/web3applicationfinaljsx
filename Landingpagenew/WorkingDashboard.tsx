import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
  History,
  Settings,
  Wallet,
  LogOut,
  CheckCircle,
  AlertCircle,
  X,
  ExternalLink,
  Home,
  FileText,
  RefreshCw,
  Loader2,
  Globe,
  User,
  Shield,
  Copy,
  Check,
  Link,
  Download,
  Plane,
  Zap,
  Car,
  Eye,
  Upload,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  CreditCard,
  FileCheck,
  Coins,
  Award,
  Leaf,
  Percent,
  Star,
  Gift,
  Wifi,
  WifiOff,
  Plus,
  Filter,
  Search,
  Grid,
  List,
  TrendingUp,
  Send,
  Sparkles,
  Fuel,
  ToggleLeft,
  ChevronLeft,
  Building2,
  Bitcoin,
  ArrowUpDown,
  Briefcase
} from 'lucide-react';

interface DashboardProps {
  setCurrentPage?: (page: string) => void;
}

const WorkingDashboard: React.FC<DashboardProps> = ({ setCurrentPage }) => {
  const { user, isAuthenticated } = useAuth();

  // Core dashboard state
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [fundsExpanded, setFundsExpanded] = useState(false);
  const [tokenizationExpanded, setTokenizationExpanded] = useState(false);
  const [marketplaceExpanded, setMarketplaceExpanded] = useState(false);

  // Navigation items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home, expandable: false },
    {
      id: 'services',
      label: 'Charter Services',
      icon: Plane,
      expandable: true,
      children: [
        { id: 'book-flight', label: 'Book Flight' },
        { id: 'empty-legs', label: 'Empty Legs' },
        { id: 'fixed-offers', label: 'Fixed Offers' },
        { id: 'luxury-cars', label: 'Luxury Cars' }
      ]
    },
    { id: 'wallet', label: 'Web3 Wallet', icon: Wallet, expandable: false },
    { id: 'marketplace', label: 'Marketplace', icon: Globe, expandable: true },
    { id: 'settings', label: 'Settings', icon: Settings, expandable: false }
  ];

  const renderMainContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="p-8">
            <h1 className="text-4xl font-light text-gray-900 mb-8">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl cursor-pointer hover:shadow-lg transition-all"
                   onClick={() => setActiveSection('book-flight')}>
                <div className="flex items-center mb-4">
                  <Plane className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold text-blue-900">Book a Flight</h3>
                </div>
                <p className="text-blue-700">Start your private charter booking process</p>
                <ArrowRight className="w-5 h-5 text-blue-600 mt-4" />
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl cursor-pointer hover:shadow-lg transition-all"
                   onClick={() => setActiveSection('empty-legs')}>
                <div className="flex items-center mb-4">
                  <Clock className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="text-xl font-semibold text-green-900">Empty Leg Offers</h3>
                </div>
                <p className="text-green-700">Discounted flights on return journeys</p>
                <ArrowRight className="w-5 h-5 text-green-600 mt-4" />
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl cursor-pointer hover:shadow-lg transition-all"
                   onClick={() => setActiveSection('wallet')}>
                <div className="flex items-center mb-4">
                  <Wallet className="w-8 h-8 text-purple-600 mr-3" />
                  <h3 className="text-xl font-semibold text-purple-900">Web3 Wallet</h3>
                </div>
                <p className="text-purple-700">Connect your crypto wallet for payments</p>
                <ArrowRight className="w-5 h-5 text-purple-600 mt-4" />
              </div>
            </div>

            <div className="mt-8 p-6 bg-gray-50 rounded-xl">
              <h2 className="text-2xl font-semibold mb-4">Welcome to Your Dashboard</h2>
              <p className="text-green-600 text-lg">✅ Your 7-week dashboard is now loading step by step!</p>
              <p className="text-gray-600 mt-2">Current section: {activeSection}</p>
              {isAuthenticated && user && (
                <p className="text-blue-600 mt-2">Logged in as: {user.email}</p>
              )}
            </div>
          </div>
        );

      case 'book-flight':
        return (
          <div className="p-8">
            <h1 className="text-4xl font-light text-gray-900 mb-8">Book a Flight</h1>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-600 mb-4">Flight booking functionality will be restored here.</p>
              <button
                onClick={() => setActiveSection('overview')}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                ← Back to Overview
              </button>
            </div>
          </div>
        );

      case 'empty-legs':
        return (
          <div className="p-8">
            <h1 className="text-4xl font-light text-gray-900 mb-8">Empty Leg Offers</h1>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-600 mb-4">Empty leg offers will be shown here.</p>
              <button
                onClick={() => setActiveSection('overview')}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                ← Back to Overview
              </button>
            </div>
          </div>
        );

      case 'wallet':
        return (
          <div className="p-8">
            <h1 className="text-4xl font-light text-gray-900 mb-8">Web3 Wallet</h1>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-600 mb-4">Web3 wallet connection will be restored here.</p>
              <button
                onClick={() => setActiveSection('overview')}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                ← Back to Overview
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-8">
            <h1 className="text-4xl font-light text-gray-900 mb-8">Dashboard</h1>
            <p className="text-gray-600">Section: {activeSection}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6 h-screen flex gap-6">
        {/* Expandable Sidebar */}
        <div className={`${sidebarExpanded ? 'w-72' : 'w-20'} h-full flex flex-col items-center justify-between py-4 overflow-hidden transition-all duration-300`}>
          <div className="flex flex-col items-center space-y-1 flex-1 w-full">
            {/* Logo */}
            <div className={`${sidebarExpanded ? 'w-full h-20' : 'w-12 h-12'} flex items-center justify-center flex-shrink-0 mb-1`}>
              {sidebarExpanded ? (
                <img
                  src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
                  alt="PrivateCharterX"
                  className="h-16 w-auto object-contain"
                />
              ) : (
                <img
                  src="https://i.imgur.com/iu42DU1.png"
                  alt="PrivateCharterX"
                  className="w-12 h-12 object-contain"
                />
              )}
            </div>

            {/* Navigation Items */}
            {navItems.map((item, index) => (
              <div key={index} className="w-full px-3">
                {index > 0 && sidebarExpanded && <div className="border-t border-gray-100 mb-1"></div>}

                <button
                  onClick={() => {
                    setActiveSection(item.id);
                    if (item.expandable) {
                      if (item.id === 'services') {
                        setServicesExpanded(!servicesExpanded);
                      } else if (item.id === 'marketplace') {
                        setMarketplaceExpanded(!marketplaceExpanded);
                      }
                    }
                  }}
                  className={`${sidebarExpanded ? 'w-full justify-between px-4' : 'w-12 h-10 justify-center mx-auto'} h-10 rounded-lg flex items-center transition-all duration-300 ${
                    activeSection === item.id || (item.children && item.children.some(child => child.id === activeSection))
                      ? 'bg-black text-white shadow-lg'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                  }`}
                  title={!sidebarExpanded ? item.label : undefined}
                >
                  <div className="flex items-center">
                    <item.icon size={18} className={sidebarExpanded ? 'mr-4' : ''} />
                    {sidebarExpanded && (
                      <span className="text-sm font-light tracking-wide">{item.label}</span>
                    )}
                  </div>
                  {item.expandable && sidebarExpanded && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-300 ${
                        (item.id === 'services' && servicesExpanded) ||
                        (item.id === 'marketplace' && marketplaceExpanded) ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>

                {/* Expandable Children */}
                {item.expandable && item.children && sidebarExpanded && (
                  <div className={`overflow-hidden transition-all duration-300 ${
                    (item.id === 'services' && servicesExpanded) ||
                    (item.id === 'marketplace' && marketplaceExpanded)
                      ? 'max-h-96 mt-1' : 'max-h-0'
                  }`}>
                    <div className="space-y-0.5 pl-4">
                      {item.children.map((child, childIndex) => (
                        <button
                          key={childIndex}
                          onClick={() => setActiveSection(child.id)}
                          className={`w-full text-left px-3 py-1.5 rounded-md text-sm font-light tracking-wide transition-all duration-200 ${
                            activeSection === child.id
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sidebar Toggle */}
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarExpanded ? <ChevronLeft size={20} /> : <ArrowRight size={20} />}
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};

export default WorkingDashboard;