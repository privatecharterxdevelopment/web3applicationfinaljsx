import React, { useState } from 'react';
import { Mail, Lock, X, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Portal from './Portal';
import { VideoHero } from './auth';
import { supabase } from '../lib/supabase';

// Google Icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

interface LoginModalProps {
  onClose: () => void;
  onSwitchToRegister?: () => void;
  onSuccess?: () => void;
  onSwitchToForgotPassword?: () => void;
}

const videos = [
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/4936487-uhd_2160_4096_24fps.mp4',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/7456210-hd_1920_1080_25fps.mp4',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/12427495_3840_2160_24fps.mp4',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/11506224-uhd_2160_3840_60fps.mp4'
];

export default function LoginModal({
  onClose,
  onSwitchToRegister,
  onSuccess,
  onSwitchToForgotPassword
}: LoginModalProps) {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signIn(email, password);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      let errorMessage = 'Invalid email or password';
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Too many attempts. Please wait.';
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
      // OAuth will redirect automatically
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 bg-gray-100 z-[9999] flex items-center justify-center p-6 font-['DM_Sans']">

        {/* Modal Container - Full screen with padding */}
        <div className="w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden flex">

          {/* LEFT SIDE - Form */}
          <div className="w-2/5 bg-white flex flex-col relative z-20">

            {/* Top Navigation Bar - Fixed height */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <button
                onClick={() => {
                  onClose();
                  navigate('/');
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Form Container - Scrollable middle section */}
            <div className="flex-1 flex flex-col justify-center px-8 py-6 overflow-y-auto">
              <div className="w-full max-w-sm mx-auto">
                {/* Title */}
                <div className="mb-6">
                  <h1 className="text-2xl font-light text-gray-900 mb-1">
                    Welcome Back
                  </h1>
                  <p className="text-sm text-gray-500 font-light">
                    Sign in to your account
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-3 mb-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                        placeholder="your@email.com"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Links */}
                <div className="flex justify-between items-center text-xs mb-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onSwitchToRegister) {
                        onSwitchToRegister();
                      }
                    }}
                    className="text-gray-500 hover:text-gray-900 transition-colors font-light cursor-pointer"
                  >
                    Create account
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onSwitchToForgotPassword) {
                        onSwitchToForgotPassword();
                      } else {
                        onClose();
                        navigate('/reset-password');
                      }
                    }}
                    className="text-gray-500 hover:text-gray-900 transition-colors font-light cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Section - Buttons fixed at bottom */}
            <div className="p-6 border-t border-gray-100">
              <div className="w-full max-w-sm mx-auto space-y-3">
                {/* Sign In Button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !email || !password}
                  className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>

                {/* Google Login Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading || isGoogleLoading}
                  className="w-full py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium flex items-center justify-center gap-3 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGoogleLoading ? (
                    <Loader2 size={18} className="animate-spin text-gray-600" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span className="text-gray-700">Continue with Google</span>
                </button>

                {/* Footer */}
                <div className="pt-2 text-center">
                  <p className="text-[10px] text-gray-400">
                    By signing in, you agree to our{' '}
                    <a href="/terms" className="underline hover:text-gray-600">Terms</a>
                    {' & '}
                    <a href="/privacy" className="underline hover:text-gray-600">Privacy</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Video Hero */}
          <div className="w-3/5 h-full bg-gray-900">
            <VideoHero videos={videos} interval={5000} />
          </div>

        </div>
      </div>
    </Portal>
  );
}
