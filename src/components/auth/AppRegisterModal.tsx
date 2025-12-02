import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, User, Mail, MapPin, Phone, Check, Shield, Eye, EyeOff } from 'lucide-react';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import Portal from '../Portal';
import { supabase } from '../../lib/supabase';

const RECAPTCHA_SITE_KEY = '6LdA4fcrAAAAAEE-ojHle6bq-Xbhdz2yS5myYlSG';

// Background videos for each step
const stepVideos = [
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/moreVideos/8436362-uhd_3840_2160_30fps.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zLzg0MzYzNjItdWhkXzM4NDBfMjE2MF8zMGZwcy5tcDQiLCJpYXQiOjE3NjA5MTE2MjAsImV4cCI6Nzc1MjI5OTgwMjB9.ebROl6af5ZnN0T1Xd95tfZBwKmPhcCUl8oCsVAYwlMI',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/fucking%20videos/17324151-hd_1080_1920_30fps.mp4',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/moreVideos/7875576-hd_1920_1080_25fps.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zLzc4NzU1NzYtaGRfMTkyMF8xMDgwXzI1ZnBzLm1wNCIsImlhdCI6MTc2MDkxMzc2NiwiZXhwIjo3NzUyMzAwMDE2Nn0.acimIaa-fPSN47voHxAUiNjrkKjC98fo2aNQyVO0a-A',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/12427495_3840_2160_24fps.mp4',
];

interface AppRegisterModalProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}

type Step = 1 | 2 | 3 | 4;

