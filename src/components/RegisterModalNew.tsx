import React, { useState, useRef, useCallback } from 'react';
import { Mail, Lock, User, Phone, X, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Portal from './Portal';
import { supabase } from '../lib/supabase';
import { VideoHero } from './auth';
import FaceRegisterModal from './auth/FaceRegisterModal';

// Same videos as LoginModalNew
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

interface RegisterModalNewProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSwitchToPartnerRegister?: () => void;
  onSuccess?: () => void;
}

type RegistrationStep = 'basic-info' | 'phone-submit' | 'face-choice' | 'face-register';

// Step 2 Component
function Step2Form({
  formData,
  onClose,
  onSuccess,
  onGoBack
}: {
  formData: any;
  onClose: () => void;
  onSuccess?: () => void;
  onGoBack: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('phone-submit');
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate phone number
    if (!phone || phone.trim().length === 0) {
      setError('Phone number is required.');
      return;
    }

    setIsLoading(true);

    try {
      // Call Supabase Edge Function for registration
      const { data, error: registerError } = await supabase.functions.invoke('register-with-verification', {
        body: {
          email: formData.email.trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim() || null,
          phone: phone.trim()
        }
      });

      if (registerError) {
        console.error('Registration error:', registerError);
        setError('Registration failed. Please try again.');
        setIsLoading(false);
        return;
      }

      if (data?.success) {
        // Get user ID from response or fetch from database
        let userId = data.user_id || data.userId;

        if (!userId) {
          // Fallback: Get user ID from database using email
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', formData.email.trim())
            .single();

          if (userData && !userError) {
            userId = userData.id;
          }
        }

        if (userId) {
          setRegisteredUserId(userId);

          // Give new user 100 PVCX tokens as registration bonus
          try {
            // Insert initial balance record
            const { error: balanceError } = await supabase
              .from('pvcx_balance')
              .insert({
                user_id: userId,
                balance: 100,
                earned_from_bookings: 0,
                earned_from_co2: 0
              });

            if (!balanceError) {
              // Record the registration bonus transaction
              await supabase
                .from('pvcx_transactions')
                .insert({
                  user_id: userId,
                  type: 'admin_bonus',
                  amount: 100,
                  description: 'Welcome bonus - Registration reward',
                  metadata: { reason: 'new_user_registration' }
                });
            }
          } catch (bonusError) {
            console.error('Failed to award registration bonus:', bonusError);
            // Don't block registration if bonus fails
          }

          // Send welcome notification
          try {
            await supabase
              .from('notifications')
              .insert({
                user_id: userId,
                type: 'welcome',
                title: 'Welcome to PVCX!',
                message: `Hi ${formData.firstName}! Welcome to the PVCX platform. You've received 100 PVCX tokens as a welcome bonus. Start exploring tokenized assets, P2P marketplace, and exclusive travel services.`,
                is_read: false
              });
          } catch (notificationError) {
            console.error('Failed to send welcome notification:', notificationError);
            // Don't block registration if notification fails
          }

          // Send notification to ALL admins about new user registration
          try {
            const { data: admins } = await supabase
              .from('admin_settings')
              .select('user_id');

            if (admins && admins.length > 0) {
              const adminNotifications = admins.map(admin => ({
                user_id: admin.user_id,
                type: 'admin',
                title: '🎉 New User Registered',
                message: `${formData.firstName} ${formData.lastName} (${formData.email}) just registered and received 100 PVCX welcome bonus.`,
                is_read: false,
                metadata: {
                  new_user_id: userId,
                  new_user_email: formData.email
                }
              }));

              await supabase.from('notifications').insert(adminNotifications);
            }
          } catch (adminNotifError) {
            console.error('Failed to send admin notification:', adminNotifError);
            // Don't block registration if admin notification fails
          }

        }

        // Auto-login the user after successful registration
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email.trim(),
            password: formData.password
          });

          if (signInError) {
            console.warn('Auto-login failed, user will need to login manually:', signInError.message);
          }
        } catch (loginError) {
          console.warn('Auto-login error:', loginError);
        }

        // Close modal immediately - toast will be shown by dashboard on auth state change
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(data?.error || 'Registration failed. Please try again.');
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipFace = () => {
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleFaceSuccess = () => {
    if (onSuccess) onSuccess();
    onClose();
  };

  // Face Registration Modal
  if (currentStep === 'face-register' && registeredUserId) {
    return (
      <FaceRegisterModal
        userId={registeredUserId}
        userName={formData.firstName}
        onClose={onClose}
        onSuccess={handleFaceSuccess}
        onSkip={handleSkipFace}
      />
    );
  }

  // Face Registration Choice Modal
  if (currentStep === 'face-choice') {
    return (
      <Portal>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-['DM_Sans']">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
            <button
              onClick={onClose}
              className="absolute right-6 top-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Enable Face Login?</h2>
              <p className="text-gray-600">Add an extra layer of security and convenience</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Quick & Secure Access
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Log in instantly with your face</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Enhanced account security</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Your face data is encrypted and stored securely</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Takes less than 10 seconds to set up</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setCurrentStep('face-register')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-blue-500/25"
              >
                Enable Face Login
              </button>

              <button
                onClick={handleSkipFace}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Skip for now
              </button>
            </div>

            <p className="text-xs text-center text-gray-500 mt-4">
              You can always enable Face Login later in your account settings
            </p>
          </div>
        </div>
      </Portal>
    );
  }

  // Phone & Submit Step - Same layout as LoginModalNew (3 sections)
  return (
    <Portal>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 lg:p-8 font-['DM_Sans']">
        <div className="w-full h-screen lg:h-[90vh] lg:max-w-7xl bg-white rounded-none lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col-reverse lg:flex-row">

          {/* Form Section - 3 parts: top nav, middle form, bottom buttons */}
          <div className="w-full lg:w-2/5 bg-white flex flex-col relative overflow-hidden">

            {/* TOP: Navigation Bar */}
            <div className="flex items-center justify-between p-4 lg:p-6">
              <button
                onClick={onGoBack}
                disabled={isLoading}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* MIDDLE: Form Fields - Scrollable, centered */}
            <div className="flex-1 overflow-y-auto px-6 lg:px-8">
              <div className="w-full max-w-sm mx-auto py-4">
                {/* Title */}
                <div className="mb-6">
                  <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                    Complete Registration
                  </h1>
                  <p className="text-sm text-gray-500 font-light">
                    Step 2 of 2: Almost there!
                  </p>
                </div>

                {/* Pre-filled data display */}
                <div className="p-3 bg-gray-50 rounded-lg text-sm mb-4">
                  <p className="text-gray-600">Creating account for:</p>
                  <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                  <p className="text-gray-600">{formData.email}</p>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-3">
                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                        placeholder="Enter your phone number"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1.5">
                      Required for booking confirmations and important updates
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM: Buttons fixed at bottom */}
            <div className="p-4 lg:p-6 border-t border-gray-100">
              <div className="w-full max-w-sm mx-auto space-y-3">
                {/* Create Account Button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !phone}
                  className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>

                {/* Footer */}
                <div className="pt-2 text-center">
                  <p className="text-[10px] text-gray-400">
                    By creating an account, you agree to our{' '}
                    <a href="/terms" className="underline hover:text-gray-600">Terms</a>
                    {' & '}
                    <a href="/privacy" className="underline hover:text-gray-600">Privacy</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Video Section - Top on mobile, right on desktop */}
          <div className="w-full lg:w-3/5 relative h-64 lg:h-auto">
            <VideoHero videos={videos} interval={8000} />
          </div>

        </div>
      </div>
    </Portal>
  );
}

