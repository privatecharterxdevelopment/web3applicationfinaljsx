import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthModal, PasswordField, ErrorAlert, LoadingButton } from './auth';
import Portal from './Portal';

interface ChangePasswordModalProps {
  onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const validatePasswords = (): string | null => {
    if (!currentPassword.trim()) {
      return 'Current password is required';
    }

    if (!newPassword.trim()) {
      return 'New password is required';
    }

    if (newPassword.length < 8) {
      return 'New password must be at least 8 characters long';
    }

    if (!/[A-Z]/.test(newPassword)) {
      return 'New password must contain at least one uppercase letter';
    }

    if (!/[a-z]/.test(newPassword)) {
      return 'New password must contain at least one lowercase letter';
    }

    if (!/\d/.test(newPassword)) {
      return 'New password must contain at least one number';
    }

    if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      return 'New password must contain at least one special character';
    }

    if (newPassword !== confirmPassword) {
      return 'New passwords do not match';
    }

    if (currentPassword === newPassword) {
      return 'New password must be different from current password';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validatePasswords();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // First verify the current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('User not found');
      }

      // Verify current password by attempting to sign in with it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Current password is incorrect');
        }
        throw signInError;
      }

      // Update the password using Supabase auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      // Show success message
      setShowSuccess(true);

      // Close modal after showing success
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error: any) {
      console.error('Password change error:', error);

      let errorMessage = 'Failed to change password. Please try again.';

      if (error.message?.includes('same as the old password')) {
        errorMessage = 'New password must be different from your current password';
      } else if (error.message?.includes('weak')) {
        errorMessage = 'Password is too weak. Please choose a stronger password';
      } else if (error.message?.includes('Invalid password')) {
        errorMessage = 'Current password is incorrect';
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Too many attempts. Please wait before trying again';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setShowSuccess(false);
    onClose();
  };

  const isFormValid = currentPassword.trim() && 
                    newPassword.trim() && 
                    confirmPassword.trim() && 
                    !validatePasswords();

  if (showSuccess) {
    return (
      <Portal>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-medium text-black mb-2">Password Changed</h2>
            <p className="text-sm font-light text-gray-600">
              Your password has been successfully updated.
            </p>
          </div>
        </div>
      </Portal>
    );
  }

  return (
    <AuthModal
      title="Change Password"
      subtitle="Update your account password"
      onClose={handleClose}
    >
      {error && (
        <ErrorAlert
          message={error}
          className="mb-5"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <PasswordField
          label="Current Password"
          name="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter your current password"
          required
          disabled={isLoading}
          autoComplete="current-password"
        />

        <PasswordField
          label="New Password"
          name="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter your new password"
          required
          disabled={isLoading}
          autoComplete="new-password"
          minLength={8}
          showStrengthIndicator
        />

        <PasswordField
          label="Confirm New Password"
          name="confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your new password"
          required
          disabled={isLoading}
          autoComplete="new-password"
          error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : undefined}
        />

        <LoadingButton
          isLoading={isLoading}
          disabled={!isFormValid}
          loadingText="Updating..."
        >
          Change Password
        </LoadingButton>
      </form>
    </AuthModal>
  );
}