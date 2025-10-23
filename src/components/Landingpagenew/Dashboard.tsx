import React, { useState } from 'react';
import {
  Home,
  Plane,
  Calendar,
  Users,
  Settings,
  Coins,
  TrendingUp,
  Shield,
  Award,
  ShoppingCart,
  Leaf,
  BarChart3,
  Bell,
  Search,
  User,
  Wallet,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface DashboardProps {
  setCurrentPage: (page: string) => void;
}

export default function Dashboard({ setCurrentPage }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome to your PrivateCharterX dashboard</p>
          </div>
          <button
            onClick={() => setCurrentPage('home')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Plane className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Flights</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Coins className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">PVCX Tokens</p>
                <p className="text-2xl font-bold text-gray-900">1,250</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Award className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">NFT Collection</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Leaf className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">CO2 Offset</p>
                <p className="text-2xl font-bold text-gray-900">45 tons</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <Plane className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Flight to Miami booked</p>
                  <p className="text-sm text-gray-600">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <Coins className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">PVCX tokens earned</p>
                  <p className="text-sm text-gray-600">1 day ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <Award className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">New NFT membership activated</p>
                  <p className="text-sm text-gray-600">3 days ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plane className="w-5 h-5" />
                <span>Book New Flight</span>
              </button>

              <button className="w-full flex items-center space-x-3 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Coins className="w-5 h-5" />
                <span>Swap Tokens</span>
              </button>

              <button className="w-full flex items-center space-x-3 p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Award className="w-5 h-5" />
                <span>View NFTs</span>
              </button>

              <button className="w-full flex items-center space-x-3 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}