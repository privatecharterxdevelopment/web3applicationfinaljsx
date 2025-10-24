import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthPageLayout, PasswordField, ErrorAlert, LoadingButton, SuccessModal } from '../components/auth';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [resetTokenData, setResetTokenData] = useState<{ token: string, userId: string } | null>(null);

  // Password strength validation
  const getPasswordStrength = (password: string) => {
    const requirements = [
      { test: password.length >= 8, label: 'At least 8 characters' },
      { test: /[A-Z]/.test(password), label: 'One uppercase letter' },
      { test: /[a-z]/.test(password), label: 'One lowercase letter' },
      { test: /\d/.test(password), label: 'One number' },
      { test: /[^a-zA-Z0-9]/.test(password), label: 'One special character' }
    ];
    return requirements;
  };

  const passwordRequirements = getPasswordStrength(password);
  const isPasswordValid = passwordRequirements.every(req => req.test);
  const doPasswordsMatch = password && confirmPassword && password === confirmPassword;

  useEffect(() => {
    // Check if we have a valid reset token from URL parameters
    const checkTokenValidity = async () => {
      try {
        const token = searchParams.get('token');

        if (!token) {
          console.error('No reset token provided');
          setIsValidToken(false);
          return;
        }

        // Validate the token against our database
        const { data, error } = await supabase
          .rpc('verify_reset_token', { token_value: token })
          .single();

        if (error || !data) {
          console.error('Invalid or expired reset token:', error);
          setIsValidToken(false);
          return;
        }

        // Check if token has expired
        const expiresAt = new Date(data.expires_at);
        const now = new Date();

        if (now > expiresAt) {
          console.error('Reset token has expired');
          setIsValidToken(false);
          return;
        }

        // Token is valid
        setResetTokenData({ token, userId: data.user_id });
        setIsValidToken(true);

      } catch (error) {
        console.error('Token validation error:', error);
        setIsValidToken(false);
      }
    };

    checkTokenValidity();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements.');
      return;
    }

    if (!doPasswordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    if (!resetTokenData) {
      setError('Invalid reset token. Please request a new password reset.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Update the user's password using Supabase Edge Function
      const { error: passwordUpdateError } = await supabase.functions.invoke('update-user-password', {
        body: {
          userId: resetTokenData.userId,
          newPassword: password,
          resetToken: resetTokenData.token
        }
      });

      if (passwordUpdateError) {
        console.error('Password update error:', passwordUpdateError);
        throw new Error('Failed to update password');
      }

      setShowSuccess(true);

      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error: any) {
      console.error('Password reset error:', error);

      let errorMessage = 'Failed to reset password. Please try again.';

      if (error.message?.includes('User not found')) {
        errorMessage = 'Invalid reset token. Please request a new one.';
      } else if (error.message?.includes('Token already used')) {
        errorMessage = 'This reset link has already been used. Please request a new one.';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'Password does not meet minimum requirements.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking token validity
  if (isValidToken === null) {
    return (
      <AuthPageLayout
        title="Validating Reset Link"
        showCancelButton={false}
      >
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-gray-500 bg-white">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-3"></div>
            Validating reset link...
          </div>
        </div>
      </AuthPageLayout>
    );
  }

  // Show error if token is invalid
  if (isValidToken === false) {
    return (
      <AuthPageLayout
        title="Invalid Reset Link"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Link Expired or Invalid</h3>
          <p className="text-sm text-gray-600 mb-6">
            This password reset link has expired or is invalid. Please request a new one.
          </p>
          <LoadingButton
            type="button"
            isLoading={false}
            loadingText=""
            onClick={() => navigate('/login')}
          >
            Back to Sign In
          </LoadingButton>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      title="Create New Password"
      subtitle="Enter your new password below"
    >
      {error && (
        <ErrorAlert
          title="Reset Failed"
          message={error}
          className="mb-4"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <PasswordField
          label="New Password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
          required
          disabled={isLoading}
          showStrengthIndicator={true}
        />

        <PasswordField
          label="Confirm Password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required
          disabled={isLoading}
        />

        {/* Password match indicator */}
        {confirmPassword && (
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${doPasswordsMatch ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={doPasswordsMatch ? 'text-green-600' : 'text-red-600'}>
              {doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}
            </span>
          </div>
        )}

        <LoadingButton
          isLoading={isLoading}
          disabled={!isPasswordValid || !doPasswordsMatch}
          loadingText="Updating Password..."
        >
          Update Password
        </LoadingButton>
      </form>

      <SuccessModal
        show={showSuccess}
        title="Password Updated!"
        message="Your password has been successfully updated. You will be redirected to the sign in page."
        countdown="Redirecting in 3 seconds..."
      />
    </AuthPageLayout>
  );
}