import React, { useState } from 'react';
import { Mail, User } from 'lucide-react';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { supabase } from '../lib/supabase';
import { AuthModal, FormField, PasswordField, ErrorAlert, LoadingButton, SuccessModal, SocialLoginButtons, OrDivider, FaceRegisterModal } from './auth';

interface RegisterModalProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}

// Inner component that uses reCAPTCHA (only rendered on step 2)
function RegisterModalWithRecaptcha({
  onClose,
  onSwitchToLogin,
  onSuccess,
  initialFormData,
  onGoBack
}: RegisterModalProps & {
  initialFormData: any;
  onGoBack: () => void;
}) {
  const [formData, setFormData] = useState({
    ...initialFormData,
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFaceChoice, setShowFaceChoice] = useState(false);
  const [showFaceRegister, setShowFaceRegister] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: typeof formData) => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!executeRecaptcha) {
      setError('reCAPTCHA not available. Please refresh the page and try again.');
      return;
    }

    setIsLoading(true);

    try {
      // Execute reCAPTCHA v3
      const recaptchaToken = executeRecaptcha ? await executeRecaptcha('register') : null;

      if (!recaptchaToken) {
        setError('reCAPTCHA verification failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // Call our Edge Function for registration
      const { data, error: registerError } = await supabase.functions.invoke('register-with-verification', {
        body: {
          email: formData.email.trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim() || null,
          phone: formData.phone.trim() || null,
          recaptchaToken: recaptchaToken
        }
      });

      if (registerError) {
        setError('Registration failed. Please try again.');
        setIsLoading(false);
        return;
      }

      if (data?.success) {
        // Store user ID for face registration
        // Try to get from response, or fetch from database by email
        let userId = data.userId;

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
        }

        setShowSuccess(true);

        // Show face registration choice after 2 seconds
        setTimeout(() => {
          setShowSuccess(false);
          setShowFaceChoice(true);
        }, 2000);
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

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: ''
    });
    setError(null);
    setShowSuccess(false);
    onClose();
  };

  const handleSwitchToLogin = () => {
    handleClose();
    onSwitchToLogin();
  };

  const handleSkipFaceRegistration = () => {
    if (onSuccess) onSuccess();
    handleClose();
  };

  const handleFaceRegistrationSuccess = () => {
    if (onSuccess) onSuccess();
    handleClose();
  };

  // Show Face Register Modal
  if (showFaceRegister && registeredUserId) {
    return (
      <FaceRegisterModal
        userId={registeredUserId}
        userName={formData.firstName}
        onClose={handleClose}
        onSuccess={handleFaceRegistrationSuccess}
        onSkip={handleSkipFaceRegistration}
      />
    );
  }

  // Show Face Registration Choice Modal
  if (showFaceChoice) {
    return (
      <AuthModal
        title="Enable Face Login?"
        subtitle="Add an extra layer of security and convenience"
        onClose={handleClose}
        heroImage="/images/auth-hero-register.jpg"
      >
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
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
              onClick={() => setShowFaceRegister(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-blue-500/25"
            >
              Enable Face Login
            </button>

            <button
              onClick={handleSkipFaceRegistration}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Skip for now
            </button>
          </div>

          <p className="text-xs text-center text-gray-500">
            You can always enable Face Login later in your account settings
          </p>
        </div>
      </AuthModal>
    );
  }

  return (
    <>
      <AuthModal
        title="Complete Registration"
        subtitle="Almost done! Just add your phone and verify"
        onClose={handleClose}
        heroImage="/images/auth-hero-register.jpg"
      >
        {error && (
          <ErrorAlert
            message={error}
            className="mb-4"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Pre-filled data display */}
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <p className="text-gray-600">Creating account for:</p>
            <p className="font-medium">{formData.firstName} {formData.lastName}</p>
            <p className="text-gray-600">{formData.email}</p>
          </div>

          <FormField
            label="Phone Number (Optional)"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter your phone number"
            icon={Mail}
            disabled={false}
            autoComplete="tel"
          />

          <div className="text-xs text-gray-500">
            We'll use this to send you important updates about your bookings
          </div>

          {/* reCAPTCHA v3 is invisible and runs automatically */}
          <div className="text-xs text-center text-gray-500">
            This site is protected by reCAPTCHA and the Google{' '}
            <a href="https://policies.google.com/privacy" className="underline hover:text-gray-700">Privacy Policy</a> and{' '}
            <a href="https://policies.google.com/terms" className="underline hover:text-gray-700">Terms of Service</a> apply.
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onGoBack}
              disabled={false}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>
            <LoadingButton
              isLoading={isLoading}
              loadingText="Creating account..."
              className="flex-1"
            >
              Create Account
            </LoadingButton>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By creating an account, you agree to our{' '}
            <a href="/terms" className="underline hover:text-black">Terms of Service</a> and{' '}
            <a href="/privacy-policy" className="underline hover:text-black">Privacy Policy</a>
          </p>
        </form>
      </AuthModal>

      <SuccessModal
        show={showSuccess}
        title="Account Created!"
        message="Please check your email to verify your account before signing in."
        countdown="Closing..."
      />
    </>
  );
}

// Main component with step management
export default function RegisterModal({
  onClose,
  onSwitchToLogin,
  onSuccess
}: RegisterModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: typeof formData) => ({
      ...prev,
      [name]: value
    }));
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

  const validateStep1 = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: ''
    });
    setStep(1);
    setError(null);
    onClose();
  };

  const handleSwitchToLogin = () => {
    handleClose();
    onSwitchToLogin();
  };

  const doPasswordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  // Step 2: Load reCAPTCHA and show final form
  if (step === 2) {
    return (
      <GoogleReCaptchaProvider
        reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY!}
      >
        <RegisterModalWithRecaptcha
          onClose={onClose}
          onSwitchToLogin={onSwitchToLogin}
          onSuccess={onSuccess}
          initialFormData={formData}
          onGoBack={() => setStep(1)}
        />
      </GoogleReCaptchaProvider>
    );
  }

  // Step 1: Basic info without reCAPTCHA
  return (
    <AuthModal
      title="Create Account"
      subtitle="Join PrivateCharterX today"
      onClose={handleClose}
      heroImage="/images/auth-hero-register.jpg"
    >
      {error && (
        <ErrorAlert
          message={error}
          className="mb-4"
        />
      )}

      {/* Social Login Buttons */}
      <SocialLoginButtons
        onSuccess={() => {
          if (onSuccess) onSuccess();
          handleClose();
        }}
      />

      {/* OR Divider */}
      <OrDivider />

      <form onSubmit={handleStep1Submit} className="space-y-5">
        <FormField
          label="First Name"
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="Enter your first name"
          icon={User}
          required
          disabled={false}
          autoComplete="given-name"
        />

        <FormField
          label="Last Name"
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Enter your last name"
          icon={User}
          disabled={false}
          autoComplete="family-name"
        />

        <FormField
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          icon={Mail}
          required
          disabled={false}
          autoComplete="email"
        />

        <PasswordField
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a password"
          required
          disabled={false}
          minLength={8}
          autoComplete="new-password"
          showStrengthIndicator={true}
        />

        <PasswordField
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          required
          disabled={false}
          autoComplete="new-password"
        />

        {/* Password match indicator */}
        {formData.confirmPassword && (
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${doPasswordsMatch ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={doPasswordsMatch ? 'text-green-600' : 'text-red-600'}>
              {doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={handleSwitchToLogin}
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            Already have an account?
          </button>
        </div>

        <button
          type="submit"
          disabled={!isPasswordValid || !doPasswordsMatch}
          className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </form>
    </AuthModal>
  );
}