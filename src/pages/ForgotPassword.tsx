import React, { useState } from 'react';
import { Mail, X, ArrowLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Portal from '../components/Portal';
import { VideoHero } from '../components/auth';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';

const videos = [
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/moreVideos/8436362-uhd_3840_2160_30fps.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zLzg0MzYzNjItdWhkXzM4NDBfMjE2MF8zMGZwcy5tcDQiLCJpYXQiOjE3NjA5MTE2MjAsImV4cCI6Nzc1MjI5OTgwMjB9.ebROl6af5ZnN0T1Xd95tfZBwKmPhcCUl8oCsVAYwlMI',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/moreVideos/7875576-hd_1920_1080_25fps.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zLzc4NzU1NzYtaGRfMTkyMF8xMDgwXzI1ZnBzLm1wNCIsImlhdCI6MTc2MDkxMzc2NiwiZXhwIjo3NzUyMzAwMDE2Nn0.acimIaa-fPSN47voHxAUiNjrkKjC98fo2aNQyVO0a-A',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/12427495_3840_2160_24fps.mp4',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/moreVideos/13736229-uhd_3840_2160_30fps.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zLzEzNzM2MjI5LXVoZF8zODQwXzIxNjBfMzBmcHMubXA0IiwiaWF0IjoxNzYwOTEyMTU3LCJleHAiOjc3NjUyNDI1NzU3fQ.Oq64TE_BAxshzy6AS9U5AnboXpjnQZWubm8HW5eGavs'
];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  console.log('🔴 PLATFORM:', platform, 'isNative:', isNative);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.functions.invoke('request-password-reset', {
        body: {
          email: email.trim()
        }
      });

      if (error) throw error;
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Password reset error:', error);

      let errorMessage = 'Failed to send reset email. Please try again.';

      if (error.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait before trying again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (showSuccess) {
    return (
      <Portal>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 lg:p-8 font-['DM_Sans']">
          <div className={`w-full h-screen lg:h-[90vh] lg:max-w-7xl bg-white rounded-none lg:rounded-3xl shadow-2xl overflow-hidden flex ${isNative ? 'flex-col' : 'flex-col-reverse lg:flex-row'}`}>

            {/* Form Section */}
            <div className={`${isNative ? 'w-full h-full' : 'w-full lg:w-2/5'} bg-white flex flex-col relative overflow-hidden`}>

              {/* TOP: Navigation Bar */}
              <div className="flex items-center justify-between p-4 lg:p-6">
                <div className="w-8" />
                <button
                  onClick={() => navigate('/')}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              {/* MIDDLE: Success Content */}
              <div className="flex-1 flex flex-col items-center justify-center px-6 lg:px-8">
                <div className="w-full max-w-sm mx-auto text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-green-600" />
                  </div>
                  <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                    Check Your Email
                  </h1>
                  <p className="text-sm text-gray-500 mb-4">
                    We've sent password reset instructions to<br />
                    <span className="font-medium text-gray-900">{email}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    The email may take a few minutes to arrive. Check your spam folder if you don't see it.
                  </p>
                </div>
              </div>

              {/* BOTTOM: Button */}
              <div className="p-4 lg:p-6 border-t border-gray-100">
                <div className="w-full max-w-sm mx-auto">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-all"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </div>

            {/* Video Section - hidden on iOS */}
            {!isNative && (
              <div className="w-full lg:w-3/5 relative h-64 lg:h-auto">
                <VideoHero videos={videos} interval={8000} />
              </div>
            )}
          </div>
        </div>
      </Portal>
    );
  }

  // Main form
  return (
    <Portal>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 lg:p-8 font-['DM_Sans']">
        <div className={`w-full h-screen lg:h-[90vh] lg:max-w-7xl bg-white rounded-none lg:rounded-3xl shadow-2xl overflow-hidden flex ${isNative ? 'flex-col' : 'flex-col-reverse lg:flex-row'}`}>

          {/* Form Section */}
          <div className={`${isNative ? 'w-full h-full' : 'w-full lg:w-2/5'} bg-white flex flex-col relative overflow-hidden`}>

            {/* TOP: Navigation Bar */}
            <div className="flex items-center justify-between p-4 lg:p-6">
              <button
                onClick={() => navigate('/login')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* MIDDLE: Form Fields */}
            <div className="flex-1 overflow-y-auto px-6 lg:px-8">
              <div className="w-full max-w-sm mx-auto py-4">
                {/* Title */}
                <div className="mb-6">
                  <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                    Reset Password
                  </h1>
                  <p className="text-sm text-gray-500 font-light">
                    Enter your email to receive reset instructions
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                {/* Form Fields */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Email Address
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
                        autoFocus
                      />
                    </div>
                  </div>
                </form>

                {/* Back to login link */}
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-xs text-gray-500 hover:text-gray-900 transition-colors font-light"
                  >
                    Remember your password? Sign in
                  </button>
                </div>
              </div>
            </div>

            {/* BOTTOM: Button */}
            <div className="p-4 lg:p-6 border-t border-gray-100">
              <div className="w-full max-w-sm mx-auto">
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isLoading || !email}
                  className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Email'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Video Section - hidden on iOS */}
          {!isNative && (
            <div className="w-full lg:w-3/5 relative h-64 lg:h-auto">
              <VideoHero videos={videos} interval={8000} />
            </div>
          )}

        </div>
      </div>
    </Portal>
  );
}
