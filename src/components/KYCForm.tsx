import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, Check, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../../thefinalwebapplicationpcx-main/src/context/AuthContext';

interface KYCFormProps {
  onBack: () => void;
  onComplete: () => void;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export default function KYCForm({ onBack, onComplete }: KYCFormProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPassport, setUploadingPassport] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportUrl, setPassportUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');

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
    phoneNumber: ''
  });

  // Fetch user profile data on component mount to pre-populate form
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        // Check for existing KYC application to reflect submitted/verified state
        const { data: existing, error: existingErr } = await supabase
          .from('kyc_applications')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!existingErr && existing?.status) {
          setApplicationStatus((existing.status as any) || 'pending');
        }

        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('phone, address, city, country, postal_code')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && profile) {
          console.log('📋 KYC Form: Pre-populating with profile data:', {
            phone: profile.phone,
            address: profile.address,
            city: profile.city,
            country: profile.country,
            postalCode: profile.postal_code
          });
          setFormData(prev => ({
            ...prev,
            phoneNumber: profile.phone || '',
            address: profile.address || '',
            city: profile.city || '',
            country: profile.country || '',
            postalCode: profile.postal_code || ''
          }));
        }
      } catch (error) {
        console.error('Error fetching user profile for KYC pre-population:', error);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  // Validation functions
  const validateForm = (): boolean => {
    const requiredFields = [
      'firstName', 'lastName', 'dateOfBirth', 'nationality',
      'passportNumber', 'passportExpiry', 'address', 'city',
      'country', 'postalCode', 'phoneNumber'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    // Validate dates
    const today = new Date();
    const birthDate = new Date(formData.dateOfBirth);
    const expiryDate = new Date(formData.passportExpiry);

    if (birthDate >= today) {
      alert('Date of birth must be in the past');
      return false;
    }

    if (expiryDate <= today) {
      alert('Passport expiry date must be in the future');
      return false;
    }

    // Calculate age
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      alert('You must be at least 18 years old to complete KYC verification');
      return false;
    }

    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Enhanced upload function with progress tracking
  const uploadLargeFile = async (file: File, filePath: string): Promise<string> => {
    try {
      setUploadProgress({
        loaded: 0,
        total: file.size,
        percentage: 0
      });

      // For files larger than 50MB, use resumable upload strategy
      if (file.size > 50 * 1024 * 1024) {
        // Use multipart upload for large files
        const { error } = await supabase.storage
          .from('securedocuments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            duplex: 'half'
          });

        if (error) throw error;

        // Simulate progress for large files (Supabase doesn't provide real-time progress)
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 5;
          if (progress <= 95) {
            setUploadProgress({
              loaded: Math.floor((progress / 100) * file.size),
              total: file.size,
              percentage: progress
            });
          }
        }, 200);

        // Complete the progress
        setTimeout(() => {
          clearInterval(progressInterval);
          setUploadProgress({
            loaded: file.size,
            total: file.size,
            percentage: 100
          });
        }, 1000);

      } else {
        // Standard upload for smaller files
        const { error } = await supabase.storage
          .from('securedocuments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        // Simulate progress
        const steps = 20;
        const stepSize = file.size / steps;
        let loaded = 0;

        for (let i = 0; i < steps; i++) {
          await new Promise(resolve => setTimeout(resolve, 50));
          loaded = Math.min(loaded + stepSize, file.size);
          setUploadProgress({
            loaded,
            total: file.size,
            percentage: Math.round((loaded / file.size) * 100)
          });
        }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('securedocuments')
        .getPublicUrl(filePath);

      return publicUrl;

    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handlePassportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a valid file type: JPG, PNG, WEBP, TIFF, PDF, DOC, or DOCX');
      return;
    }

    // Validate file size (max 300MB)
    const maxSize = 300 * 1024 * 1024; // 300MB in bytes
    if (file.size > maxSize) {
      setUploadError(`File size should be less than 300MB. Your file is ${formatFileSize(file.size)}`);
      return;
    }

    // Additional security: Check file signature for images
    if (file.type.startsWith('image/')) {
      const buffer = await file.slice(0, 4).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const signatures = {
        jpeg: [0xFF, 0xD8, 0xFF],
        png: [0x89, 0x50, 0x4E, 0x47],
        webp: [0x52, 0x49, 0x46, 0x46]
      };

      let validSignature = false;
  for (const [, signature] of Object.entries(signatures)) {
        if (signature.every((byte, index) => bytes[index] === byte)) {
          validSignature = true;
          break;
        }
      }

      if (!validSignature && file.type !== 'image/tiff') {
        setUploadError('Invalid image file. The file may be corrupted or not a valid image.');
        return;
      }
    }

    setUploadingPassport(true);
    setPassportFile(file);
    setUploadProgress(null);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_passport_${Date.now()}.${fileExt}`;
      const filePath = `kyc-documents/${fileName}`;

      const publicUrl = await uploadLargeFile(file, filePath);
      setPassportUrl(publicUrl);

      // Store file metadata in database
      const { error: metadataError } = await supabase
        .from('file_uploads')
        .insert([{
          user_id: user.id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_path: filePath,
          public_url: publicUrl,
          upload_type: 'kyc_document',
          status: 'uploaded',
          metadata: {
            original_name: file.name,
            upload_timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          }
        }]);

      if (metadataError) {
        console.error('Error saving file metadata:', metadataError);
        // Don't fail the upload if metadata save fails, but log it
      }

    } catch (error: any) {
      console.error('Error uploading passport:', error);
      setUploadError(error.message || 'Failed to upload document. Please try again.');
      setPassportFile(null);
      setPassportUrl('');
    } finally {
      setUploadingPassport(false);
      setTimeout(() => setUploadProgress(null), 2000);
    }
  };

  const removeFile = async () => {
    if (passportUrl && passportFile) {
      // Optionally remove from storage
      try {
        const filePath = passportUrl.split('/').pop();
        await supabase.storage
          .from('securedocuments')
          .remove([`kyc-documents/${filePath}`]);
      } catch (error) {
        console.error('Error removing file:', error);
        // Continue anyway
      }
    }

    setPassportFile(null);
    setPassportUrl('');
    setUploadProgress(null);
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!passportUrl) {
      alert('Please upload your passport copy');
      return;
    }

    if (!user?.id) {
      alert('User not authenticated');
      return;
    }

    setIsSubmitting(true);

    try {
      // Start a transaction-like operation
      const submissionData = {
        ...formData,
        file_info: {
          name: passportFile?.name,
          size: passportFile?.size,
          type: passportFile?.type,
          uploaded_at: new Date().toISOString()
        },
        submission_metadata: {
          ip_address: 'client_ip', // You might want to get this server-side
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      };

      // 1. Save KYC data to user_documents table
      const { error: docError } = await supabase
        .from('user_documents')
        .insert([{
          user_id: user.id,
          document_type: 'kyc',
          status: 'pending',
          file_path: passportUrl,
          file_name: passportFile?.name,
          file_size: passportFile?.size,
          file_type: passportFile?.type,
          admin_notes: JSON.stringify(submissionData),
          submitted_at: new Date().toISOString()
        }]);

      if (docError) throw docError;

      // 2. Update user profile with KYC data
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          phone: formData.phoneNumber,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          postal_code: formData.postalCode,
          kyc_status: 'pending',
          kyc_submitted_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (profileError) throw profileError;

      // 3. Create KYC application record
      const { error: kycError } = await supabase
        .from('kyc_applications')
        .upsert({
          user_id: user.id,
          application_data: submissionData,
          status: 'pending',
          verification_level: 'level_1',
          documents_verified: false,
          identity_verified: false,
          address_verified: false,
          submitted_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (kycError) throw kycError;

      // 4. Update file upload status
      await supabase
        .from('file_uploads')
        .update({ status: 'processed' })
        .eq('public_url', passportUrl)
        .eq('user_id', user.id);

      // Update local status to show submitted banner
      setApplicationStatus('pending');
      
      onComplete();

    } catch (error: any) {
      console.error('Error submitting KYC:', error);
      alert(`Failed to submit KYC: ${error.message}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    if (!validateForm()) return;
    setStep(2);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header - Hidden when submitted */}
      {applicationStatus !== 'pending' && (
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting || uploadingPassport}
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold">KYC Verification</h2>
            <p className="text-gray-600">Complete your identity verification</p>
            {applicationStatus !== 'none' && (
              <div className={`inline-flex items-center mt-2 px-2 py-1 rounded text-xs font-medium ${
                applicationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                applicationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {applicationStatus === 'approved' ? 'Verified' : applicationStatus === 'pending' ? 'Submitted' : 'Rejected'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* KYC Submitted Banner */}
      {applicationStatus === 'pending' && (
        <div className="flex flex-col items-center justify-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center max-w-md w-full">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">KYC Submitted</h3>
            <p className="text-green-700 text-sm mb-6">
              Your identity verification documents have been successfully submitted. 
              Our team will review your application and notify you of the status within 24-48 hours.
            </p>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mx-auto"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Form Content - Hidden when submitted */}
      {applicationStatus !== 'pending' && (
        <>
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                1
              </div>
              <div className={`w-16 h-1 mx-2 ${step >= 2 ? 'bg-black' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
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
                placeholder="Enter your first name"
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
                placeholder="Enter your last name"
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
                max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
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
                placeholder="e.g., United States"
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
                placeholder="Enter passport number"
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
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
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
                placeholder="Enter your full address"
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
                  placeholder="City"
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
                  placeholder="Country"
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
                  placeholder="Postal Code"
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
                placeholder="+1-555-123-4567"
              />
            </div>
          </div>

          <button
            onClick={handleNextStep}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
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
                <ul className="text-blue-800 text-sm mt-1 space-y-1">
                  <li>• Upload a clear photo or scan of your passport</li>
                  <li>• Ensure all text is readable and corners are visible</li>
                  <li>• Files up to 300MB are supported</li>
                  <li>• Your document will be reviewed within 24 hours</li>
                </ul>
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600" />
                <span className="text-red-800 text-sm font-medium">Upload Error</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{uploadError}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Identity Document *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center w-full">
                {passportFile ? (
                  <div className="relative">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check size={24} className="text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">{passportFile.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{formatFileSize(passportFile.size)}</p>

                    {uploadProgress && uploadProgress.percentage < 100 && (
                      <div className="w-full max-w-xs mx-auto mb-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Uploading...</span>
                          <span>{uploadProgress.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatFileSize(uploadProgress.loaded)} / {formatFileSize(uploadProgress.total)}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={removeFile}
                      disabled={uploadingPassport}
                      className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X size={14} />
                      Remove file
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="passport-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload identity document</span>
                        <input
                          id="passport-upload"
                          ref={fileInputRef}
                          name="passport-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={handlePassportUpload}
                          disabled={uploadingPassport}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, WEBP, TIFF, PDF, DOC, DOCX up to 300MB
                    </p>
                  </>
                )}
              </div>
            </div>

            {uploadingPassport && !uploadProgress && (
              <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                <span>Preparing upload...</span>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              disabled={uploadingPassport || isSubmitting}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !passportUrl || uploadingPassport}
              className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                'Submit KYC Application'
              )}
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}