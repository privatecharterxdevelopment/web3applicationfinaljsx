import React, { useState } from 'react';
import { Mail, X, ArrowLeft } from 'lucide-react';
import Portal from './Portal';
import { VideoHero } from './auth';
import { supabase } from '../lib/supabase';

interface ForgotPasswordModalProps {
  onClose: () => void;
  onBackToLogin: () => void;
}

const videos = [
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/4936487-uhd_2160_4096_24fps.mp4',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/7456210-hd_1920_1080_25fps.mp4',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/12427495_3840_2160_24fps.mp4',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/11506224-uhd_2160_3840_60fps.mp4'
];

export default function ForgotPasswordModal({
  onClose,
  onBackToLogin
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Use the existing Edge Function
      const { error } = await supabase.functions.invoke('request-password-reset', {
        body: {
          email: email.trim()
        }
      });

      if (error) throw error;

      // Show success message
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

  const handleClose = () => {
    setEmail('');
    setError(null);
    setShowSuccess(false);
    onClose();
  };

  return (
    <Portal>
      <div className="fixed inset-0 bg-gray-100 z-[9999] flex items-center justify-center p-6 font-['DM_Sans']">

        {/* Modal Container */}
        <div className="w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden flex">

          {/* LEFT SIDE - Form */}
          <div className="w-2/5 bg-white p-8 flex flex-col relative z-20">

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute right-6 top-6 p-2 hover:bg-gray-100 rounded-full transition-colors z-30"
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

            {showSuccess ? (
              // Success State
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
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

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onBackToLogin();
                  }}
                  className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-all cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              // Form State
              <>
                {/* Back Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onBackToLogin();
                  }}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-6 cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  Back to Login
                </button>

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

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                  <div className="space-y-3 mb-6">
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
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
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
                </form>
              </>
            )}
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
