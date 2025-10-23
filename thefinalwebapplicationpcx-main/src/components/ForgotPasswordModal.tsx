import React, { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthModal, FormField, ErrorAlert, LoadingButton } from './auth';
import Portal from './Portal';

interface ForgotPasswordModalProps {
  onClose: () => void;
  onBackToLogin: () => void;
}

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
      const { error } = await supabase.functions.invoke('request-password-reset', {
        body: {
          email: email.trim()
        }
      });

      if (error) throw error;

      // Show success message
      setShowSuccess(true);

      // Close modal after showing success
      setTimeout(() => {
        handleClose();
      }, 3000);

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

  if (showSuccess) {
    return (
      <Portal>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-medium text-black mb-2">Check Your Email</h2>
            <p className="text-sm font-light text-gray-600 mb-4">
              We've sent password reset instructions to your email address.
            </p>
            <p className="text-xs font-light text-gray-500">
              The email may take a few minutes to arrive. Check your spam folder if you don't see it.
            </p>
          </div>
        </div>
      </Portal>
    );
  }

  return (
    <AuthModal
      title="Reset Password"
      subtitle="Enter your email to receive reset instructions"
      onClose={handleClose}
    >
      {error && (
        <ErrorAlert
          message={error}
          className="mb-5"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField
          label="Email Address"
          type="email"
          name="reset-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          icon={Mail}
          required
          disabled={isLoading}
          autoComplete="email"
        />

        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={onBackToLogin}
            disabled={isLoading}
            className="text-xs font-light text-gray-500 hover:text-black transition-colors disabled:opacity-50"
          >
            Back to sign in
          </button>
        </div>

        <LoadingButton
          isLoading={isLoading}
          disabled={!email.trim()}
          loadingText="Sending..."
        >
          Send Reset Email
        </LoadingButton>
      </form>
    </AuthModal>
  );
}