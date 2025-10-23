import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, Check, AlertTriangle, FileText, User, Calendar, MapPin, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface KYCVerificationProps {
  onBack: () => void;
  onComplete: () => void;
}

export default function KYCVerification({ onBack, onComplete }: KYCVerificationProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPassport, setUploadingPassport] = useState(false);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportUrl, setPassportUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    passportNumber: '',
    passportExpiry: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    phoneNumber: '',
    occupation: '',
    purposeOfTravel: ''
  });

  // Fetch user profile data on component mount to pre-populate form
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('phone, address, city, country, postal_code')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && profile) {
          console.log('📋 KYC Verification: Pre-populating with profile data:', {
            phone: profile.phone,
            address: profile.address,
            city: profile.city,
            country: profile.country,
            postalCode: profile.postal_code
          });
        }

        // Prepopulate form with both user data and profile data
        setFormData(prev => ({
          ...prev,
          firstName: user?.first_name || '',
          lastName: user?.last_name || '',
          phoneNumber: profile?.phone || '',
          address: profile?.address || '',
          city: profile?.city || '',
          country: profile?.country || '',
          postalCode: profile?.postal_code || ''
        }));

        console.log('📋 KYC Verification: Pre-populating with user data:', formData);

      } catch (error) {
        console.error('Error fetching user profile for KYC pre-population:', error);
      }
    };

    fetchUserProfile();
  }, [user?.id, user?.first_name, user?.last_name]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePassportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Please upload a valid image or PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size should be less than 10MB');
      return;
    }

    setUploadingPassport(true);
    setPassportFile(file);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}_passport_${Date.now()}.${fileExt}`;
      const filePath = `kyc-documents/${fileName}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
          }
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setPassportUrl(publicUrl);

      // Save document record to database
      const { error: docError } = await supabase
        .from('documents')
        .insert([{
          user_id: user?.id,
          document_type: 'passport',
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending'
        }]);

      if (docError) throw docError;

    } catch (error) {
      console.error('Error uploading passport:', error);
      alert('Failed to upload passport. Please try again.');
    } finally {
      setUploadingPassport(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async () => {
    if (!passportUrl) {
      alert('Please upload your passport copy');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save KYC form data as a document
      const { error: kycError } = await supabase
        .from('documents')
        .insert([{
          user_id: user?.id,
          document_type: 'kyc_form',
          file_path: `kyc-data/${user?.id}_${Date.now()}.json`,
          file_name: 'kyc_form.json',
          file_size: JSON.stringify(formData).length,
          mime_type: 'application/json',
          status: 'verified', // Auto-verify KYC forms
          verification_notes: JSON.stringify(formData),
          verified_at: new Date().toISOString()
        }]);

      if (kycError) throw kycError;

      // Update user profile with KYC data
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user?.id,
          phone: formData.phoneNumber,
          address: formData.address,
          city: formData.city,
          country: formData.country
        });

      if (profileError) throw profileError;

      onComplete();
    } catch (error) {
      console.error('Error submitting KYC:', error);
      alert('Failed to submit KYC. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold">KYC Verification</h2>
          <p className="text-gray-600">Complete your identity verification (Required for all users)</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 1 ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
            }`}>
            1
          </div>
          <div className={`w-16 h-1 ${step >= 2 ? 'bg-black' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 2 ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
            }`}>
            2
          </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-6">
          <h3 className="text-xl font-bold mb-4">Personal Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nationality *
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passport Number *
              </label>
              <input
                type="text"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passport Expiry *
              </label>
              <input
                type="date"
                name="passportExpiry"
                value={formData.passportExpiry}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Occupation *
              </label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose of Travel *
              </label>
              <select
                name="purposeOfTravel"
                value={formData.purposeOfTravel}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">Select purpose</option>
                <option value="business">Business</option>
                <option value="leisure">Leisure</option>
                <option value="medical">Medical</option>
                <option value="emergency">Emergency</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Address Information</h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Continue to Document Upload
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <h3 className="text-xl font-bold mb-4">Document Upload</h3>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Document Requirements</h4>
                <p className="text-blue-800 text-sm mt-1">
                  Please upload a clear photo or scan of your passport. This is mandatory for all users to comply with aviation regulations.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passport Copy *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                {passportFile ? (
                  <div className="relative">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check size={24} className="text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600">{passportFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(passportFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={() => {
                        setPassportFile(null);
                        setPassportUrl('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-sm text-red-600 hover:text-red-800 mt-2"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="passport-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                      >
                        <span>Upload passport copy</span>
                        <input
                          id="passport-upload"
                          ref={fileInputRef}
                          name="passport-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*,.pdf"
                          onChange={handlePassportUpload}
                          disabled={uploadingPassport}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, PDF up to 10MB
                    </p>
                  </>
                )}
              </div>
            </div>

            {uploadingPassport && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-blue-600 mb-2">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Important Notice</h4>
                <ul className="text-yellow-800 text-sm mt-1 space-y-1">
                  <li>• Clear, high-quality image or scan required</li>
                  <li>• All text must be clearly readable</li>
                  <li>• Document must be valid and not expired</li>
                  <li>• This is mandatory for aviation security compliance</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !passportUrl}
              className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                'Complete KYC Verification'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}