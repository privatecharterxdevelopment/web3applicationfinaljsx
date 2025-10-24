import React, { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  LogOut,
  Shield,
  Wallet,
  FileText,
  UserPlus,
  LogIn,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  X,
  Menu,
  Loader2,
  Leaf,
  Home,
  History,
  Key,
  CreditCard,
  Gem,
  Users,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAdminPermissions } from '../hooks/useAdminPermissions';
import Dashboard from './Dashboard';
import Portal from './Portal';
import LoginModal from './LoginModalNew';
import RegisterModal from './RegisterModalNew';
import ForgotPasswordModal from './ForgotPasswordModal';
import ChangePasswordModal from './ChangePasswordModal';

interface UserMenuProps {
  onLogout?: () => void;
  onShowDashboard?: () => void;
}

interface SuccessMessage {
  type: 'login' | 'register' | 'logout';
  message: string;
}

function UserMenu({ onLogout }: UserMenuProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut, isAdmin, initializing } = useAuth();
  const { isAdmin: isAdminNew, isLoading: adminLoading } = useAdminPermissions();

  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardTab, setDashboardTab] = useState('overview');
  const [successMessage, setSuccessMessage] = useState<SuccessMessage | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  const handleLoginSuccess = () => {
    setSuccessMessage({
      type: 'login',
      message: 'Welcome back! You have been successfully logged in.'
    });
    
    setTimeout(() => setSuccessMessage(null), 3000);
    
    setShowLoginModal(false);
  };

  const handleRegisterSuccess = () => {
    setSuccessMessage({
      type: 'register',
      message: 'Account created successfully! Welcome to PrivateCharterX.'
    });
    
    setTimeout(() => setSuccessMessage(null), 3000);
    
    setShowRegisterModal(false);
  };

  const openLoginModal = () => {
    setIsOpen(false);
    setShowLoginModal(true);
  };

  const openRegisterModal = () => {
    setIsOpen(false);
    setShowRegisterModal(true);
  };

  const switchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const switchToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const openDashboard = (tab: string = 'overview') => {
    setIsOpen(false);
    // Store the tab to open, then navigate to tokenized-assets
    sessionStorage.setItem('dashboardTab', tab);
    navigate('/tokenized-assets');
  };

  const openChangePassword = () => {
    setIsOpen(false);
    setShowChangePassword(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsOpen(false);
    
    try {
      await signOut();
      
      setSuccessMessage({
        type: 'logout',
        message: 'You have been successfully logged out.'
      });
      
      setTimeout(() => setSuccessMessage(null), 3000);
      
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (initializing) {
    return (
      <div className="user-menu relative">
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
          <Loader2 size={16} className="animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="user-menu relative">
        {isAuthenticated && user ? (
          <>
            {/* Authenticated User Menu */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white text-sm font-medium">
                {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-900 max-w-[120px] truncate">
                {user.first_name ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}` : user.email?.split('@')[0]}
              </span>
              {isOpen ? (
                <ChevronUp size={16} className="text-gray-500" />
              ) : (
                <ChevronDown size={16} className="text-gray-500" />
              )}
            </button>

{isOpen && (
              <>
                {/* Desktop Dropdown */}
                <div className="hidden md:block absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white font-medium">
                        {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.first_name ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}` : 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => openDashboard('overview')}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Home size={16} className="mr-3 text-gray-400" />
                      Dashboard
                    </button>

                    <button
                      onClick={() => openDashboard('requests')}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <History size={16} className="mr-3 text-gray-400" />
                      My Requests
                    </button>

                    <button
                      onClick={() => openDashboard('transactions')}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <CreditCard size={16} className="mr-3 text-gray-400" />
                      Transactions
                    </button>

                    <button
                      onClick={() => openDashboard('tokenized-assets')}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Gem size={16} className="mr-3 text-gray-400" />
                      Tokenized Assets
                    </button>

                    <button
                      onClick={() => openDashboard('dao')}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Users size={16} className="mr-3 text-gray-400" />
                      DAO
                    </button>

                    <button
                      onClick={() => openDashboard('co2-certificates')}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Leaf size={16} className="mr-3 text-gray-400" />
                      CO2 Certificates
                    </button>

                    <button
                      onClick={() => openDashboard('chat-support')}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <MessageCircle size={16} className="mr-3 text-gray-400" />
                      Chat Support
                    </button>

                    <button
                      onClick={() => openDashboard('wallet')}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Wallet size={16} className="mr-3 text-gray-400" />
                      Wallet & NFTs
                    </button>

                    <button
                      onClick={() => openDashboard('kyc')}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Shield size={16} className="mr-3 text-gray-400" />
                      KYC Verification
                    </button>

                    <button
                      onClick={() => openDashboard('profiles')}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User size={16} className="mr-3 text-gray-400" />
                      Profile Settings
                    </button>

                    <button
                      onClick={openChangePassword}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Key size={16} className="mr-3 text-gray-400" />
                      Change Password
                    </button>

                    {(isAdmin || isAdminNew) && (
                      <button
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          window.open('/admin/dashboard', '_blank');
                          setIsOpen(false);
                        }}
                      >
                        <Shield size={16} className="mr-3 text-gray-400" />
                        Admin Panel
                      </button>
                    )}

                    <hr className="my-1 border-gray-200" />

                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {isLoggingOut ? (
                        <Loader2 size={16} className="mr-3 animate-spin" />
                      ) : (
                        <LogOut size={16} className="mr-3" />
                      )}
                      {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                    </button>
                  </div>
                </div>

                {/* Mobile Modal */}
                <Portal>
                  <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start pt-16">
                    <div className="bg-white rounded-b-2xl w-full p-6 animate-in slide-in-from-top duration-300">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white font-medium">
                            {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.first_name ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}` : 'User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsOpen(false)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <X size={20} className="text-gray-500" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={() => openDashboard('overview')}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Home size={18} className="mr-3 text-gray-400" />
                          Dashboard
                        </button>

                        <button
                          onClick={() => openDashboard('requests')}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <History size={18} className="mr-3 text-gray-400" />
                          My Requests
                        </button>

                        <button
                          onClick={() => openDashboard('transactions')}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <CreditCard size={18} className="mr-3 text-gray-400" />
                          Transactions
                        </button>

                        <button
                          onClick={() => openDashboard('tokenized-assets')}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Gem size={18} className="mr-3 text-gray-400" />
                          Tokenized Assets
                        </button>

                        <button
                          onClick={() => openDashboard('dao')}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Users size={18} className="mr-3 text-gray-400" />
                          DAO
                        </button>

                        <button
                          onClick={() => openDashboard('co2-certificates')}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Leaf size={18} className="mr-3 text-gray-400" />
                          CO2 Certificates
                        </button>

                        <button
                          onClick={() => openDashboard('chat-support')}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MessageCircle size={18} className="mr-3 text-gray-400" />
                          Chat Support
                        </button>

                        <button
                          onClick={() => openDashboard('wallet')}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Wallet size={18} className="mr-3 text-gray-400" />
                          Wallet & NFTs
                        </button>

                        <button
                          onClick={() => openDashboard('kyc')}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Shield size={18} className="mr-3 text-gray-400" />
                          KYC Verification
                        </button>

                        <button
                          onClick={() => openDashboard('profiles')}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <User size={18} className="mr-3 text-gray-400" />
                          Profile Settings
                        </button>

                        <button
                          onClick={openChangePassword}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Key size={18} className="mr-3 text-gray-400" />
                          Change Password
                        </button>

                        {(isAdmin || isAdminNew) && (
                          <button
                            className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={() => {
                              window.open('/admin/dashboard', '_blank');
                              setIsOpen(false);
                            }}
                          >
                            <Shield size={18} className="mr-3 text-gray-400" />
                            Admin Panel
                          </button>
                        )}

                        <button
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="w-full flex items-center px-4 py-3 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isLoggingOut ? (
                            <Loader2 size={18} className="mr-3 animate-spin" />
                          ) : (
                            <LogOut size={18} className="mr-3" />
                          )}
                          {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                        </button>
                      </div>
                    </div>
                  </div>
                </Portal>
              </>
            )}
          </>
        ) : (
          <>
            {/* Guest User Menu */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-gray-300 rounded-full">
                <User size={16} className="text-gray-600" />
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-900">
                Account
              </span>
              {isOpen ? (
                <ChevronUp size={16} className="text-gray-500" />
              ) : (
                <ChevronDown size={16} className="text-gray-500" />
              )}
            </button>

{isOpen && (
              <>
                {/* Desktop Dropdown */}
                <div className="hidden md:block absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={openLoginModal}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <LogIn size={16} className="mr-3 text-gray-400" />
                    Sign In
                  </button>

                  <button
                    onClick={openRegisterModal}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserPlus size={16} className="mr-3 text-gray-400" />
                    Create Account
                  </button>

                </div>

                {/* Mobile Modal */}
                <Portal>
                  <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start pt-16">
                    <div className="bg-white rounded-b-2xl w-full p-6 animate-in slide-in-from-top duration-300">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Account</h3>
                        <button
                          onClick={() => setIsOpen(false)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <X size={20} className="text-gray-500" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={openLoginModal}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <LogIn size={18} className="mr-3 text-gray-400" />
                          Sign In
                        </button>

                        <button
                          onClick={openRegisterModal}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <UserPlus size={18} className="mr-3 text-gray-400" />
                          Create Account
                        </button>
                      </div>
                    </div>
                  </div>
                </Portal>
              </>
            )}
          </>
        )}
      </div>

      {/* Dashboard Modal */}
      {showDashboard && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-6xl h-[80vh] overflow-hidden relative">
              <button
                onClick={() => setShowDashboard(false)}
                className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
              >
                <X size={20} className="text-gray-500" />
              </button>
              <Dashboard onClose={() => setShowDashboard(false)} initialTab={dashboardTab} />
            </div>
          </div>
        </Portal>
      )}

      {/* Success Message */}
      {successMessage && (
        <Portal>
          <div className="fixed top-4 right-4 z-[10000] animate-in slide-in-from-right duration-300">
            <div className="bg-white border border-green-200 rounded-xl shadow-lg p-4 max-w-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <CheckCircle size={20} className="text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {successMessage.type} Successful
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {successMessage.message}
                  </p>
                </div>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X size={14} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Authentication Modals */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={switchToRegister}
          onSuccess={handleLoginSuccess}
          onSwitchToForgotPassword={() => {
            setShowLoginModal(false);
            setShowForgotPassword(true);
          }}
        />
      )}

      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={switchToLogin}
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

      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </>
  );
}

export default memo(UserMenu);