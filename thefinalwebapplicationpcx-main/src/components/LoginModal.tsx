import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthModal, FormField, PasswordField, ErrorAlert, LoadingButton, SuccessModal } from './auth';
import Portal from './Portal';

interface LoginModalProps {
  onClose: () => void;
  onSwitchToRegister: () => void;
  onSuccess?: () => void;
  onSwitchToForgotPassword?: () => void;
}

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
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signIn(email, password);

      // Show success message
      setShowSuccess(true);

      // Close modal after showing success
      setTimeout(() => {
        if (onSuccess) onSuccess();
        handleClose();
      }, 1500);

    } catch (error: any) {
      console.error('Login error:', error);

      // Simplified error handling
      let errorMessage = 'Sign in failed. Please try again.';

      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Too many attempts. Please wait before trying again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address first.';
      } else if (error.message?.includes('Invalid input')) {
        errorMessage = 'Please enter valid email and password.';
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
    setPassword('');
    setError(null);
    setShowSuccess(false);
    onClose();
  };

  return (
    <>
      <AuthModal
        title="Welcome Back"
        subtitle="Sign in to PrivateCharterX"
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
            name="login-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            icon={Mail}
            required
            disabled={isLoading}
            autoComplete="email"
          />

          <PasswordField
            label="Password"
            name="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={isLoading}
            autoComplete="current-password"
          />

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={onSwitchToRegister}
              disabled={isLoading}
              className="text-xs font-light text-gray-500 hover:text-black transition-colors disabled:opacity-50"
            >
              Create an account
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
              className="text-xs font-light text-gray-500 hover:text-black transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <LoadingButton
            isLoading={isLoading}
            disabled={!email.trim() || !password}
            loadingText="Signing in..."
          >
            Sign In
          </LoadingButton>
        </form>
      </AuthModal>

      <SuccessModal
        show={showSuccess}
        title="Welcome Back!"
        message="Successfully signed in to PrivateCharterX"
      />
    </>
  );
}