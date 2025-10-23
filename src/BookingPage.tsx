import React from 'react';
import UnifiedBookingFlow from './components/UnifiedBookingFlow';
import { Info } from 'lucide-react';

interface BookingPageProps {
  setCurrentPage: (page: string) => void;
}

function BookingPage({ setCurrentPage }: BookingPageProps) {
  const handleInfoClick = () => {
    setCurrentPage('helpdesk');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with Logo and Navigation */}
      <header className="px-4 sm:px-8 py-3 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center">
          <button onClick={() => setCurrentPage('home')}>
            <img src="/PRIVATECHARTER__18_-removebg-preview.png" alt="PrivateCharterX" className="h-12 w-auto hover:opacity-80 transition-opacity" />
          </button>
        </div>
        <nav className="hidden lg:flex items-center justify-center space-x-8 flex-1">
          <button
            onClick={() => setCurrentPage('services')}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Services
          </button>
          <button
            onClick={() => setCurrentPage('technology')}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Technology
          </button>
          <button
            onClick={() => setCurrentPage('aviation')}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Aviation
          </button>
          <button
            onClick={() => setCurrentPage('tokenized')}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Tokenized
          </button>
        </nav>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button className="border border-gray-200 text-gray-700 px-5 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors">
            Connect Wallet
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="bg-gray-900 text-white px-3 sm:px-5 py-2 rounded-md text-xs sm:text-sm hover:bg-gray-800 transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={handleInfoClick}
              className="w-7 h-7 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors ml-4"
              title="InfoCenter"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Complete Booking Flow */}
      <main className="px-4 py-6">
        <UnifiedBookingFlow />
      </main>
    </div>
  );
}

export default BookingPage;