// Step 1: Name & Email
const Step1NameEmail = ({
  formData,
  setFormData,
  onNext,
  onSwitchToLogin,
  error,
  setError
}: {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  onSwitchToLogin: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleNext = () => {
    if (!formData.firstName.trim()) {
      setError('Please enter your first name');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div className="flex-1 flex flex-col justify-end p-6 pb-10">
      {/* Welcome Text */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-white/70 text-base">Join the future of luxury travel</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Name Row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
              <div className="flex items-center px-4 py-3.5">
                <User size={18} className="text-white/50 mr-3" />
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="First name"
                  className="flex-1 bg-transparent text-white placeholder-white/50 text-base outline-none"
                />
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
              <div className="flex items-center px-4 py-3.5">
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Last name"
                  className="flex-1 bg-transparent text-white placeholder-white/50 text-base outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="flex items-center px-4 py-3.5">
            <Mail size={18} className="text-white/50 mr-3" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email address"
              className="flex-1 bg-transparent text-white placeholder-white/50 text-base outline-none"
            />
          </div>
        </div>

        {/* Password */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="flex items-center px-4 py-3.5">
            <Shield size={18} className="text-white/50 mr-3" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Create password"
              className="flex-1 bg-transparent text-white placeholder-white/50 text-base outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1"
            >
              {showPassword ? (
                <EyeOff size={18} className="text-white/50" />
              ) : (
                <Eye size={18} className="text-white/50" />
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        className="w-full mt-6 py-4 bg-white text-black rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        Continue
        <ArrowRight size={18} />
      </button>

      {/* Switch to Login */}
      <button
        onClick={onSwitchToLogin}
        className="mt-4 text-center text-white/70 text-sm"
      >
        Already have an account? <span className="text-white font-medium">Sign in</span>
      </button>
    </div>
  );
};

// Step 2: Address & Country
const Step2Address = ({
  formData,
  setFormData,
  onNext,
  onBack,
  error,
  setError
}: {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}) => {
  const countries = [
    'Switzerland', 'Germany', 'Austria', 'France', 'Italy', 'United Kingdom',
    'United States', 'Netherlands', 'Belgium', 'Spain', 'Portugal', 'Other'
  ];

  const handleNext = () => {
    if (!formData.country) {
      setError('Please select your country');
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div className="flex-1 flex flex-col justify-end p-6 pb-10">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-14 left-4 p-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20"
      >
        <ArrowLeft size={20} className="text-white" />
      </button>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Where are you based?</h1>
        <p className="text-white/70 text-base">This helps us personalize your experience</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Country Select */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="flex items-center px-4 py-3.5">
            <MapPin size={18} className="text-white/50 mr-3" />
            <select
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="flex-1 bg-transparent text-white text-base outline-none appearance-none cursor-pointer"
              style={{ WebkitAppearance: 'none' }}
            >
              <option value="" className="bg-gray-900">Select country</option>
              {countries.map(country => (
                <option key={country} value={country} className="bg-gray-900">{country}</option>
              ))}
            </select>
          </div>
        </div>

        {/* City */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="flex items-center px-4 py-3.5">
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="City (optional)"
              className="flex-1 bg-transparent text-white placeholder-white/50 text-base outline-none"
            />
          </div>
        </div>

        {/* Address */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="flex items-center px-4 py-3.5">
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street address (optional)"
              className="flex-1 bg-transparent text-white placeholder-white/50 text-base outline-none"
            />
          </div>
        </div>

        {/* Postal Code */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="flex items-center px-4 py-3.5">
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="Postal code (optional)"
              className="flex-1 bg-transparent text-white placeholder-white/50 text-base outline-none"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        className="w-full mt-6 py-4 bg-white text-black rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        Continue
        <ArrowRight size={18} />
      </button>
    </div>
  );
};

// Step 3: Phone Number
const Step3Phone = ({
  formData,
  setFormData,
  onNext,
  onBack,
  error,
  setError
}: {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}) => {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendOTP = async () => {
    if (!formData.phone || formData.phone.length < 8) {
      setError('Please enter a valid phone number');
      return;
    }
    setError(null);
    setIsSending(true);

    // Simulate OTP sending (in production, integrate with SMS service)
    setTimeout(() => {
      setOtpSent(true);
      setIsSending(false);
    }, 1500);
  };

  const handleVerifyOTP = () => {
    // For MVP, accept any 4+ digit code
    if (otp.length >= 4) {
      setError(null);
      onNext();
    } else {
      setError('Please enter a valid verification code');
    }
  };

  const handleSkip = () => {
    // Allow skipping phone verification for now
    onNext();
  };

  return (
    <div className="flex-1 flex flex-col justify-end p-6 pb-10">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-14 left-4 p-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20"
      >
        <ArrowLeft size={20} className="text-white" />
      </button>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {otpSent ? 'Enter verification code' : 'Add your phone'}
        </h1>
        <p className="text-white/70 text-base">
          {otpSent
            ? `We sent a code to ${formData.phone}`
            : 'For booking confirmations and updates'}
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {!otpSent ? (
          <>
            {/* Phone Input */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
              <div className="flex items-center px-4 py-3.5">
                <Phone size={18} className="text-white/50 mr-3" />
                <span className="text-white/70 mr-2">+</span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="Phone number"
                  className="flex-1 bg-transparent text-white placeholder-white/50 text-base outline-none"
                />
              </div>
            </div>

            {/* Info Bubble */}
            <div className="bg-gray-100/10 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/10">
              <p className="text-white/60 text-sm">
                We'll send a verification code to confirm your number. Standard SMS rates may apply.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* OTP Input */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
              <div className="flex items-center px-4 py-3.5">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="Enter code"
                  className="flex-1 bg-transparent text-white placeholder-white/50 text-2xl text-center tracking-[0.5em] outline-none font-mono"
                  maxLength={6}
                />
              </div>
            </div>

            {/* Resend */}
            <button
              onClick={() => setOtpSent(false)}
              className="text-white/70 text-sm text-center w-full"
            >
              Didn't receive code? <span className="text-white">Resend</span>
            </button>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!otpSent ? (
        <>
          <button
            onClick={handleSendOTP}
            disabled={isSending}
            className="w-full mt-6 py-4 bg-white text-black rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {isSending ? (
              <>
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Send Code
                <ArrowRight size={18} />
              </>
            )}
          </button>
          <button
            onClick={handleSkip}
            className="mt-3 text-center text-white/50 text-sm"
          >
            Skip for now
          </button>
        </>
      ) : (
        <button
          onClick={handleVerifyOTP}
          className="w-full mt-6 py-4 bg-white text-black rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          Verify
          <Check size={18} />
        </button>
      )}
    </div>
  );
};

// Step 4: Terms & Privacy + Submit
const Step4Terms = ({
  formData,
  setFormData,
  onBack,
  onSubmit,
  error,
  setError,
  isLoading
}: {
  formData: any;
  setFormData: (data: any) => void;
  onBack: () => void;
  onSubmit: () => void;
  error: string | null;
  setError: (error: string | null) => void;
  isLoading: boolean;
}) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedMarketing, setAcceptedMarketing] = useState(false);

  const handleSubmit = () => {
    if (!acceptedTerms || !acceptedPrivacy) {
      setError('Please accept the Terms and Privacy Policy');
      return;
    }
    setFormData({ ...formData, acceptedMarketing });
    setError(null);
    onSubmit();
  };

  return (
    <div className="flex-1 flex flex-col justify-end p-6 pb-10">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-14 left-4 p-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20"
      >
        <ArrowLeft size={20} className="text-white" />
      </button>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Almost there!</h1>
        <p className="text-white/70 text-base">Review and accept our terms</p>
      </div>

      {/* Terms Checkboxes */}
      <div className="space-y-4">
        {/* Terms of Service */}
        <button
          onClick={() => setAcceptedTerms(!acceptedTerms)}
          className="w-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4 flex items-start gap-3 text-left"
        >
          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            acceptedTerms ? 'bg-white border-white' : 'border-white/50'
          }`}>
            {acceptedTerms && <Check size={14} className="text-black" />}
          </div>
          <div>
            <p className="text-white font-medium">Terms of Service</p>
            <p className="text-white/60 text-sm mt-1">
              I agree to the <span className="underline">Terms of Service</span> and understand how PrivateCharterX works.
            </p>
          </div>
        </button>

        {/* Privacy Policy */}
        <button
          onClick={() => setAcceptedPrivacy(!acceptedPrivacy)}
          className="w-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4 flex items-start gap-3 text-left"
        >
          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            acceptedPrivacy ? 'bg-white border-white' : 'border-white/50'
          }`}>
            {acceptedPrivacy && <Check size={14} className="text-black" />}
          </div>
          <div>
            <p className="text-white font-medium">Privacy Policy</p>
            <p className="text-white/60 text-sm mt-1">
              I have read and accept the <span className="underline">Privacy Policy</span>.
            </p>
          </div>
        </button>

        {/* Marketing (Optional) */}
        <button
          onClick={() => setAcceptedMarketing(!acceptedMarketing)}
          className="w-full bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 flex items-start gap-3 text-left"
        >
          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            acceptedMarketing ? 'bg-white border-white' : 'border-white/30'
          }`}>
            {acceptedMarketing && <Check size={14} className="text-black" />}
          </div>
          <div>
            <p className="text-white/80 font-medium">Marketing emails (optional)</p>
            <p className="text-white/50 text-sm mt-1">
              Receive exclusive offers, empty legs, and travel inspiration.
            </p>
          </div>
        </button>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || !acceptedTerms || !acceptedPrivacy}
        className="w-full mt-6 py-4 bg-white text-black rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            Creating account...
          </>
        ) : (
          <>
            Create Account
            <Check size={18} />
          </>
        )}
      </button>

      {/* reCAPTCHA notice */}
      <p className="mt-4 text-white/40 text-xs text-center">
        Protected by reCAPTCHA. Google <span className="underline">Privacy</span> & <span className="underline">Terms</span> apply.
      </p>
    </div>
  );
};

// Main Registration Component with reCAPTCHA
function AppRegisterForm({
  onClose,
  onSwitchToLogin,
  onSuccess
}: AppRegisterModalProps) {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    country: '',
    city: '',
    address: '',
    postalCode: '',
    phone: '',
    acceptedMarketing: false
  });

  const handleSubmit = async () => {
    if (!executeRecaptcha) {
      setError('reCAPTCHA is loading. Please wait.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const recaptchaToken = await executeRecaptcha('register');

      if (!recaptchaToken) {
        setError('reCAPTCHA verification failed.');
        setIsLoading(false);
        return;
      }

      // Call registration edge function
      const { data, error: registerError } = await supabase.functions.invoke('register-with-verification', {
        body: {
          email: formData.email.trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim() || null,
          phone: formData.phone.trim() || null,
          recaptchaToken
        }
      });

      if (registerError) {
        setError('Registration failed. Please try again.');
        setIsLoading(false);
        return;
      }

      if (data?.success) {
        let userId = data.user_id || data.userId;

        if (!userId) {
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('email', formData.email.trim())
            .single();

          if (userData) {
            userId = userData.id;
          }
        }

        if (userId) {
          // Update user profile with address info
          await supabase
            .from('users')
            .update({
              country: formData.country,
              city: formData.city,
              address: formData.address,
              postal_code: formData.postalCode
            })
            .eq('id', userId);

          // Give welcome bonus
          try {
            await supabase.from('pvcx_balance').insert({
              user_id: userId,
              balance: 100,
              earned_from_bookings: 0,
              earned_from_co2: 0
            });

            await supabase.from('pvcx_transactions').insert({
              user_id: userId,
              type: 'admin_bonus',
              amount: 100,
              description: 'Welcome bonus - Registration reward',
              metadata: { reason: 'new_user_registration' }
            });
          } catch (e) {
            console.error('Bonus error:', e);
          }

          // Welcome notification
          try {
            await supabase.from('notifications').insert({
              user_id: userId,
              type: 'welcome',
              title: 'Welcome to PrivateCharterX!',
              message: `Hi ${formData.firstName}! You've received 100 PVCX tokens as a welcome bonus.`,
              is_read: false
            });
          } catch (e) {
            console.error('Notification error:', e);
          }
        }

        // Auto-login
        await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password
        });

        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(data?.error || 'Registration failed.');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] bg-black font-['DM_Sans']">
        {/* Background Video */}
        <div className="absolute inset-0">
          <video
            key={step}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={stepVideos[(step - 1) % stepVideos.length]} type="video/mp4" />
          </video>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        </div>

        {/* Progress Indicator */}
        <div className="absolute top-12 left-0 right-0 px-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  s <= step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="relative h-full flex flex-col">
          {step === 1 && (
            <Step1NameEmail
              formData={formData}
              setFormData={setFormData}
              onNext={() => setStep(2)}
              onSwitchToLogin={onSwitchToLogin}
              error={error}
              setError={setError}
            />
          )}
          {step === 2 && (
            <Step2Address
              formData={formData}
              setFormData={setFormData}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
              error={error}
              setError={setError}
            />
          )}
          {step === 3 && (
            <Step3Phone
              formData={formData}
              setFormData={setFormData}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
              error={error}
              setError={setError}
            />
          )}
          {step === 4 && (
            <Step4Terms
              formData={formData}
              setFormData={setFormData}
              onBack={() => setStep(3)}
              onSubmit={handleSubmit}
              error={error}
              setError={setError}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </Portal>
  );
}

// Export with reCAPTCHA provider
export default function AppRegisterModal(props: AppRegisterModalProps) {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <AppRegisterForm {...props} />
    </GoogleReCaptchaProvider>
  );
}
