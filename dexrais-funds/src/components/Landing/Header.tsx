import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SplitAuthModal from '../Auth/SplitAuthModal';

export default function Header() {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { user, session, showAuth, authMode, openLogin, openRegister, closeAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Check if user is authenticated (has session OR wallet connected with user profile)
  const isAuthenticated = session !== null || (isConnected && user !== null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActivePage = (path: string) => {
    return location.pathname === path;
  };

  const handleGetStartedAction = (action: string) => {
    setShowGetStarted(false);
    if (action === 'create') {
      navigate('/create');
    } else if (action === 'browse') {
      navigate('/launchpad');
    } else if (action === 'dashboard') {
      navigate('/dashboard');
    }
  };

  return (
    <>
      {/* Header Container with conditional glassmorphic background */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-2xl border-b border-gray-200/50 shadow-sm'
          : 'bg-transparent'
      }`}>
        <header className="px-4 sm:px-8 py-3 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <div className="flex items-center space-x-2">
                <img
                  src="/logo.svg"
                  alt="DexRais Logo"
                  className="w-8 h-8"
                />
                <span className="text-base font-semibold text-gray-900">
                  DexRais<span className="font-bold">.funds</span>
                </span>
              </div>
            </Link>

            {/* Right Side - Navigation + Plus Menu Toggle + Separator + Buttons */}
            <div className="flex items-center space-x-3">
              {/* Inline Navigation Menu - appears to the LEFT of the + */}
              {showMenu && (
                <div className="flex items-center space-x-2 animate-fade-in">
                  <Link
                    to="/launchpad"
                    onClick={() => setShowMenu(false)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      isActivePage('/launchpad')
                        ? 'text-gray-900 bg-gray-100'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Launchpad
                  </Link>
                  <Link
                    to="/pricing"
                    onClick={() => setShowMenu(false)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      isActivePage('/pricing')
                        ? 'text-gray-900 bg-gray-100'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Pricing
                  </Link>
                  <Link
                    to="/create"
                    onClick={() => setShowMenu(false)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      isActivePage('/create')
                        ? 'text-gray-900 bg-gray-100'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Create Campaign
                  </Link>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowLearnMore(true);
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Learn More
                  </button>
                  {isConnected && (
                    <>
                      <div className="h-4 w-px bg-gray-300" />
                      <Link
                        to="/dashboard"
                        onClick={() => setShowMenu(false)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          isActivePage('/dashboard')
                            ? 'text-gray-900 bg-gray-100'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setShowMenu(false)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          isActivePage('/profile')
                            ? 'text-gray-900 bg-gray-100'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        Profile
                      </Link>
                    </>
                  )}
                </div>
              )}

              {/* Plus Menu Toggle - rotates when clicked */}
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-md transition-all"
                aria-label="Toggle menu"
              >
                <div className={`relative w-5 h-5 transition-transform duration-300 ${showMenu ? 'rotate-45' : 'rotate-0'}`}>
                  {/* Plus Icon */}
                  <span className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-900 -translate-y-1/2" />
                  <span className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-900 -translate-x-1/2" />
                </div>
              </button>

              {/* Thin Separator Line */}
              <div className="h-6 w-px bg-gray-300" />

              {/* Minimalistic Buttons */}
              {!isAuthenticated ? (
                <button
                  onClick={() => setShowGetStarted(true)}
                  className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  Get Started
                </button>
              ) : (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  {user?.username || user?.email?.split('@')[0] || 'Dashboard'}
                </button>
              )}
              <button
                onClick={() => open()}
                className="bg-gray-900 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-800 transition-colors"
              >
                {isConnected
                  ? `${address?.slice(0, 4)}...${address?.slice(-4)}`
                  : 'Connect'}
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Get Started Modal */}
      {showGetStarted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg max-w-md w-full border-2 border-gray-200">
            <div className="border-b-2 border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Get Started</h2>
              <button
                onClick={() => setShowGetStarted(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <button
                onClick={() => {
                  setShowGetStarted(false);
                  openRegister();
                }}
                className="w-full p-5 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-left shadow-sm"
              >
                <div className="font-semibold mb-1 text-base">Create Account</div>
                <div className="text-sm opacity-90">Sign up to launch campaigns and back projects</div>
              </button>

              <button
                onClick={() => {
                  setShowGetStarted(false);
                  openLogin();
                }}
                className="w-full p-5 border-2 border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors text-left"
              >
                <div className="font-semibold mb-1 text-gray-900 text-base">Login</div>
                <div className="text-sm text-gray-600">Already have an account? Sign in here</div>
              </button>

              <button
                onClick={() => handleGetStartedAction('browse')}
                className="w-full p-5 border-2 border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors text-left"
              >
                <div className="font-semibold mb-1 text-gray-900 text-base">Browse Campaigns</div>
                <div className="text-sm text-gray-600">Discover and back Web3 projects</div>
              </button>

              {isConnected && (
                <button
                  onClick={() => handleGetStartedAction('dashboard')}
                  className="w-full p-5 border-2 border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors text-left"
                >
                  <div className="font-semibold mb-1 text-gray-900 text-base">Go to Dashboard</div>
                  <div className="text-sm text-gray-600">Manage your campaigns and contributions</div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <SplitAuthModal
        isOpen={showAuth}
        onClose={closeAuth}
        defaultMode={authMode}
      />

      {/* Learn More Modal */}
      {showLearnMore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-200">
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
              <button
                onClick={() => setShowLearnMore(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-md">
                    1
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 mb-2">Create Campaign</h4>
                  <p className="text-sm text-gray-600 font-normal">
                    Fill out form, upload images, set funding goal & duration.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-md">
                    2
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 mb-2">Pay 299 USDC</h4>
                  <p className="text-sm text-gray-600 font-normal">
                    One-time launch fee. Campaign goes live instantly on Launchpad.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-md">
                    3
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 mb-2">Backers Fund</h4>
                  <p className="text-sm text-gray-600 font-normal">
                    Contributors send USDC. Funds locked in Gnosis Safe escrow.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-black text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-md">
                    4
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 mb-2">Unlock or Refund</h4>
                  <p className="text-sm text-gray-600 font-normal">
                    100% goal: funds unlock. Under 100%: automatic refunds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
