// CharterAJet.jsx - Wrapper around UnifiedBookingFlow with custom branding
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Settings, User, Shield } from 'lucide-react';
import UnifiedBookingFlow from '../../components/UnifiedBookingFlow.tsx';

export default function CharterAJet() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-['DM_Sans']">
      {/* Custom Header */}
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
                  placeholder="Search"
                  className="w-64 pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 outline-none text-sm font-light placeholder-gray-400 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200 shadow-sm"
                />
              </div>

              <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200" title="Verified">
                <Shield size={16} />
              </button>

              <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200 relative" title="Basket">
                <ShoppingBag size={16} />
              </button>

              <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200" title="Connect Wallet">
                💰
              </button>

              <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200" title="Settings">
                <Settings size={16} />
              </button>

              <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200" title="Profile">
                <User size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* UnifiedBookingFlow Component - EXACT SAME AS ORIGINAL */}
      <UnifiedBookingFlow />

      {/* Divider Line */}
      <div className="border-t border-gray-200"></div>

      {/* Custom Footer */}
      <footer className="bg-gray-50 px-4 sm:px-8 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 mb-8 sm:mb-12">
            <div className="col-span-2 sm:col-span-1 lg:col-span-1">
              <button onClick={() => navigate('/')} className="mb-4">
                <img
                  src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
                  alt="PrivateCharterX"
                  className="h-12 w-auto hover:opacity-80 transition-opacity"
                />
              </button>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Blockchain-powered private aviation platform revolutionizing luxury travel.
              </p>
            </div>

            <div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-3 sm:mb-4">Aviation Services</h4>
              <div className="space-y-2 sm:space-y-3">
                <button onClick={() => navigate('/services')} className="block text-xs sm:text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">Private Jet Charter</button>
                <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Group Charter</button>
                <button onClick={() => navigate('/aviation')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Helicopter Charter</button>
                <button onClick={() => navigate('/aviation')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">eVTOL Flights</button>
                <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Adventure Packages</button>
                <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Empty Legs</button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Web3 & Digital</h4>
              <div className="space-y-3">
                <button onClick={() => navigate('/tokenized')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Web3</button>
                <button onClick={() => navigate('/tokenized')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">PVCX Token</button>
                <button onClick={() => navigate('/tokenized')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">NFT Aviation</button>
                <button onClick={() => navigate('/tokenized')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Asset Licensing</button>
                <button onClick={() => navigate('/tokenized')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">JetCard Packages</button>
                <button onClick={() => navigate('/tokenized')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">CO2 Certificates</button>
                <button onClick={() => navigate('/tokenized-assets')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Tokenized Assets</button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Partners & Press</h4>
              <div className="space-y-3">
                <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Partner With Us</button>
                <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Blog Posts</button>
                <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Press Center</button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Quick Links</h4>
              <div className="space-y-3">
                <button onClick={() => navigate('/')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Home</button>
                <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">How It Works</button>
                <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Helpdesk</button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
