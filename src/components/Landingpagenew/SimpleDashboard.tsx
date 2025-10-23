import React from 'react';

interface DashboardProps {
  setCurrentPage?: (page: string) => void;
}

const SimpleDashboard: React.FC<DashboardProps> = ({ setCurrentPage }) => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SaaS Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to your private charter management system</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Booking Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Book a Flight</h2>
            <p className="text-gray-600 mb-4">Start your private charter booking process</p>
            <button className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800">
              Start Booking
            </button>
          </div>

          {/* Empty Legs Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Empty Leg Offers</h2>
            <p className="text-gray-600 mb-4">Discounted flights available now</p>
            <button className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800">
              View Offers
            </button>
          </div>

          {/* Web3 Wallet Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Web3 Wallet</h2>
            <p className="text-gray-600 mb-4">Connect your crypto wallet</p>
            <button className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800">
              Connect Wallet
            </button>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2 lg:col-span-3">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Flight booking request submitted</span>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Wallet connected successfully</span>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboard;