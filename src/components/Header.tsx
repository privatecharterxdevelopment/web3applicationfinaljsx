import React, { useState, useEffect, useCallback } from 'react';
import { Menu, X, Leaf, User, Wallet, ChevronDown, Plane, MapPin } from 'lucide-react';

// Import your actual components
import Logo from './Logo';
import UserMenu from './UserMenu';
import WalletMenu from './WalletMenu';
import ChatCounter from './ChatCounter';

// NavigationMenu with image-based layout + ALL your links
const NavigationMenu = () => (
  <div className="p-6">
    <div className="grid grid-cols-2 gap-12">
      
      {/* Left Column - Featured Services (matching image style) */}
      <div className="space-y-6">
        
        {/* Aviation Services */}
        <a href="/services/private-jet-charter" className="flex items-start gap-4 group cursor-pointer">
          <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
            <Plane size={20} className="text-gray-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Aviation Services</h3>
            <p className="text-sm text-gray-600">Private jets and helicopter charter</p>
          </div>
        </a>

        {/* CO₂ Certificates */}
        <a href="/web3/carbon-certificates" className="flex items-start gap-4 group cursor-pointer">
          <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
            <Leaf size={20} className="text-gray-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">CO₂ Certificates</h3>
            <p className="text-sm text-gray-600">Carbon offset and sustainability</p>
          </div>
        </a>

        {/* Tokenization - with arrow like Playoffs in image */}
        <a href="/dashboard" className="flex items-start gap-4 group cursor-pointer">
          <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
            <div className="w-5 h-5 bg-gray-700 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
          </div>
          <div className="flex items-center justify-between w-full">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Tokenization</h3>
              <p className="text-sm text-gray-600">Web3 assets and NFT aviation</p>
            </div>
            <div className="ml-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
          </div>
        </a>

        {/* Flight Map */}
        <a href="/map" className="flex items-start gap-4 group cursor-pointer">
          <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
            <MapPin size={20} className="text-gray-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Flight Map</h3>
            <p className="text-sm text-gray-600">Live tracking and route planning</p>
          </div>
        </a>

        {/* Marketplace */}
        <a href="/services/marketplace" className="flex items-start gap-4 group cursor-pointer">
          <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
            <div className="w-5 h-5 bg-gray-700 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Marketplace</h3>
            <p className="text-sm text-gray-600">Luxury travel experiences</p>
          </div>
        </a>

      </div>

      {/* Right Column - Browse Categories (ALL your navigation links) */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-6">Browse Categories</h4>
        <div className="space-y-4">
          
          {/* Services */}
          <a href="/services/private-jet-charter" className="block text-gray-600 hover:text-gray-900 transition-colors text-sm">
            Private Jet Charter
          </a>
          <a href="/services/group-charter" className="block text-gray-600 hover:text-gray-900 transition-colors text-sm">
            Group Charter
          </a>
          <a href="/services/helicopter-charter" className="block text-gray-600 hover:text-gray-900 transition-colors text-sm">
            Helicopter Charter
          </a>
          <a href="/pages/eVtolpage" className="block text-gray-600 hover:text-gray-900 transition-colors text-sm">
            eVTOL Flights
          </a>
          <a href="/fixed-offers" className="block text-gray-600 hover:text-gray-900 transition-colors text-sm">
            Adventure Packages
          </a>
          <a href="/empty-legs" className="block text-gray-600 hover:text-gray-900 transition-colors text-sm">
            Empty Legs
          </a>
          
          {/* Web3 */}
          <a href="/web3/ico" className="block text-gray-600 hover:text-gray-900 transition-colors text-sm">
            PVCX Token
          </a>
          <a href="/web3/nft-collection" className="block text-gray-600 hover:text-gray-900 transition-colors text-sm">
            NFT Aviation
          </a>
          <a href="/web3/asset-licensing" className="block text-gray-600 hover:text-gray-900 transition-colors text-sm">
            Asset Licensing
          </a>
          <a href="/web3/jetcard" className="block text-gray-600 hover:text-gray-900 transition-colors text-sm">
            JetCard Packages
          </a>
          
          {/* Company */}
          <a href="/how-it-works" className="block text-gray-600 hover:text-gray-900 transition-colors text-sm">
            How It Works
          </a>
          <a href="/behind-the-scene" className="block text-gray-600 hover:text-gray-900 transition-colors text-sm">
            About
          </a>
          <a href="/faq" className="block text-gray-600 hover:text-gray-900 transition-colors text-sm">
            FAQ
          </a>
          <a href="/contact" className="block text-gray-600 hover:text-gray-900 transition-colors text-sm">
            Support
          </a>
          <a href="/partners" className="block text-gray-600 hover:text-gray-900 transition-colors text-sm">
            Partners
          </a>
          <a href="/blogposts" className="block text-gray-600 hover:text-gray-900 transition-colors text-sm">
            Blog
          </a>

        </div>
      </div>
      
    </div>
  </div>
);



// Import actual hooks
import { useAuth } from '../context/AuthContext';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import WalletConnect from './WalletConnect';

export default function Header({ onShowDashboard, nftBenefits }) {
  const { isAuthenticated, user } = useAuth();
  const { isConnected, address } = useAccount();
  const { open } = useAppKit();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const handleLogout = useCallback(() => {
    console.log('User logged out');
  }, []);

  const handleShowDashboard = useCallback(() => {
    console.log('🚀 Opening dashboard...');
    if (onShowDashboard) {
      onShowDashboard();
    } else {
      // Navigate to dashboard page
      window.location.href = '/dashboard';
    }
  }, [onShowDashboard]);

  const handleWalletConnect = useCallback(() => {
    console.log('💳 Opening custom wallet connection modal');
    setShowWalletModal(true);
  }, []);

  const handleWalletConnected = useCallback((address: string) => {
    console.log('Wallet connected in header:', address);
    setShowWalletModal(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    } else {
      setIsMobileMenuOpen(true);
    }
  }, [isMobileMenuOpen]);

  const handleMouseLeave = useCallback(() => {
    const id = setTimeout(() => {
      setIsMobileMenuOpen(false);
    }, 2000);
    setTimeoutId(id);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');`}</style>

      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between py-4 px-6">

            {/* Left section - Logo only */}
            <div className="flex items-center">
              <Logo />
            </div>

            {/* Right section - Icons */}
            <div className="flex items-center gap-4">

              {/* Chat Counter (only show when authenticated) */}
              {isAuthenticated && <ChatCounter />}

              {/* Burger Menu */}
              <div
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                  aria-label="Toggle menu"
                >
                  <Menu size={20} />
                </button>

                {/* Dropdown Menu */}
                {isMobileMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-[600px] bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                    <NavigationMenu />
                  </div>
                )}
              </div>

              {/* User Menu with Dropdown */}
              <div className="relative">
                <UserMenu onLogout={handleLogout} onShowDashboard={handleShowDashboard} />
                {/* Green indicator when authenticated - positioned over the UserMenu */}
                {isAuthenticated && (
                  <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white pointer-events-none z-10"></div>
                )}
              </div>

              {/* Wallet Menu with Dropdown */}
              <div className="relative">
                <WalletMenu onConnect={handleWalletConnect} iconOnly={true} />
              </div>

              {/* Get Started Button */}
              {!isAuthenticated && (
                <button
                  onClick={handleShowDashboard}
                  className="bg-black text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-800 transition-colors duration-200 ml-2"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>


      </header>

      {/* Custom White Wallet Connection Modal */}
      <WalletConnect
        show={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={handleWalletConnected}
        onError={(error) => console.error('Header wallet connection error:', error)}
      />
    </>
  );
}
