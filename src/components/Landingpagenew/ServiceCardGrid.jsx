import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  History,
  Leaf,
  Wallet,
  MessageCircle,
  Shield,
  User,
  Plane,
  Calendar,
  Car,
  Globe,
  Award,
  Settings
} from 'lucide-react';

// Service cards configuration
const serviceCards = [
  {
    id: 'overview',
    title: 'Overview',
    description: 'View your account summary',
    icon: Home,
    color: 'from-blue-500 to-indigo-600',
    link: '/dashboard'
  },
  {
    id: 'my-requests',
    title: 'My Requests',
    description: 'Track your booking requests',
    icon: History,
    color: 'from-purple-500 to-pink-600',
    link: '/dashboard'
  },
  {
    id: 'co2-certificates',
    title: 'CO2 Certificates',
    description: 'Carbon offset programs',
    icon: Leaf,
    color: 'from-green-500 to-emerald-600',
    link: '/dashboard'
  },
  {
    id: 'wallet-nfts',
    title: 'Wallet & NFTs',
    description: 'Your digital assets',
    icon: Wallet,
    color: 'from-yellow-500 to-orange-600',
    link: '/dashboard'
  },
  {
    id: 'private-jets',
    title: 'Private Jets',
    description: 'Book exclusive flights',
    icon: Plane,
    color: 'from-indigo-500 to-blue-600',
    link: '/tokenized-assets'
  },
  {
    id: 'empty-legs',
    title: 'Empty Legs',
    description: 'Discounted flight deals',
    icon: Calendar,
    color: 'from-rose-500 to-red-600',
    link: '/tokenized-assets'
  },
  {
    id: 'luxury-cars',
    title: 'Luxury Cars',
    description: 'Premium car rentals',
    icon: Car,
    color: 'from-gray-700 to-gray-900',
    link: '/tokenized-assets'
  },
  {
    id: 'adventures',
    title: 'Adventures',
    description: 'Exclusive travel packages',
    icon: Globe,
    color: 'from-teal-500 to-cyan-600',
    link: '/tokenized-assets'
  },
  {
    id: 'chat-support',
    title: 'Chat Support',
    description: 'Get instant assistance',
    icon: MessageCircle,
    color: 'from-pink-500 to-rose-600',
    link: '/dashboard'
  },
  {
    id: 'kyc-verification',
    title: 'KYC Verification',
    description: 'Verify your identity',
    icon: Shield,
    color: 'from-amber-500 to-yellow-600',
    link: '/dashboard'
  },
  {
    id: 'profile',
    title: 'Profile Settings',
    description: 'Manage your account',
    icon: User,
    color: 'from-violet-500 to-purple-600',
    link: '/dashboard'
  },
  {
    id: 'memberships',
    title: 'NFT Memberships',
    description: 'Exclusive member benefits',
    icon: Award,
    color: 'from-fuchsia-500 to-pink-600',
    link: '/tokenized-assets'
  }
];

const ServiceCardGrid = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCardClick = (card) => {
    navigate(card.link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Greeting Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter mb-3">
            Good evening, {user?.first_name || user?.name || 'Iqbal'}
          </h1>
          <p className="text-gray-600 font-light">How can I help you?</p>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {serviceCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 hover:border-gray-200 text-left overflow-hidden"
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-14 h-14 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={24} className="text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Arrow indicator on hover */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ServiceCardGrid;
