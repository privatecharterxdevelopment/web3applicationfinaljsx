// UserDashboardPage.tsx - Full Page User Dashboard matching tokenized-assets design
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, CreditCard, History, Settings, Bell, Plane, Coins, ArrowUpRight, Plus, Home } from 'lucide-react';
import { useAuth } from '../../../thefinalwebapplicationpcx-main/src/context/AuthContext';
import { useBalance, useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { PVCX_TOKEN_ADDRESS } from '../../lib/web3';
import { supabase } from '../../lib/supabase';
import AccountSettings from '../AccountSettings';
import FlightHistory from '../FlightHistory';
import PaymentMethods from '../PaymentMethods';
import TransactionHistory from '../TransactionHistory';
import RequestHistory from '../RequestHistory';
import AddFunds from '../AddFunds';
import TransferFunds from '../TransferFunds';

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated } = useAuth();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  const { data: ethBalance } = useBalance({ address });
  const { data: tokenBalance } = useBalance({
    address,
    token: PVCX_TOKEN_ADDRESS.sepolia
  });

  const [currentView, setCurrentView] = useState('overview');
  const [totalPVCXEarned, setTotalPVCXEarned] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Calculate total PVCX earned from flight history
    const calculateTotalPVCX = async () => {
      try {
        const { data: flights } = await supabase
          .from('flight_history')
          .select('distance')
          .eq('user_id', user?.id);

        if (flights) {
          const total = flights.reduce((sum, flight) => sum + (flight.distance * 1.5), 0);
          setTotalPVCXEarned(total);
        }
      } catch (error) {
        console.error('Error calculating PVCX:', error);
      }
    };

    if (user?.id) {
      calculateTotalPVCX();
    }
  }, [user?.id]);

  const renderView = () => {
    switch (currentView) {
      case 'settings':
        return <AccountSettings onBack={() => setCurrentView('overview')} />;
      case 'flightHistory':
        return <FlightHistory onBack={() => setCurrentView('overview')} />;
      case 'paymentMethods':
        return <PaymentMethods onBack={() => setCurrentView('overview')} />;
      case 'transactions':
        return <TransactionHistory onBack={() => setCurrentView('overview')} />;
      case 'requests':
        return <RequestHistory onBack={() => setCurrentView('overview')} />;
      case 'addFunds':
        return <AddFunds onBack={() => setCurrentView('overview')} />;
      case 'transfer':
        return <TransferFunds onBack={() => setCurrentView('overview')} />;
      default:
        return (
          <div className="space-y-6">
            {/* Account Overview Card */}
            <div className="bg-white rounded-lg border border-gray-300 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                  <img
                    src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
                    alt="Profile"
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{user?.name || 'User'}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Fiat Balance */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Available Balance</div>
                  <div className="text-3xl font-bold">€0.00</div>
                </div>

                {/* Crypto Balances */}
                <div>
                  <div className="text-sm font-medium mb-3">Crypto Assets</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                      <div className="text-xs text-gray-600 mb-1">ETH Balance</div>
                      <div className="text-lg font-bold text-gray-900">
                        {ethBalance?.formatted ? Number(ethBalance.formatted).toFixed(4) : '0.0000'} ETH
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                      <div className="text-xs text-gray-600 mb-1">PVCX Tokens</div>
                      <div className="text-lg font-bold text-gray-900">
                        {tokenBalance?.formatted ? Number(tokenBalance.formatted).toFixed(2) : '0.00'} PVCX
                      </div>
                    </div>
                  </div>
                </div>

                {/* PVCX Rewards */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Coins size={24} className="text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-base">PVCX Rewards</div>
                      <div className="text-xs text-gray-600">Total earned from flights</div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">{totalPVCXEarned.toFixed(2)} PVCX</div>
                  <div className="text-xs text-gray-600 mt-2">
                    Earn 1.5 PVCX per kilometer flown
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setCurrentView('addFunds')}
                className="bg-white rounded-lg border border-gray-300 p-5 hover:bg-gray-50 transition-colors text-center"
              >
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus size={24} className="text-white" />
                </div>
                <div className="font-semibold">Add Funds</div>
                <div className="text-xs text-gray-500 mt-1">Deposit money</div>
              </button>

              <button
                onClick={() => setCurrentView('transfer')}
                className="bg-white rounded-lg border border-gray-300 p-5 hover:bg-gray-50 transition-colors text-center"
              >
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowUpRight size={24} className="text-white" />
                </div>
                <div className="font-semibold">Send / Transfer</div>
                <div className="text-xs text-gray-500 mt-1">Send money</div>
              </button>
            </div>

            {/* Menu Items */}
            <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setCurrentView('paymentMethods')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={20} className="text-gray-700" />
                  <span className="font-medium">Payment Methods</span>
                </div>
              </button>

              <button
                onClick={() => setCurrentView('transactions')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <History size={20} className="text-gray-700" />
                  <span className="font-medium">Transaction History</span>
                </div>
              </button>

              <button
                onClick={() => setCurrentView('flightHistory')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <Plane size={20} className="text-gray-700" />
                  <span className="font-medium">Flight History</span>
                </div>
                <div className="text-sm text-gray-500">View all flights</div>
              </button>

              <button
                onClick={() => setCurrentView('requests')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <Bell size={20} className="text-gray-700" />
                  <span className="font-medium">Flight Requests</span>
                </div>
                <div className="text-sm text-gray-500">Manage requests</div>
              </button>

              <button
                onClick={() => setCurrentView('settings')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings size={20} className="text-gray-700" />
                  <span className="font-medium">Account Settings</span>
                </div>
                <div className="text-sm text-gray-500">Manage your account</div>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['DM_Sans']">
      {/* Header */}
      <header className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/')}>
                <img
                  src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
                  alt="PrivateCharterX"
                  className="h-8 w-auto"
                />
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search dashboard"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 outline-none text-sm font-light placeholder-gray-400 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200 shadow-sm"
                />
              </div>

              <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200" title="Verified">
                <Shield size={16} />
              </button>

              {/* Rectangular Connect Wallet Button */}
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                  </div>
                  <button
                    onClick={() => disconnect()}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors shadow-sm"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => open()}
                  className="px-5 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Connect Wallet
                </button>
              )}

              {/* User Avatar with Logo */}
              <div className="w-10 h-10 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center">
                <img
                  src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
                  alt="User"
                  className="w-full h-full object-contain p-1"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex space-x-8">
            <button
              onClick={() => navigate('/tokenized-assets')}
              className="py-4 text-sm text-gray-600 border-b-2 border-transparent hover:text-black"
            >
              ← Back to Marketplace
            </button>
            <button className="py-4 text-sm text-black border-b-2 border-black flex items-center gap-2">
              <Home size={16} />
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-5 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="col-span-2">
            {currentView !== 'overview' && (
              <div className="mb-4">
                <button
                  onClick={() => setCurrentView('overview')}
                  className="text-sm text-gray-600 hover:text-black flex items-center gap-2"
                >
                  ← Back to Overview
                </button>
              </div>
            )}
            {renderView()}
          </div>

          {/* Sidebar - Account Info */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg border border-gray-300 p-5 sticky top-6">
              <h3 className="text-base font-semibold mb-4">Account Info</h3>

              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Account Status</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Active</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Member Since</div>
                  <div className="text-sm font-medium">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Total Flights</div>
                  <div className="text-sm font-medium">0</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Wallet Connection</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                    <span className="text-sm font-medium">{isConnected ? 'Connected' : 'Not Connected'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate('/tokenized-assets')}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Browse Marketplace
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
