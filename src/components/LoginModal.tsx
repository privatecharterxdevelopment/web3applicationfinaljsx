import React, { useState } from 'react';
import { Mail, Lock, Scan, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../thefinalwebapplicationpcx-main/src/context/AuthContext';
import Portal from './Portal';
import { VideoHero, FaceLoginModal } from './auth';
import { checkFaceAuthEnabled } from '../services/faceAuthService';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFaceLogin, setShowFaceLogin] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);

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
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email first';
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceLoginClick = async () => {
    if (!email.trim()) {
      setError('Please enter your email first');
      return;
    }

    try {
      const { data: userData } = await (await import('../lib/supabase')).supabase
        .from('users')
        .select('id')
        .eq('email', email.trim())
        .single();

      if (!userData) {
        setError('User not found');
        return;
      }

      const hasFaceAuth = await checkFaceAuthEnabled(userData.id);
      if (!hasFaceAuth) {
        setError('Face ID not registered');
        return;
      }

      setTempUserId(userData.id);
      setShowFaceLogin(true);
    } catch (error) {
      setError('Failed to check Face ID');
    }
  };

  if (showFaceLogin && tempUserId) {
    return (
      <FaceLoginModal
        userId={tempUserId}
        userName={email.split('@')[0]}
        onClose={() => setShowFaceLogin(false)}
        onSuccess={async () => {
          try {
            const supabaseClient = (await import('../lib/supabase')).supabase;
            const { data: authData } = await supabaseClient.functions.invoke('face-login', {
              body: { userId: tempUserId }
            });

            if (authData?.session) {
              await supabaseClient.auth.setSession({
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token
              });
            }

            if (onSuccess) onSuccess();
            onClose();
          } catch (error) {
            setError('Face login failed');
            setShowFaceLogin(false);
          }
        }}
      />
    );
  }

  return (
    <Portal>
      <div className="fixed inset-0 bg-gray-100 z-[9999] flex items-center justify-center p-6 font-['DM_Sans']">

        {/* Modal Container - Full screen with padding */}
        <div className="w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden flex">

          {/* LEFT SIDE - Form */}
          <div className="w-2/5 bg-white p-8 flex flex-col relative z-20">

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>

            {/* Logo */}
            <div className="mb-8">
              <img
                src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/PrivatecharterX_logo_vectorized.glb.png"
                alt="PrivateCharterX"
                className="h-10"
              />
            </div>

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

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
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
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="flex justify-between items-center text-xs mb-4 relative z-30">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Create account clicked');
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
                    console.log('Forgot password clicked');
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

              {/* Sign In Button - Monochromatic */}
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
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

              {/* Face ID Button - Interactive Monochromatic */}
              <button
                type="button"
                onClick={handleFaceLoginClick}
                disabled={isLoading || !email}
                className="group w-full py-3 bg-gray-100 hover:bg-gray-900 text-gray-900 hover:text-white rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/0 via-gray-900/10 to-gray-900/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <Scan size={18} className="relative z-10 group-hover:scale-110 transition-transform" />
                <span className="relative z-10">Verify with Face ID</span>
              </button>

              {/* Footer */}
              <div className="mt-auto pt-4 text-center">
                <p className="text-[10px] text-gray-400">
                  By signing in, you agree to our{' '}
                  <a href="/terms" className="underline hover:text-gray-600">Terms</a>
                  {' & '}
                  <a href="/privacy" className="underline hover:text-gray-600">Privacy</a>
                </p>
              </div>
            </form>
          </div>

          {/* RIGHT SIDE - Video Hero */}
          <div className="w-3/5 h-full bg-red-500">
            <VideoHero videos={videos} interval={5000} />
          </div>

        </div>
      </div>
    </Portal>
  );
}
