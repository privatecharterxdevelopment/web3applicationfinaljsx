import { useState } from 'react';
import { X, Mail, Lock, Wallet } from 'lucide-react';
import { useAppKit } from '@reown/appkit/react';
import { supabase } from '../../lib/supabase';
import { sendRegistrationConfirmation } from '../../lib/resend';

interface SplitAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export default function SplitAuthModal({ isOpen, onClose, defaultMode = 'login' }: SplitAuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { open } = useAppKit();

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      console.log('[Auth] Login successful:', data.user?.email);
      onClose();
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error('[Auth] Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept the Terms & Conditions');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        const username = data.user.email?.split('@')[0] || 'User';
        await sendRegistrationConfirmation(
          email,
          username,
          data.user.id
        );

        console.log('[Auth] Registration successful:', data.user.email);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        onClose();

        alert('Registration successful! Please check your email to confirm your account.');
      }
    } catch (err: any) {
      console.error('[Auth] Registration error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) throw oauthError;

      console.log('[Auth] Google OAuth initiated');
    } catch (err: any) {
      console.error('[Auth] Google auth error:', err);
      setError(err.message || 'Failed to authenticate with Google.');
      setLoading(false);
    }
  };

  const handleWalletConnect = () => {
    open();
    onClose();
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAcceptedTerms(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Split Screen */}
      <div className="relative bg-white rounded-2xl max-w-5xl w-full h-[600px] border border-gray-200 shadow-2xl overflow-hidden animate-fade-in flex">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Left Side - Auth Form */}
        <div className="w-1/2 p-12 overflow-y-auto">
          {/* Logo & Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-6">
              <img
                src="/logo.svg"
                alt="DexRais Logo"
                className="w-9 h-9"
              />
              <span className="text-lg font-semibold text-gray-900">
                DexRais<span className="font-bold">.funds</span>
              </span>
            </div>

            <h2 className="text-3xl font-medium text-gray-900 mb-2 tracking-tight" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm text-gray-600 font-normal">
              {mode === 'login'
                ? 'Sign in to your DexRais account'
                : 'Join DexRais and start your fundraising journey'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all font-normal"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={mode === 'register' ? 8 : undefined}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all font-normal"
                />
              </div>
              {mode === 'register' && (
                <p className="mt-1 text-xs text-gray-500 font-normal">
                  Minimum 8 characters
                </p>
              )}
            </div>

            {/* Confirm Password (Register Only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all font-normal"
                  />
                </div>
              </div>
            )}

            {/* Terms Checkbox (Register Only) */}
            {mode === 'register' && (
              <div className="flex items-start gap-3 pt-2">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900 cursor-pointer"
                  />
                </div>
                <label className="text-xs text-gray-600 font-normal cursor-pointer">
                  I agree to the{' '}
                  <a href="/terms" className="text-gray-900 font-semibold hover:underline">
                    Terms & Conditions
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-gray-900 font-semibold hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-6"
            >
              {loading
                ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                : (mode === 'login' ? 'Sign In' : 'Get Started')}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-500 font-medium">or continue with</span>
            </div>
          </div>

          {/* Social & Wallet Auth */}
          <div className="space-y-3">
            {/* Google Auth */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-2.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all font-medium text-sm text-gray-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Wallet Connect */}
            <button
              type="button"
              onClick={handleWalletConnect}
              disabled={loading}
              className="w-full py-2.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all font-medium text-sm text-gray-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wallet className="w-4 h-4" />
              Continue with Wallet
            </button>
          </div>

          {/* Switch Mode Link */}
          <p className="mt-6 text-center text-xs text-gray-600 font-normal">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-gray-900 font-semibold hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-gray-900 font-semibold hover:underline"
                >
                  Log in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Right Side - Video Background */}
        <div className="w-1/2 relative overflow-hidden">
          {/* Background Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/src/components/Landing/perfect_seamless_20sec.mp4" type="video/mp4" />
          </video>

          {/* Dark Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Content Overlay */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center p-12 text-white">
            <h3 className="text-4xl font-bold mb-4 text-center drop-shadow-lg">
              Decentralized Fundraising
            </h3>
            <p className="text-lg text-white/95 text-center max-w-md drop-shadow-md">
              Launch campaigns with Gnosis Safe escrow, USDC payments, and Aragon DAO governance. 100% on-chain.
            </p>

            {/* Feature Pills */}
            <div className="mt-8 flex flex-wrap gap-2 justify-center">
              <div className="px-4 py-2 bg-white/25 backdrop-blur-md rounded-full text-sm font-medium drop-shadow-md">
                Gnosis Safe Escrow
              </div>
              <div className="px-4 py-2 bg-white/25 backdrop-blur-md rounded-full text-sm font-medium drop-shadow-md">
                USDC Payments
              </div>
              <div className="px-4 py-2 bg-white/25 backdrop-blur-md rounded-full text-sm font-medium drop-shadow-md">
                DAO Governance
              </div>
              <div className="px-4 py-2 bg-white/25 backdrop-blur-md rounded-full text-sm font-medium drop-shadow-md">
                100% On-Chain
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
