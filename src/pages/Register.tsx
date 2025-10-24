import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Mail, User } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { supabase } from '../lib/supabase';
import { AuthPageLayout, FormField, PasswordField, ErrorAlert, LoadingButton, SuccessModal } from '../components/auth';

export default function Register() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Check if already authenticated
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsAuthenticated(!!session));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!executeRecaptcha) {
      setError('reCAPTCHA not available. Please refresh the page and try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Execute reCAPTCHA v3
      const recaptchaToken = executeRecaptcha ? await executeRecaptcha('register') : null;
      
      if (!recaptchaToken) {
        setError('reCAPTCHA verification failed. Please try again.');
        return;
      }

      // Call our Edge Function for registration
      const { data, error: registerError } = await supabase.functions.invoke('register-with-verification', {
        body: {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim() || null,
          recaptchaToken: recaptchaToken
        }
      });

      if (registerError) throw registerError;

      if (data?.success) {
        setShowSuccess(true);
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        setTimeout(() => {
          setShowSuccess(false);
          navigate('/login');
        }, 3000);
      } else {
        setError(data?.error || 'Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const doPasswordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  return (
    <AuthPageLayout
      title="Create an Account"
      subtitle="Join PrivateCharterX today"
    >
      {error && (
        <ErrorAlert
          message={error}
          className="mb-4"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="First Name"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Enter your first name"
            icon={User}
            required
            disabled={isSubmitting}
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
            disabled={isSubmitting}
            autoComplete="family-name"
          />
        </div>

        <FormField
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          icon={Mail}
          required
          disabled={isSubmitting}
          autoComplete="email"
        />

        <PasswordField
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a password"
          required
          disabled={isSubmitting}
          minLength={6}
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
          disabled={isSubmitting}
          autoComplete="new-password"
          className="relative"
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

        {/* reCAPTCHA v3 is invisible and runs automatically */}
        <div className="text-xs text-center text-gray-500">
          This site is protected by reCAPTCHA and the Google{' '}
          <a href="https://policies.google.com/privacy" className="underline hover:text-gray-700">Privacy Policy</a> and{' '}
          <a href="https://policies.google.com/terms" className="underline hover:text-gray-700">Terms of Service</a> apply.
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link to="/login" className="font-medium text-black hover:text-gray-800">
              Already have an account?
            </Link>
          </div>
        </div>

        <LoadingButton
          isLoading={isSubmitting}
          loadingText="Creating account..."
        >
          Create Account
        </LoadingButton>

        <p className="text-xs text-gray-500 text-center">
          By creating an account, you agree to our{' '}
          <a href="/terms" className="underline hover:text-black">Terms of Service</a> and{' '}
          <a href="/privacy-policy" className="underline hover:text-black">Privacy Policy</a>
        </p>
      </form>

      <SuccessModal
        show={showSuccess}
        title="Account Created!"
        message="Welcome to PrivateCharterX! Please check your email to verify your account, then you can sign in."
        countdown="Redirecting to login..."
      />
    </AuthPageLayout>
  );
}