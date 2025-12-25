import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, X, ArrowLeft, Eye, EyeOff, AlertTriangle, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VideoHero } from '../components/auth';

const videos = [
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/4936487-uhd_2160_4096_24fps.mp4',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/7456210-hd_1920_1080_25fps.mp4',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/12427495_3840_2160_24fps.mp4',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/11506224-uhd_2160_3840_60fps.mp4'
];

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    const checkTokenValidity = async () => {
      try {
        const token = searchParams.get('token');

        if (!token) {
          console.error('No reset token provided');
          setIsValidToken(false);
          return;
        }

        const { data, error } = await supabase
          .rpc('verify_reset_token', { token_value: token })
          .single();

        if (error || !data) {
          console.error('Invalid or expired reset token:', error);
          setIsValidToken(false);
          return;
        }

        if (!data.is_valid) {
          console.error('Reset token is invalid or has been used');
          setIsValidToken(false);
          return;
        }

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

  // Loading state
  if (isValidToken === null) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 lg:p-8 font-['DM_Sans']">
        <div className="w-full h-screen lg:h-[90vh] lg:max-w-7xl bg-white rounded-none lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col-reverse lg:flex-row">
          <div className="w-full lg:w-2/5 bg-white flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-gray-500">Validating reset link...</p>
          </div>
          <div className="w-full lg:w-3/5 relative h-64 lg:h-auto">
            <VideoHero videos={videos} interval={8000} />
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (isValidToken === false) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 lg:p-8 font-['DM_Sans']">
        <div className="w-full h-screen lg:h-[90vh] lg:max-w-7xl bg-white rounded-none lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col-reverse lg:flex-row">
          <div className="w-full lg:w-2/5 bg-white flex flex-col relative overflow-hidden">
            {/* Navigation */}
            <div className="flex items-center justify-between p-4 lg:p-6">
              <button
                onClick={() => navigate('/')}
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

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 lg:px-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Expired or Invalid</h2>
              <p className="text-sm text-gray-500 text-center mb-6">
                This password reset link has expired or is invalid.<br />Please request a new one.
              </p>
            </div>

            {/* Button */}
            <div className="p-4 lg:p-6 border-t border-gray-100">
              <div className="w-full max-w-sm mx-auto">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-all"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-3/5 relative h-64 lg:h-auto">
            <VideoHero videos={videos} interval={8000} />
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 lg:p-8 font-['DM_Sans']">
        <div className="w-full h-screen lg:h-[90vh] lg:max-w-7xl bg-white rounded-none lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col-reverse lg:flex-row">
          <div className="w-full lg:w-2/5 bg-white flex flex-col items-center justify-center px-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Password Updated!</h2>
            <p className="text-sm text-gray-500 text-center mb-2">
              Your password has been successfully updated.
            </p>
            <p className="text-xs text-gray-400">Redirecting to sign in...</p>
          </div>
          <div className="w-full lg:w-3/5 relative h-64 lg:h-auto">
            <VideoHero videos={videos} interval={8000} />
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 lg:p-8 font-['DM_Sans']">
      <div className="w-full h-screen lg:h-[90vh] lg:max-w-7xl bg-white rounded-none lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col-reverse lg:flex-row">

        {/* Form Section */}
        <div className="w-full lg:w-2/5 bg-white flex flex-col relative overflow-hidden">

          {/* TOP: Navigation Bar */}
          <div className="flex items-center justify-between p-4 lg:p-6">
            <button
              onClick={() => navigate('/')}
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

          {/* MIDDLE: Form Fields - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 lg:px-8">
            <div className="w-full max-w-sm mx-auto py-4">
              {/* Logo */}
              <div className="mb-6">
                <img
                  src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/PrivatecharterX_logo_vectorized.glb.png"
                  alt="PrivateCharterX"
                  className="h-10"
                />
              </div>

              {/* Title */}
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                  Create New Password
                </h1>
                <p className="text-sm text-gray-500 font-light">
                  Enter your new password below
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
                {/* New Password */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                      placeholder="Enter new password"
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

                {/* Password Requirements */}
                {password && (
                  <div className="space-y-1.5">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${req.test ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className={req.test ? 'text-green-600' : 'text-gray-400'}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                      placeholder="Confirm new password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Password match indicator */}
                {confirmPassword && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full ${doPasswordsMatch ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={doPasswordsMatch ? 'text-green-600' : 'text-red-600'}>
                      {doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* BOTTOM: Button fixed at bottom */}
          <div className="p-4 lg:p-6 border-t border-gray-100">
            <div className="w-full max-w-sm mx-auto space-y-3">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading || !isPasswordValid || !doPasswordsMatch}
                className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating Password...
                  </span>
                ) : (
                  'Update Password'
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-all"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>

        {/* Video Section */}
        <div className="w-full lg:w-3/5 relative h-64 lg:h-auto">
          <VideoHero videos={videos} interval={8000} />
        </div>

      </div>
    </div>
  );
}
