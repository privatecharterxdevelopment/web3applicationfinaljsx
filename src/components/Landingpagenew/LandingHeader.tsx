import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from 'wagmi';

interface LandingHeaderProps {
  onGetStarted?: () => void;
  showInfoButton?: boolean;
}

export default function LandingHeader({ onGetStarted, showInfoButton = true }: LandingHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const isAuthenticated = auth?.isAuthenticated || false;
  const { address, isConnected } = useAccount();

  // Shorten wallet address for display
  const shortenAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const defaultGetStarted = () => {
    navigate('/dashboard');
  };

  const handleGetStarted = onGetStarted || defaultGetStarted;

  const handleDashboardClick = () => {
    navigate('/glasdashboard');
  };

  // Helper to check if current page is active
  const isActivePage = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="px-4 sm:px-8 py-2 sm:py-3 flex items-center justify-between max-w-6xl mx-auto">
      {/* Logo */}
      <div className="flex items-center">
        <button onClick={() => navigate('/')}>
          <img
            src="https://i.ibb.co/DPF5g3Sk/iu42DU1.png"
            alt="PrivateCharterX"
            className="h-16 w-auto hover:opacity-80 transition-opacity"
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="hidden lg:flex items-center justify-center space-x-6 xl:space-x-10 flex-1">
        <button
          onClick={() => navigate('/services')}
          className={`text-sm transition-colors ${
            isActivePage('/services')
              ? 'text-gray-900 font-medium'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Services
        </button>
        <button
          onClick={() => navigate('/technology')}
          className={`text-sm transition-colors ${
            isActivePage('/technology')
              ? 'text-gray-900 font-medium'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Technology
        </button>
        <button
          onClick={() => navigate('/aviation')}
          className={`text-sm transition-colors ${
            isActivePage('/aviation')
              ? 'text-gray-900 font-medium'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Aviation
        </button>
        <button
          onClick={() => navigate('/tokenized')}
          className={`text-sm transition-colors ${
            isActivePage('/tokenized')
              ? 'text-gray-900 font-medium'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Tokenized
        </button>
      </nav>

      {/* Right Side Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {isAuthenticated ? (
          <>
            {/* Connected Wallet Address */}
            <button className="border border-gray-200 text-gray-700 px-5 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {isConnected && address ? shortenAddress(address) : 'Wallet'}
            </button>
            {/* Dashboard Button with Green Pulse */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDashboardClick}
                className="bg-gray-900 text-white px-3 sm:px-5 py-2 rounded-md text-xs sm:text-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Dashboard
              </button>
              {showInfoButton && (
                <button
                  onClick={() => navigate('/helpdesk')}
                  className="w-7 h-7 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors ml-4"
                  title="Helpdesk"
                >
                  <Info className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Connect Wallet - Not Authenticated */}
            <button className="border border-gray-200 text-gray-700 px-5 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors">
              Connect Wallet
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleGetStarted}
                className="bg-gray-900 text-white px-3 sm:px-5 py-2 rounded-md text-xs sm:text-sm hover:bg-gray-800 transition-colors"
              >
                Get Started
              </button>
              {showInfoButton && (
                <button
                  onClick={() => navigate('/helpdesk')}
                  className="w-7 h-7 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors ml-4"
                  title="Helpdesk"
                >
                  <Info className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}