// Main component with step management (Step 1)
export default function RegisterModalNew({
  onClose,
  onSwitchToLogin,
  onSwitchToPartnerRegister,
  onSuccess
}: RegisterModalNewProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

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

  const passwordRequirements = getPasswordStrength(formData.password);
  const isPasswordValid = passwordRequirements.every(req => req.test);
  const doPasswordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  const handleBasicInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Move to step 2
    setStep(2);
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setStep(1);
    setError(null);
    onClose();
  };

  // Step 2: Show final form
  if (step === 2) {
    return (
      <Step2Form
        formData={formData}
        onClose={handleClose}
        onSuccess={onSuccess}
        onGoBack={() => setStep(1)}
      />
    );
  }

  // Step 1: Basic Info - Same layout as LoginModalNew (3 sections)
  return (
    <Portal>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 lg:p-8 font-['DM_Sans']">

        {/* Modal Container - Fullscreen mobile, centered desktop */}
        <div className="w-full h-screen lg:h-[90vh] lg:max-w-7xl bg-white rounded-none lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col-reverse lg:flex-row">

          {/* Form Section - 3 parts: top nav, middle form, bottom buttons */}
          <div className="w-full lg:w-2/5 bg-white flex flex-col relative overflow-hidden">

            {/* TOP: Navigation Bar */}
            <div className="flex items-center justify-between p-4 lg:p-6">
              <button
                onClick={() => {
                  handleClose();
                  navigate('/');
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* MIDDLE: Form Fields - Scrollable, centered */}
            <div className="flex-1 overflow-y-auto px-6 lg:px-8">
              <div className="w-full max-w-sm mx-auto py-4">
                {/* Title */}
                <div className="mb-6">
                  <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                    Create Account
                  </h1>
                  <p className="text-sm text-gray-500 font-light">
                    Step 1 of 2: Basic Information
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-3 mb-4">
                  {/* First Name & Last Name in One Row */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* First Name */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        First Name *
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                          placeholder="John"
                          required
                        />
                      </div>
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Last Name
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {/* Password strength indicator */}
                    {formData.password && (
                      <div className="mt-2 space-y-1">
                        {passwordRequirements.map((req, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <div className={`w-1.5 h-1.5 rounded-full ${req.test ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className={req.test ? 'text-green-600' : 'text-gray-500'}>{req.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {/* Password match indicator */}
                    {formData.confirmPassword && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${doPasswordsMatch ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={doPasswordsMatch ? 'text-green-600' : 'text-red-600'}>
                          {doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Links */}
                <div className="flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSwitchToLogin();
                    }}
                    className="text-gray-500 hover:text-gray-900 transition-colors font-light cursor-pointer"
                  >
                    Already have an account?
                  </button>
                </div>
              </div>
            </div>

            {/* BOTTOM: Buttons fixed at bottom */}
            <div className="p-4 lg:p-6 border-t border-gray-100">
              <div className="w-full max-w-sm mx-auto space-y-3">
                {/* Next Button */}
                <button
                  type="button"
                  onClick={handleBasicInfoSubmit}
                  disabled={!formData.firstName || !formData.email || !isPasswordValid || !doPasswordsMatch}
                  className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Next Step
                  <ArrowRight size={16} />
                </button>

                {/* Footer */}
                <div className="pt-2 text-center">
                  <p className="text-[10px] text-gray-400">
                    By creating an account, you agree to our{' '}
                    <a href="/terms" className="underline hover:text-gray-600">Terms</a>
                    {' & '}
                    <a href="/privacy" className="underline hover:text-gray-600">Privacy</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Video Section - Top on mobile, right on desktop */}
          <div className="w-full lg:w-3/5 relative h-64 lg:h-auto">
            <VideoHero videos={videos} interval={8000} />
          </div>

        </div>
      </div>
    </Portal>
  );
}
