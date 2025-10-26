import React, { useState } from 'react';
import { X, Building2, Upload, Check, AlertCircle, Mail, Lock, User as UserIcon, Phone, MapPin, CreditCard, Wallet } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { supabase } from '../lib/supabase';
import Portal from './Portal';
import { VideoHero } from './auth';

interface PartnerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const videos = [
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/moreVideos/8436362-uhd_3840_2160_30fps.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zLzg0MzYzNjItdWhkXzM4NDBfMjE2MF8zMGZwcy5tcDQiLCJpYXQiOjE3NjA5MTE2MjAsImV4cCI6Nzc1MjI5OTgwMjB9.ebROl6af5ZnN0T1Xd95tfZBwKmPhcCUl8oCsVAYwlMI',
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/fucking%20videos/17324151-hd_1080_1920_30fps.mp4',
];

export default function PartnerRegistrationModal({ isOpen, onClose, onSuccess }: PartnerRegistrationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Form data
  const [formData, setFormData] = useState({
    // Basic Info
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    company_name: '',
    phone: '',

    // Company Details
    partner_type: 'auto' as 'auto' | 'taxi' | 'adventure' | 'limousine' | 'other',
    business_registration: '',
    tax_id: '',
    biography: '',

    // Payment
    payment_method: 'iban' as 'iban' | 'wallet',
    iban: '',
    bank_name: '',
    account_holder: '',
    wallet_address: '',

    // KYC
    id_document_type: 'passport' as 'passport' | 'id_card' | 'drivers_license',
    id_document_number: '',
    date_of_birth: '',
    nationality: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError('Logo file size must be less than 2MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
        throw new Error('Please fill in all required fields');
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      if (!formData.business_registration || !formData.tax_id) {
        throw new Error('Business registration and tax ID are required');
      }
      if (formData.payment_method === 'iban') {
        if (!formData.iban || !formData.bank_name || !formData.account_holder) {
          throw new Error('Please fill in all bank details');
        }
      } else {
        if (!formData.wallet_address) {
          throw new Error('Please provide a wallet address');
        }
      }
      if (!formData.id_document_number || !formData.date_of_birth || !formData.address || !formData.city || !formData.country) {
        throw new Error('Please fill in all KYC details');
      }

      // reCAPTCHA verification
      if (!executeRecaptcha) {
        throw new Error('reCAPTCHA not available. Please refresh the page and try again.');
      }

      const recaptchaToken = await executeRecaptcha('partner_register');
      if (!recaptchaToken) {
        throw new Error('reCAPTCHA verification failed. Please try again.');
      }

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: 'partner'
          },
          emailRedirectTo: window.location.origin + '/glas'
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // 2. Upload logo if provided
      let logoUrl = null;
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${authData.user.id}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('partner-logos')
          .upload(fileName, logoFile);

        if (uploadError) {
          console.error('Logo upload failed:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('partner-logos')
            .getPublicUrl(fileName);
          logoUrl = publicUrl;
        }
      }

      // 3. Create partner profile
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: formData.email,
          user_role: 'partner',
          first_name: formData.first_name,
          last_name: formData.last_name,
          company_name: formData.company_name || null,
          partner_type: formData.partner_type,
          payment_method: formData.payment_method,
          iban: formData.payment_method === 'iban' ? formData.iban : null,
          wallet_address: formData.payment_method === 'wallet' ? formData.wallet_address : null,
          partner_verified: false,
          email_verified: authData.user.email_confirmed_at !== null,
          logo_url: logoUrl,
          biography: formData.biography || null,
          phone: formData.phone || null
        }, {
          onConflict: 'id'
        });

      if (profileError) throw profileError;

      // 4. Create partner details
      const { error: detailsError } = await supabase
        .from('partner_details')
        .insert({
          user_id: authData.user.id,
          business_registration: formData.business_registration,
          tax_id: formData.tax_id,
          bank_name: formData.bank_name,
          account_holder: formData.account_holder,
          id_document_type: formData.id_document_type,
          id_document_number: formData.id_document_number,
          date_of_birth: formData.date_of_birth,
          nationality: formData.nationality,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          country: formData.country,
          verification_status: 'pending'
        });

      if (detailsError) throw detailsError;

      // 5. Send welcome notification
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: authData.user.id,
            type: 'partner_welcome',
            title: 'Welcome to the Partner Program!',
            message: `Hi ${formData.first_name}! Your partner account${formData.company_name ? ` for ${formData.company_name}` : ''} has been created successfully. We'll review your application and verify your details within 2-3 business days.`,
            is_read: false
          });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }

      // 6. Create Stripe Connect Express account
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${apiUrl}/partners/create-connect-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            partnerId: authData.user.id,
            email: formData.email,
            country: formData.country || 'CH', // Default to Switzerland
            businessType: formData.company_name ? 'company' : 'individual'
          })
        });

        const stripeResult = await response.json();

        if (stripeResult.success) {
          console.log('Stripe Connect account created:', stripeResult.accountId);

          // Get onboarding link
          const onboardingResponse = await fetch(`${apiUrl}/partners/onboarding-link`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              partnerId: authData.user.id
            })
          });

          const onboardingResult = await onboardingResponse.json();

          if (onboardingResult.success) {
            // Store onboarding URL in sessionStorage for redirect after login
            sessionStorage.setItem('partner_onboarding_url', onboardingResult.url);
            console.log('Stripe onboarding link generated');
          }
        } else {
          console.error('Failed to create Stripe Connect account:', stripeResult.error);
          // Don't block registration if Stripe fails - partner can complete later
        }
      } catch (stripeError) {
        console.error('Stripe Connect account creation failed:', stripeError);
        // Continue with registration even if Stripe fails
      }

      onSuccess();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-8 font-['DM_Sans']">

        {/* Modal Container */}
        <div className="w-full max-w-7xl h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex">

          {/* LEFT SIDE - Form */}
          <div className="w-2/5 bg-white p-8 flex flex-col relative overflow-y-auto">

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Logo */}
            <div className="mb-6">
              <img
                src="/logo.svg"
                alt="PrivateCharterX"
                className="h-8"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            {/* Title */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                Become a Partner
              </h1>
              <p className="text-sm text-gray-500 font-light">
                Join our platform and list your services
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4">

              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Company Name (optional)</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="Your Company LLC"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="john@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone (optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="+1 234 567 890"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="Min. 8 characters"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirm Password *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="Repeat password"
                    required
                  />
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Company Logo (optional)</label>
                <div className="flex items-center gap-3">
                  {logoPreview && (
                    <img src={logoPreview} alt="Logo preview" className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 text-xs">{logoFile ? logoFile.name : 'Upload logo (max 2MB)'}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Biography */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">What makes you unique? (optional)</label>
                <textarea
                  value={formData.biography}
                  onChange={(e) => handleInputChange('biography', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
                  placeholder="Tell us about your company and what sets you apart..."
                  rows={3}
                />
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Service Type *</label>
                <select
                  value={formData.partner_type}
                  onChange={(e) => handleInputChange('partner_type', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  required
                >
                  <option value="auto">Auto / Car Rental</option>
                  <option value="taxi">Taxi Service</option>
                  <option value="adventure">Adventure Packages</option>
                  <option value="limousine">Limousine Service</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Business Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Business Reg. Number *</label>
                  <input
                    type="text"
                    value={formData.business_registration}
                    onChange={(e) => handleInputChange('business_registration', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="123456789"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Tax ID / VAT *</label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => handleInputChange('tax_id', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="DE123456789"
                    required
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Payment Method *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('payment_method', 'iban')}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center gap-1 transition-all text-xs ${
                      formData.payment_method === 'iban'
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="font-medium">Bank (IBAN)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('payment_method', 'wallet')}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center gap-1 transition-all text-xs ${
                      formData.payment_method === 'wallet'
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Wallet className="w-5 h-5" />
                    <span className="font-medium">Crypto</span>
                  </button>
                </div>
              </div>

              {formData.payment_method === 'iban' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">IBAN *</label>
                    <input
                      type="text"
                      value={formData.iban}
                      onChange={(e) => handleInputChange('iban', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                      placeholder="DE89 3704 0044 0532 0130 00"
                      required={formData.payment_method === 'iban'}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Bank Name *</label>
                      <input
                        type="text"
                        value={formData.bank_name}
                        onChange={(e) => handleInputChange('bank_name', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="Deutsche Bank"
                        required={formData.payment_method === 'iban'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Account Holder *</label>
                      <input
                        type="text"
                        value={formData.account_holder}
                        onChange={(e) => handleInputChange('account_holder', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="John Doe"
                        required={formData.payment_method === 'iban'}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Wallet Address *</label>
                  <input
                    type="text"
                    value={formData.wallet_address}
                    onChange={(e) => handleInputChange('wallet_address', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 font-mono"
                    placeholder="0x..."
                    required={formData.payment_method === 'wallet'}
                  />
                </div>
              )}

              {/* KYC Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">ID Document Type *</label>
                  <select
                    value={formData.id_document_type}
                    onChange={(e) => handleInputChange('id_document_type', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    required
                  >
                    <option value="passport">Passport</option>
                    <option value="id_card">ID Card</option>
                    <option value="drivers_license">Driver's License</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Document Number *</label>
                  <input
                    type="text"
                    value={formData.id_document_number}
                    onChange={(e) => handleInputChange('id_document_number', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="A12345678"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Nationality *</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="German"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Address *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="123 Main Street"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="Munich"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Postal Code *</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="80331"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Country *</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="Germany"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Partner Account...
                  </span>
                ) : (
                  'Submit Application'
                )}
              </button>

              {/* Footer */}
              <div className="pt-4 text-center">
                <p className="text-[10px] text-gray-400">
                  By submitting, you agree to our{' '}
                  <a href="/terms" className="underline hover:text-gray-600">Terms</a>
                  {' & '}
                  <a href="/privacy" className="underline hover:text-gray-600">Privacy Policy</a>
                </p>
              </div>
            </form>
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
