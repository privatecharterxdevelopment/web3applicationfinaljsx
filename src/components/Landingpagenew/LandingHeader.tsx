import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Info, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LandingHeaderProps {
  onGetStarted?: () => void;
  showInfoButton?: boolean;
}

export default function LandingHeader({ onGetStarted, showInfoButton = true }: LandingHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const isAuthenticated = auth?.isAuthenticated || false;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const defaultGetStarted = () => {
    navigate('/dashboard');
  };

  const handleGetStarted = onGetStarted || defaultGetStarted;

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  // Helper to check if current page is active
  const isActivePage = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/aviation', label: 'Aviation' },
    { path: '/flights', label: 'Flights' },
    { path: '/empty-legs', label: 'Empty Legs', badge: 'New' },
    { path: '/adventures', label: 'Adventures' },
    // Marketplace hidden - not ready, no license yet
    // { path: '/marketplace', label: 'Marketplace', badge: 'New' },
    { path: '/tokenized', label: 'RWA Tokenization' },
    { path: '/sphera-ai', label: 'Sphera AI' },
  ];

  return (
    <div className="sticky top-0 z-[100] w-full bg-white/50 backdrop-blur-xl border-b border-gray-200/30">
      <header className="px-4 sm:px-8 py-2 sm:py-3 flex items-center justify-between max-w-6xl mx-auto">
        {/* Logo */}
        <div className="flex items-center">
          <button onClick={() => navigate('/')}>
            <img
              src="https://i.ibb.co/DPF5g3Sk/iu42DU1.png"
              alt="PrivateCharterX"
              className="h-12 sm:h-16 w-auto hover:opacity-80 transition-opacity"
            />
          </button>
        </div>

        {/* Spacer for desktop */}
        <div className="hidden md:block flex-1" />

        {/* Right Side Actions */}
        <div className="flex items-center gap-2" ref={menuRef}>
          {/* Menu Toggle Button - Desktop: + icon with inline expanding menu to the LEFT */}
          <div className="hidden md:flex items-center gap-2 flex-row-reverse">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-9 h-9 bg-gray-200 text-gray-600 rounded-md flex items-center justify-center hover:bg-gray-300 transition-all duration-200"
            >
              <div className={`text-lg font-light transition-transform duration-300 ${isMenuOpen ? 'rotate-45' : ''}`}>
                +
              </div>
            </button>

            {/* Inline Expanding Navigation to the LEFT - Desktop */}
            <div className={`flex items-center gap-1 overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-w-[600px] opacity-100' : 'max-w-0 opacity-0'}`}>
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                  className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-all duration-200 border flex items-center gap-1.5 ${
                    isActivePage(item.path)
                      ? 'text-gray-900 font-medium bg-gray-100 border-gray-300'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {item.label}
                  {(item as any).badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-medium bg-green-500 text-white rounded-full">
                      {(item as any).badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-9 h-9 bg-gray-200 text-gray-600 rounded-md flex items-center justify-center hover:bg-gray-300 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Info Button (SECOND) */}
          {showInfoButton && (
            <button
              onClick={() => navigate('/helpdesk')}
              className="w-9 h-9 bg-gray-200 text-gray-600 rounded-md flex items-center justify-center hover:bg-gray-300 transition-colors"
              title="Helpdesk"
            >
              <Info className="w-4 h-4" />
            </button>
          )}

          {/* Get Started / Dashboard Button (THIRD - LAST) */}
          {isAuthenticated ? (
            <>
              {/* Dashboard Button with Green Pulse - only when logged in */}
              <button
                onClick={handleDashboardClick}
                className="bg-gray-900 text-white px-3 sm:px-5 py-2 rounded-md text-xs sm:text-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleGetStarted}
              className="bg-gray-900 text-white px-3 sm:px-5 py-2 rounded-md text-xs sm:text-sm hover:bg-gray-800 transition-colors"
            >
              +chat now
            </button>
          )}
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
        <nav className="flex flex-col px-4 pb-4 bg-white/95 backdrop-blur-md border-t border-gray-100">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
              className={`px-4 py-3 text-sm text-left border-b border-gray-100 last:border-b-0 transition-colors flex items-center justify-between ${
                isActivePage(item.path)
                  ? 'text-gray-900 font-medium bg-gray-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {item.label}
              {(item as any).badge && (
                <span className="px-2 py-0.5 text-[10px] font-medium bg-green-500 text-white rounded-full">
                  {(item as any).badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
