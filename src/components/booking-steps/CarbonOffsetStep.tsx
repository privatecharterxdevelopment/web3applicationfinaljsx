// src/components/booking-steps/CarbonOffsetStep.tsx
import { useState, useEffect } from 'react';
import { Leaf, Wallet, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../LoginModal';
import RegisterModal from '../RegisterModal';
import ForgotPasswordModal from '../ForgotPasswordModal';
import { supabase } from '../../lib/supabase';

interface PaymentMethod {
  id: string;
  name: string;
  icon: any;
  fee: number;
}

interface Contact {
  name: string;
  email: string;
  phone: string;
  company: string;
}

interface CarbonOffsetStepProps {
  // Carbon options
  carbonOption: string;
  setCarbonOption: (option: string) => void;
  selectedAircraft: any;
  flightHours: number;
  formatPrice: (amount: number) => string;
  
  // Wallet connection
  isConnected: boolean;
  address?: string;
  walletAddress: string;
  setWalletAddress: (address: string) => void;
  connect: (options: { connector: any }) => void;
  connectors: any[];
  
  // Payment and contact
  paymentMethods: PaymentMethod[];
  selectedPayment: string;
  setSelectedPayment: (payment: string) => void;
  contact: Contact;
  setContact: (contact: Contact) => void;
}

export default function CarbonOffsetStep({
  carbonOption,
  setCarbonOption,
  selectedAircraft,
  flightHours,
  formatPrice,
  isConnected,
  address,
  walletAddress,
  setWalletAddress,
  connect,
  connectors,
  paymentMethods,
  selectedPayment,
  setSelectedPayment,
  contact,
  setContact
}: CarbonOffsetStepProps) {
  const { user, isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Fetch user profile data and pre-fill contact form when user logs in
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated && user) {
        setIsLoadingProfile(true);
        try {
          // Get user profile data for phone number
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('phone')
            .eq('user_id', user.id)
            .maybeSingle();

          // Pre-fill contact form with available data
          const fullName = user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}`.trim()
            : user.first_name || contact.name;
            
          setContact({
            name: fullName,
            email: user.email || contact.email,
            phone: profile?.phone || contact.phone,
            company: contact.company
          });
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Still pre-fill with basic user data if profile fetch fails
          const fullName = user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}`.trim()
            : user.first_name || contact.name;
            
          setContact({
            name: fullName,
            email: user.email || contact.email,
            phone: contact.phone,
            company: contact.company
          });
        } finally {
          setIsLoadingProfile(false);
        }
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, user, setContact]);

  const handleSwitchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
  };

  const handleRegisterSuccess = () => {
    setShowRegisterModal(false);
  };

  const handleSwitchToForgotPassword = () => {
    setShowLoginModal(false);
    setShowForgotPassword(true);
  };
  return (
    <div className="space-y-6 md:space-y-8 animate-slideIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Select Carbon Options</h3>
          <div className="space-y-3">
            <div
              onClick={() => setCarbonOption('none')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${carbonOption === 'none'
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Continue without offset</div>
                </div>
              </div>
            </div>

            <div
              onClick={() => setCarbonOption('full')}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${carbonOption === 'full'
                ? 'border-green-500 bg-green-50 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                : 'border-gray-200 hover:border-green-400'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Leaf size={20} className="text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">Carbon NFT Certificate</div>
                    <div className="text-sm text-gray-500">Blockchain verified offset</div>
                  </div>
                </div>
                <div className="font-medium">
                  {selectedAircraft ? formatPrice(Math.round(flightHours * selectedAircraft.co2OffsetPerHour)) : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Connection for NFT */}
          {carbonOption === 'full' && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-2">NFT Receiver Wallet</label>
                {isConnected ? (
                  <div className="space-y-3">
                    <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl">
                      <div className="text-xs text-gray-500">Connected Wallet</div>
                      <div className="font-mono text-sm text-gray-900 truncate">{address}</div>
                    </div>
                    <input
                      type="text"
                      placeholder="Or enter different wallet address"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      // Use the first available connector (usually MetaMask or WalletConnect)
                      if (connectors.length > 0) {
                        connect({ connector: connectors[0] });
                      } else {
                        console.error('No wallet connectors available');
                      }
                    }}
                    className="w-full px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Wallet size={18} />
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Payment & Contact</h3>

          {/* Payment Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>No payment required now!</strong> This is a request for quote. You'll receive pricing and payment details after we confirm availability.
            </p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3 mb-6">
            <label className="text-sm text-gray-600">Preferred Payment Method (for reference)</label>
            {paymentMethods.map(method => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${selectedPayment === method.id
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="text-gray-600" />
                    <span className="font-medium text-gray-900">{method.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {method.fee > 0 ? `+${method.fee}%` : 'No fee'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Authentication & Contact Form */}
          {!isAuthenticated ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <UserCircle size={20} className="text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">Login Required</p>
                </div>
                <p className="text-sm text-blue-800 mb-4">
                  Please sign in to your account to continue with booking. We'll pre-fill your contact details to make the process faster.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="flex-1 px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <UserCircle size={20} className="text-green-600" />
                  <p className="text-sm font-medium text-green-900">Signed in as {user?.first_name || user?.email}</p>
                </div>
                <p className="text-sm text-green-800">
                  {isLoadingProfile ? 'Loading your profile data...' : 'Your contact details have been pre-filled. You can edit them below if needed.'}
                </p>
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none focus:bg-white"
                  disabled={isLoadingProfile}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none focus:bg-white"
                  disabled={isLoadingProfile}
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none focus:bg-white"
                  disabled={isLoadingProfile}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Authentication Modals */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={handleSwitchToRegister}
          onSuccess={handleLoginSuccess}
          onSwitchToForgotPassword={handleSwitchToForgotPassword}
        />
      )}

      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={handleSwitchToLogin}
          onSuccess={handleRegisterSuccess}
        />
      )}

      {showForgotPassword && (
        <ForgotPasswordModal
          onClose={() => setShowForgotPassword(false)}
          onBackToLogin={() => {
            setShowForgotPassword(false);
            setShowLoginModal(true);
          }}
        />
      )}
    </div>
  );
}