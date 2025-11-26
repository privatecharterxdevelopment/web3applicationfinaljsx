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
  const [kycStatus, setKycStatus] = useState<'not_started' | 'submitted' | 'verified' | 'rejected'>('not_started');
  const [submittedData, setSubmittedData] = useState<any>(null);
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

  // Fetch user profile data and KYC status on component mount
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        // Check for existing KYC submission
        const { data: kycDoc, error: kycError } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .eq('document_type', 'kyc_form')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!kycError && kycDoc) {
          console.log('📋 KYC Status: Found existing submission', kycDoc);
          setKycStatus(kycDoc.status === 'verified' ? 'verified' : 'submitted');
          if (kycDoc.verification_notes) {
            try {
              const parsedData = JSON.parse(kycDoc.verification_notes);
              setSubmittedData(parsedData);
              setFormData(parsedData);
            } catch (e) {
              console.error('Error parsing KYC data:', e);
            }
          }
        }

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

        // Prepopulate form with both user data and profile data (only if not already submitted)
        if (kycStatus === 'not_started') {
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
        }

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

      // Update user profile with KYC data AND set kyc_status to verified
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user?.id,
          phone: formData.phoneNumber,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          postal_code: formData.postalCode,
          kyc_status: 'verified',
          kyc_verified_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      console.log('✅ KYC Verification complete - user_profiles.kyc_status set to verified');

      onComplete();
    } catch (error) {
      console.error('Error submitting KYC:', error);
      alert('Failed to submit KYC. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <span className="text-xs text-gray-500 mt-1">Personal Info</span>
          </div>
          <div className={`w-20 h-0.5 mx-2 ${step >= 2 ? 'bg-black' : 'bg-gray-200'}`}></div>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
            <span className="text-xs text-gray-500 mt-1">Documents</span>
          </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Personal Information</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nationality *</label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Passport Number *</label>
              <input
                type="text"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Passport Expiry *</label>
              <input
                type="date"
                name="passportExpiry"
                value={formData.passportExpiry}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Occupation *</label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Purpose *</label>
              <select
                name="purposeOfTravel"
                value={formData.purposeOfTravel}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
              >
                <option value="">Select</option>
                <option value="business">Business</option>
                <option value="leisure">Leisure</option>
                <option value="medical">Medical</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Street Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Country *</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Postal Code *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-black text-white py-2.5 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors mt-4"
          >
            Continue to Document Upload
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Document Upload</h3>

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-blue-800 text-xs">
                Upload a clear photo or scan of your passport. Required for compliance.
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-center px-4 py-4 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
              <div className="text-center">
                {passportFile ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Check size={18} className="text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{passportFile.name}</p>
                      <p className="text-xs text-gray-500">{(passportFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={() => {
                        setPassportFile(null);
                        setPassportUrl('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-xs text-red-600 hover:text-red-800 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <label
                      htmlFor="passport-upload"
                      className="cursor-pointer text-sm font-medium text-black hover:text-gray-700"
                    >
                      Click to upload passport
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
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
                  </>
                )}
              </div>
            </div>

            {uploadingPassport && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-blue-600 mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <ul className="text-yellow-800 text-xs space-y-0.5">
                <li>• Clear, readable image required</li>
                <li>• Document must be valid and not expired</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !passportUrl}
              className="flex-1 bg-black text-white py-2.5 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                'Complete Verification'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}