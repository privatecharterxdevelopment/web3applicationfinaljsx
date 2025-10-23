import React, { useState } from 'react';
import { Mail, Lock, Scan, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../thefinalwebapplicationpcx-main/src/context/AuthContext';
import Portal from './Portal';
import { VideoHero, FaceLoginModal } from './auth';
import { checkFaceAuthEnabled } from '../services/faceAuthService';

interface LoginModalProps {
  onClose: () => void;
  onSwitchToRegister: () => void;
  onSuccess?: () => void;
  onSwitchToForgotPassword?: () => void;
}

const videos = [
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/moreVideos/8436362-uhd_3840_2160_30fps.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zLzg0MzYzNjItdWhkXzM4NDBfMjE2MF8zMGZwcy5tcDQiLCJpYXQiOjE3NjA5MTE2MjAsImV4cCI6Nzc1MjI5OTgwMjB9.ebROl6af5ZnN0T1Xd95tfZBwKmPhcCUl8oCsVAYwlMI',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/fucking%20videos/17324151-hd_1080_1920_30fps.mp4',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/moreVideos/7875576-hd_1920_1080_25fps.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zLzc4NzU1NzYtaGRfMTkyMF8xMDgwXzI1ZnBzLm1wNCIsImlhdCI6MTc2MDkxMzc2NiwiZXhwIjo3NzUyMzAwMDE2Nn0.acimIaa-fPSN47voHxAUiNjrkKjC98fo2aNQyVO0a-A',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/12427495_3840_2160_24fps.mp4',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/moreVideos/13736229-uhd_3840_2160_30fps.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zLzEzNzM2MjI5LXVoZF8zODQwXzIxNjBfMzBmcHMubXA0IiwiaWF0IjoxNzYwOTEyMTU3LCJleHAiOjc3NjUyNDI1NzU3fQ.Oq64TE_BAxshzy6AS9U5AnboXpjnQZWubm8HW5eGavs',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/moreVideos/13158911_4096_2160_50fps.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zLzEzMTU4OTExXzQwOTZfMjE2MF81MGZwcy5tcDQiLCJpYXQiOjE3NjA5MTIyNDUsImV4cCI6OTUxMzkyOTg0NX0.jM3JSo4Kyf27Hi5yiGGIK5mrtDnrCtUxA5vdFm7Rino',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/moreVideos/5673899-uhd_4096_2160_30fps.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zLzU2NzM4OTktdWhkXzQwOTZfMjE2MF8zMGZwcy5tcDQiLCJpYXQiOjE3NjA5MTI0MjYsImV4cCI6MTc5MjQ0ODQyNn0.YHofw-Rwow-p8VmZkyg-cDaxejMSvd14KnG8NoPxp2E',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/moreVideos/4415852-uhd_3840_2160_30fps.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zLzQ0MTU4NTItdWhkXzM4NDBfMjE2MF8zMGZwcy5tcDQiLCJpYXQiOjE3NjA5MTI1NDgsImV4cCI6MTc5MjQ0ODU0OH0.IBjgnpwZaf9pj47zgGIyCxIPlvs-lNo-Qqmbe8X9fsk',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/moreVideos/13167263_1080_1920_30fps.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zLzEzMTY3MjYzXzEwODBfMTkyMF8zMGZwcy5tcDQiLCJpYXQiOjE3NjA5MTM1NTcsImV4cCI6MTc5MjQ0OTU1N30.iDgNvEyF3i3S3F6GyPEDL52ZlJicj2GxVQuTRXXs5v0',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/moreVideos/19948847-uhd_3840_2160_60fps.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zLzE5OTQ4ODQ3LXVoZF8zODQwXzIxNjBfNjBmcHMubXA0IiwiaWF0IjoxNzYwOTEzNjY5LCJleHAiOjE3OTI0NDk2Njl9.F-uRmmODnG2dLtVGSunChWYYnE3RvUPtab3fhU8lhpQ'
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
      setError(error.message || 'Invalid email or password');
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
        setError('Face ID not registered. Use email/password.');
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-8 font-['DM_Sans']">

        {/* Modal Container - Same size as dashboard */}
        <div className="w-full max-w-7xl h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex">

          {/* LEFT SIDE - Form */}
          <div className="w-2/5 bg-white p-8 flex flex-col relative">

            {/* Logo */}
            <div className="mb-8">
              <img
                src="/logo.svg"
                alt="PrivateCharterX"
                className="h-8"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            {/* Title */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
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
              <div className="flex justify-between items-center text-xs mb-4">
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-gray-500 hover:text-gray-900 transition-colors font-light"
                >
                  Create account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onSwitchToForgotPassword) {
                      onSwitchToForgotPassword();
                    } else {
                      onClose();
                      navigate('/reset-password');
                    }
                  }}
                  className="text-gray-500 hover:text-gray-900 transition-colors font-light"
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
          <div className="w-3/5 relative">
            <VideoHero videos={videos} interval={8000} />
          </div>

        </div>
      </div>
    </Portal>
  );
}
