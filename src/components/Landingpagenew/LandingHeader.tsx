import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Info } from 'lucide-react';

interface LandingHeaderProps {
  onGetStarted?: () => void;
  showInfoButton?: boolean;
}

export default function LandingHeader({ onGetStarted, showInfoButton = true }: LandingHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const defaultGetStarted = () => {
    navigate('/glas');
  };

  const handleGetStarted = onGetStarted || defaultGetStarted;

  // Helper to check if current page is active
  const isActivePage = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between max-w-6xl mx-auto">
      {/* Logo */}
      <div className="flex items-center">
        <button onClick={() => navigate('/')}>
          <img
            src="https://i.ibb.co/DPF5g3Sk/iu42DU1.png"
            alt="PrivateCharterX"
            className="h-20 w-auto hover:opacity-80 transition-opacity"
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
              onClick={() => navigate('/services')}
              className="w-7 h-7 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors ml-4"
              title="InfoCenter"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}