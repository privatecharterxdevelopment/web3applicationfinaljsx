import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import Portal from '../Portal';
import { useAuth } from '../../context/AuthContext';

const RECAPTCHA_SITE_KEY = '6LdA4fcrAAAAAEE-ojHle6bq-Xbhdz2yS5myYlSG';

// Background video for login
const loginVideo = 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/moreVideos/13736229-uhd_3840_2160_30fps.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zLzEzNzM2MjI5LXVoZF8zODQwXzIxNjBfMzBmcHMubXA0IiwiaWF0IjoxNzYwOTEyMTU3LCJleHAiOjc3NjUyNDI1NzU3fQ.Oq64TE_BAxshzy6AS9U5AnboXpjnQZWubm8HW5eGavs';

interface AppLoginModalProps {
  onClose: () => void;
  onSwitchToRegister: () => void;
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

function AppLoginForm({
  onClose,
  onSwitchToRegister,
  onSuccess,
  onForgotPassword
}: AppLoginModalProps) {
  const { signIn } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (!executeRecaptcha) {
      setError('reCAPTCHA is loading. Please wait.');
      return;
    }

    setIsLoading(true);

    try {
      const captchaToken = await executeRecaptcha('login');

      if (!captchaToken) {
        setError('reCAPTCHA verification failed.');
        setIsLoading(false);
        return;
      }

      await signIn(email, password, { captchaToken });

      if (onSuccess) onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] bg-black font-['DM_Sans']">
        {/* Background Video */}
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={loginVideo} type="video/mp4" />
          </video>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end p-6 pb-10">
          {/* Logo */}
          <div className="absolute top-14 left-6">
            <img
              src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/PrivatecharterX_logo_vectorized.glb.png"
              alt="PrivateCharterX"
              className="h-8 brightness-0 invert"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-white/70 text-base">Sign in to continue</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
              <div className="flex items-center px-4 py-3.5">
                <Mail size={18} className="text-white/50 mr-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="flex-1 bg-transparent text-white placeholder-white/50 text-base outline-none"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
              <div className="flex items-center px-4 py-3.5">
                <Lock size={18} className="text-white/50 mr-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="flex-1 bg-transparent text-white placeholder-white/50 text-base outline-none"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1"
                >
                  {showPassword ? (
                    <EyeOff size={18} className="text-white/50" />
                  ) : (
                    <Eye size={18} className="text-white/50" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            {onForgotPassword && (
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-white/70 text-sm"
              >
                Forgot password?
              </button>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-white text-black rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <button
            onClick={onSwitchToRegister}
            className="mt-6 text-center text-white/70 text-sm"
          >
            Don't have an account? <span className="text-white font-medium">Create one</span>
          </button>

          {/* reCAPTCHA notice */}
          <p className="mt-6 text-white/40 text-xs text-center">
            Protected by reCAPTCHA. Google Privacy & Terms apply.
          </p>
        </div>
      </div>
    </Portal>
  );
}

// Export with reCAPTCHA provider
export default function AppLoginModal(props: AppLoginModalProps) {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <AppLoginForm {...props} />
    </GoogleReCaptchaProvider>
  );
}
