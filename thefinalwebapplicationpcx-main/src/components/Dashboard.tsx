import React, { useState, useEffect, useRef } from 'react';
import { bookingService } from '../services/bookingService';
import { BookingRequest } from '../types/booking';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
  History,
  Settings,
  Wallet,
  LogOut,
  CheckCircle,
  AlertCircle,
  X,
  ExternalLink,
  Home,
  FileText,
  RefreshCw,
  Loader2,
  Globe,
  User,
  Shield,
  Copy,
  Check,
  Link,
  Download,
  Plane,
  Zap,
  Car,
  Eye,
  Upload,
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  FileCheck,
  Coins,
  Award,
  Leaf,
  Percent,
  Star,
  Gift,
  Wifi,
  WifiOff,
  Plus,
  Filter,
  Search,
  ChevronDown,
  Trash2,
  TreePine,
  Globe2,
  Send,
  DollarSign,
  Navigation,
  Users,
  TrendingUp,
  PawPrint,
  Briefcase,
  Phone,
  Mail,
  Crown,
  Gem,
  Sparkles,
  ChevronRight,
  MoreHorizontal,
  Wind,
  Droplets,
  Gauge,
  MessageCircle,
  Bell,
  Heart,
  Menu as MenuIcon
} from 'lucide-react';
import { getAirportByCode, getRouteCoordinates, calculateDistance } from '../utils/airportLookup';
import RoutePreviewMap from './RoutePreviewMap';
import ProfileSettings from './ProfileSettings';
import { useAccount, useDisconnect } from 'wagmi';
import { web3Service } from '../lib/web3';
import MapboxMap from './Map';

// Global declarations
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Wallet connection is handled by WalletMenu component via wagmi


// Type definitions
interface UserRequest {
  id: string;
  uuid: string;
  user_id: string;
  type: 'jets' | 'emptyleg' | 'helicopter' | 'cars' | 'adventures' | 'co2-certificate';
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'rejected';
  data: any;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  admin_notes?: string;
  admin_id?: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  aircraft_model?: string;
  aircraft_type?: string;
  capacity?: string;
  range?: string;
  speed?: string;
  email_recipient?: string;
  timestamp?: string;
}

interface UserCO2Stats {
  id: string;
  user_id: string;
  total_requests: number;
  pending_requests: number;
  completed_certificates: number;
  total_co2_offset_kg: number;
  total_trees_equivalent: number;
  total_spent: number;
  last_request_date?: string;
  last_certificate_date?: string;
  created_at: string;
  updated_at: string;
}

interface NFTMembership {
  tokenId: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  benefits: {
    emptyLegDiscount: number;
    freeTransfers: number;
    priorityBooking: boolean;
    conciergeService: boolean;
    loungeAccess: boolean;
  };
  expiresAt?: string;
  acquired: string;
}

interface WalletAssets {
  nfts: NFTMembership[];
  walletCertificates: any[];
  balance: string;
}

interface LocationData {
  city: string;
  country: string;
  ip: string;
  latitude?: number;
  longitude?: number;
  loading: boolean;
}

const KYCForm: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPassport, setUploadingPassport] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ loaded: number, total: number, percentage: number } | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportUrl, setPassportUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: '', // Will be populated from profile
    dateOfBirth: '',
    nationality: '',
    passportNumber: '',
    passportExpiry: '',
    address: '',
    city: '',
    country: '',
    postalCode: ''
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');

  // Helper to determine if form should be locked
  const isFormLocked = applicationStatus === 'pending' || applicationStatus === 'approved';

  // Fetch user profile data and existing KYC application on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        // Fetch both profile data and existing KYC application
        const [profileResult, kycResult] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('phone, address, city, country, postal_code')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('kyc_applications')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()
        ]);

        // Handle profile data
        if (!profileResult.error && profileResult.data) {
          console.log('📋 KYC Form: Pre-populating with profile data:', {
            phone: profileResult.data.phone,
            address: profileResult.data.address,
            city: profileResult.data.city,
            country: profileResult.data.country,
            postalCode: profileResult.data.postal_code
          });
        }

        // Handle existing KYC application
        if (!kycResult.error && kycResult.data) {
          console.log('📋 KYC Form: Found existing KYC application:', kycResult.data.status);
          setExistingApplication(kycResult.data);
          setApplicationStatus(kycResult.data.status || 'pending');

          // Pre-populate form with existing application data
          const appData = kycResult.data.application_data || {};
          setFormData(prev => ({
            ...prev,
            phone: appData.phone || prev.phone,
            address: appData.address || prev.address,
            city: appData.city || prev.city,
            country: appData.country || prev.country,
            postalCode: appData.postalCode || prev.postalCode,
            dateOfBirth: appData.dateOfBirth || '',
            nationality: appData.nationality || '',
            passportNumber: appData.passportNumber || '',
            passportExpiry: appData.passportExpiry || ''
          }));
        } else {
          // No existing application, use profile data
          if (!profileResult.error && profileResult.data) {
            const profile = profileResult.data;
            setFormData(prev => ({
              ...prev,
              phone: profile.phone || '',
              address: profile.address || '',
              city: profile.city || '',
              country: profile.country || '',
              postalCode: profile.postal_code || ''
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user?.id]);

  const validateForm = (): boolean => {
    const requiredFields = [
      'dateOfBirth', 'nationality', 'passportNumber', 'passportExpiry',
      'address', 'city', 'country', 'postalCode'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]?.trim()) {
        alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

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

    var age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      alert('You must be at least 18 years old to complete KYC verification');
      return false;
    }

    if (formData.passportNumber.length < 6) {
      alert('Please enter a valid passport number');
      return false;
    }

    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Prevent editing of protected fields
    if (['firstName', 'lastName', 'email', 'phone'].includes(name)) {
      return;
    }

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

  const uploadLargeFile = async (file: File, filePath: string): Promise<string> => {
    try {
      // Upload to securedocuments bucket
      const { data, error } = await supabase.storage
        .from('securedocuments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('Upload failed: No data returned');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('securedocuments')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to get public URL');
      }

      return publicUrl;

    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handlePassportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');

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

    const maxSize = 300 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(`File size should be less than 300MB. Your file is ${formatFileSize(file.size)}`);
      return;
    }

    const minSize = 1024;
    if (file.size < minSize) {
      setUploadError('File is too small. Please upload a valid document.');
      return;
    }

    // File signature validation for images
    if (file.type.startsWith('image/')) {
      try {
        const buffer = await file.slice(0, 8).arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const signatures = {
          jpeg: [0xFF, 0xD8, 0xFF],
          png: [0x89, 0x50, 0x4E, 0x47],
          webp: [0x52, 0x49, 0x46, 0x46],
          tiff1: [0x49, 0x49, 0x2A, 0x00],
          tiff2: [0x4D, 0x4D, 0x00, 0x2A]
        };

        let validSignature = false;
        for (const [format, signature] of Object.entries(signatures)) {
          if (signature.every((byte, index) => bytes[index] === byte)) {
            validSignature = true;
            break;
          }
        }

        if (!validSignature) {
          setUploadError('Invalid image file. The file may be corrupted or not a valid image.');
          return;
        }
      } catch (error) {
        console.error('Error checking file signature:', error);
        setUploadError('Error validating file. Please try again.');
        return;
      }
    }

    setUploadingPassport(true);
    setPassportFile(file);

    // Start progress at 0
    setUploadProgress({
      loaded: 0,
      total: file.size,
      percentage: 0
    });

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const timestamp = Date.now();
      const fileName = `${user.id}_passport_${timestamp}.${fileExt}`;
      const filePath = `kyc-documents/${fileName}`;

      console.log('Starting upload to securedocuments bucket:', fileName);

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (!prev) return null;
          const newPercentage = Math.min(prev.percentage + 5, 90);
          return {
            ...prev,
            percentage: newPercentage,
            loaded: Math.round((newPercentage / 100) * prev.total)
          };
        });
      }, 100);

      // Actual upload
      const publicUrl = await uploadLargeFile(file, filePath);

      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress({
        loaded: file.size,
        total: file.size,
        percentage: 100
      });

      setPassportUrl(publicUrl);

      // Store file metadata
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
            user_agent: navigator.userAgent,
            file_extension: fileExt
          }
        }]);

      if (metadataError) {
        console.error('Error saving file metadata:', metadataError);
        // Don't fail upload if metadata save fails
      }

      console.log('File uploaded successfully to securedocuments:', publicUrl);

    } catch (error: any) {
      console.error('Error uploading passport:', error);
      setUploadError(error.message || 'Failed to upload document. Please try again.');
      setPassportFile(null);
      setPassportUrl('');
    } finally {
      setUploadingPassport(false);
      // Clear progress after 2 seconds
      setTimeout(() => setUploadProgress(null), 2000);
    }
  };

  const removeFile = async () => {
    if (passportUrl && passportFile) {
      try {
        // Extract filename from URL
        const urlParts = passportUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `kyc-documents/${fileName}`;

        console.log('Removing file from securedocuments:', filePath);

        const { error } = await supabase.storage
          .from('securedocuments')
          .remove([filePath]);

        if (error) {
          console.error('Error removing file from storage:', error);
        }

        // Update file status in database
        await supabase
          .from('file_uploads')
          .update({
            status: 'deleted',
            updated_at: new Date().toISOString()
          })
          .eq('public_url', passportUrl)
          .eq('user_id', user?.id);

      } catch (error) {
        console.error('Error removing file:', error);
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
      const submissionData = {
        ...formData,
        file_info: {
          name: passportFile?.name,
          size: passportFile?.size,
          type: passportFile?.type,
          uploaded_at: new Date().toISOString(),
          public_url: passportUrl
        },
        submission_metadata: {
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          browser_language: navigator.language,
          screen_resolution: `${screen.width}x${screen.height}`
        }
      };

      // Save to user_documents
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

      // Update user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          postal_code: formData.postalCode,
          kyc_status: 'pending',
          kyc_submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (profileError) throw profileError;

      // Create kyc_applications record
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
          submitted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (kycError) throw kycError;

      // Update file status
      await supabase
        .from('file_uploads')
        .update({
          status: 'processed',
          updated_at: new Date().toISOString()
        })
        .eq('public_url', passportUrl)
        .eq('user_id', user.id);

      // Show success message
      setShowSuccess(true);

      // Auto-complete after 3 seconds
      setTimeout(() => {
        onComplete();
      }, 3000);

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
    <div className="p-8 space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">KYC Submitted Successfully!</h3>
            <p className="text-gray-600 text-sm mb-4">
              Your documents have been submitted for review. We'll notify you within 24 hours via email.
            </p>
            <div className="text-xs text-gray-500">
              Redirecting to dashboard...
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-medium text-gray-900 mb-1">KYC Verification</h1>
        <p className="text-gray-500 text-sm">Complete your identity verification securely</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step >= 1 ? 'bg-black text-white shadow-lg' : 'bg-gray-200 text-gray-500'
            }`}>
            {step > 1 ? <Check size={16} /> : '1'}
          </div>
          <div className={`w-20 h-1 mx-2 transition-all ${step >= 2 ? 'bg-black' : 'bg-gray-200'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step >= 2 ? 'bg-black text-white shadow-lg' : 'bg-gray-200 text-gray-500'
            }`}>
            2
          </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          <h3 className="text-xl font-medium mb-6 text-gray-900">Personal Information</h3>

          {/* KYC Application Status Banner */}
          {applicationStatus !== 'none' && existingApplication && (
            <div className={`rounded-lg p-4 mb-6 ${applicationStatus === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
              applicationStatus === 'approved' ? 'bg-green-50 border border-green-200' :
                'bg-red-50 border border-red-200'
              }`}>
              <div className="flex items-start gap-3">
                {applicationStatus === 'pending' && <Clock size={20} className="text-yellow-600 mt-0.5" />}
                {applicationStatus === 'approved' && <CheckCircle size={20} className="text-green-600 mt-0.5" />}
                {applicationStatus === 'rejected' && <AlertCircle size={20} className="text-red-600 mt-0.5" />}
                <div>
                  <h4 className={`font-medium ${applicationStatus === 'pending' ? 'text-yellow-900' :
                    applicationStatus === 'approved' ? 'text-green-900' :
                      'text-red-900'
                    }`}>
                    KYC Application {applicationStatus === 'pending' ? 'Under Review' :
                      applicationStatus === 'approved' ? 'Approved' : 'Rejected'}
                  </h4>
                  <p className={`text-sm mt-1 ${applicationStatus === 'pending' ? 'text-yellow-800' :
                    applicationStatus === 'approved' ? 'text-green-800' :
                      'text-red-800'
                    }`}>
                    {applicationStatus === 'pending' && 'Your KYC verification is being reviewed. We\'ll notify you within 24 hours.'}
                    {applicationStatus === 'approved' && 'Your identity has been verified successfully.'}
                    {applicationStatus === 'rejected' && existingApplication.rejection_reason &&
                      `Application was rejected: ${existingApplication.rejection_reason}`}
                  </p>
                  {existingApplication.submitted_at && (
                    <p className={`text-xs mt-2 ${applicationStatus === 'pending' ? 'text-yellow-700' :
                      applicationStatus === 'approved' ? 'text-green-700' :
                        'text-red-700'
                      }`}>
                      Submitted: {new Date(existingApplication.submitted_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed text-gray-600 transition-all"
                placeholder="From your account"
              />
              <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed text-gray-600 transition-all"
                placeholder="From your account"
              />
              <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed text-gray-600 transition-all"
                placeholder="From your account"
              />
              <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed text-gray-600 transition-all"
                placeholder="From your account"
              />
              <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
                disabled={isFormLocked}
                max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl transition-all ${isFormLocked
                  ? 'bg-gray-50 cursor-not-allowed text-gray-600'
                  : 'focus:ring-2 focus:ring-black focus:border-transparent'
                  }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nationality *
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                required
                disabled={isFormLocked}
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl transition-all ${isFormLocked
                  ? 'bg-gray-50 cursor-not-allowed text-gray-600'
                  : 'focus:ring-2 focus:ring-black focus:border-transparent'
                  }`}
                placeholder={isFormLocked ? "From KYC application" : "e.g., United States"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passport Number *
              </label>
              <input
                type="text"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleInputChange}
                required
                disabled={isFormLocked}
                minLength={6}
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl transition-all ${isFormLocked
                  ? 'bg-gray-50 cursor-not-allowed text-gray-600'
                  : 'focus:ring-2 focus:ring-black focus:border-transparent'
                  }`}
                placeholder={isFormLocked ? "From KYC application" : "Enter passport number"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passport Expiry *
              </label>
              <input
                type="date"
                name="passportExpiry"
                value={formData.passportExpiry}
                onChange={handleInputChange}
                required
                disabled={isFormLocked}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl transition-all ${isFormLocked
                  ? 'bg-gray-50 cursor-not-allowed text-gray-600'
                  : 'focus:ring-2 focus:ring-black focus:border-transparent'
                  }`}
              />
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-medium text-gray-900 text-lg">Address Information</h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                disabled={isFormLocked}
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl transition-all ${isFormLocked
                  ? 'bg-gray-50 cursor-not-allowed text-gray-600'
                  : 'focus:ring-2 focus:ring-black focus:border-transparent'
                  }`}
                placeholder={isFormLocked ? "From KYC application" : "Enter your full address"}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  disabled={isFormLocked}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl transition-all ${isFormLocked
                    ? 'bg-gray-50 cursor-not-allowed text-gray-600'
                    : 'focus:ring-2 focus:ring-black focus:border-transparent'
                    }`}
                  placeholder={isFormLocked ? "From KYC application" : "City"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  disabled={isFormLocked}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl transition-all ${isFormLocked
                    ? 'bg-gray-50 cursor-not-allowed text-gray-600'
                    : 'focus:ring-2 focus:ring-black focus:border-transparent'
                    }`}
                  placeholder={isFormLocked ? "From KYC application" : "Country"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  required
                  disabled={isFormLocked}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl transition-all ${isFormLocked
                    ? 'bg-gray-50 cursor-not-allowed text-gray-600'
                    : 'focus:ring-2 focus:ring-black focus:border-transparent'
                    }`}
                  placeholder={isFormLocked ? "From KYC application" : "Postal Code"}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleNextStep}
            disabled={isFormLocked}
            className={`w-full py-4 rounded-xl transition-colors font-medium shadow-lg ${isFormLocked
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800'
              }`}
          >
            {isFormLocked ? 'Application Submitted' : 'Continue to Document Upload →'}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          <h3 className="text-xl font-medium mb-6 text-gray-900">Document Upload</h3>

          {/* Show status if form is locked */}
          {isFormLocked && (
            <div className={`rounded-lg p-4 mb-6 ${applicationStatus === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-green-50 border border-green-200'
              }`}>
              <div className="flex items-start gap-3">
                {applicationStatus === 'pending' && <Clock size={20} className="text-yellow-600 mt-0.5" />}
                {applicationStatus === 'approved' && <CheckCircle size={20} className="text-green-600 mt-0.5" />}
                <div>
                  <h4 className={`font-medium ${applicationStatus === 'pending' ? 'text-yellow-900' : 'text-green-900'
                    }`}>
                    Documents Already Submitted
                  </h4>
                  <p className={`text-sm mt-1 ${applicationStatus === 'pending' ? 'text-yellow-800' : 'text-green-800'
                    }`}>
                    {applicationStatus === 'pending' && 'Your documents have been uploaded and are being reviewed.'}
                    {applicationStatus === 'approved' && 'Your documents have been verified successfully.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <div className="flex items-start gap-4">
              <AlertTriangle size={24} className="text-gray-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Document Requirements</h4>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Upload a clear photo or scan of your passport</li>
                  <li>• Ensure all text is readable and corners are visible</li>
                  <li>• Accepted formats: JPG, PNG, WEBP, TIFF, PDF, DOC, DOCX</li>
                  <li>• Maximum file size: 300MB</li>
                  <li>• Your document will be reviewed within 24 hours</li>
                </ul>
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600" />
                <span className="text-red-800 text-sm font-medium">Upload Error</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{uploadError}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Identity Document *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-gray-300 border-dashed rounded-2xl hover:border-gray-400 transition-colors bg-gray-50">
              <div className="space-y-2 text-center w-full">
                {passportFile ? (
                  <div className="relative">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Check size={32} className="text-gray-600" />
                    </div>
                    <p className="text-lg font-medium text-gray-900">{passportFile.name}</p>
                    <p className="text-sm text-gray-500 mb-3">{formatFileSize(passportFile.size)}</p>

                    {uploadProgress && uploadProgress.percentage < 100 && (
                      <div className="w-full max-w-sm mx-auto mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Uploading...</span>
                          <span>{uploadProgress.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-black h-3 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {formatFileSize(uploadProgress.loaded)} / {formatFileSize(uploadProgress.total)}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={removeFile}
                      disabled={uploadingPassport}
                      className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-800 mt-3 disabled:opacity-50 disabled:cursor-not-allowed bg-red-50 px-4 py-2 rounded-lg"
                    >
                      <X size={14} />
                      Remove file
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-16 w-16 text-gray-400" />
                    <div className="flex text-lg text-gray-600">
                      <label
                        htmlFor="passport-upload"
                        className="relative cursor-pointer bg-white rounded-xl font-medium text-black hover:text-gray-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-black px-4 py-2"
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
                    <p className="text-sm text-gray-500">
                      JPG, PNG, WEBP, TIFF, PDF, DOC, DOCX up to 300MB
                    </p>
                  </>
                )}
              </div>
            </div>

            {uploadingPassport && !uploadProgress && (
              <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
                <span>Preparing upload...</span>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              disabled={uploadingPassport || isSubmitting}
              className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !passportUrl || uploadingPassport}
              className="flex-1 bg-black text-white py-4 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg"
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
    </div>
  );
};

const Dashboard: React.FC<{ onClose?: () => void; initialTab?: string }> = ({ onClose, initialTab }) => {
  const { user, isAuthenticated, signOut } = useAuth();
  const { address: walletAddress, isConnected: walletConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const [currentView, setCurrentView] = useState(initialTab || 'overview');
  const [loading, setLoading] = useState(false);

  // UI States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: '1', text: 'New booking request received', time: '5m ago', unread: true },
    { id: '2', text: 'Your flight was confirmed', time: '1h ago', unread: true },
    { id: '3', text: 'Wallet connected successfully', time: '2h ago', unread: false }
  ]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Location and IP tracking
  const [locationData, setLocationData] = useState<LocationData>({
    city: '',
    country: '',
    ip: '',
    loading: true
  });

  // Data States - Unified interface for all request types
  interface UnifiedRequest {
    id: string;
    type: 'flight_booking' | 'jets' | 'emptyleg' | 'helicopter' | 'cars' | 'adventures' | 'co2-certificate' | 'private_jet_charter' | 'fixed_offer' | 'empty_leg' | 'helicopter_charter' | 'luxury_car_rental' | 'nft_discount_empty_leg' | 'nft_free_flight';
    status: string;
    created_at: string;
    // Flight booking specific fields
    contact_name?: string;
    origin_airport_code?: string;
    destination_airport_code?: string;
    departure_date?: string;
    departure_time?: string;
    passengers?: number;
    luggage?: number;
    pets?: number;
    selected_jet_category?: string;
    aviation_services?: string[];
    luxury_services?: string[];
    carbon_option?: 'none' | 'full';
    carbon_nft_wallet?: string;
    total_price?: number;
    currency?: string;
    payment_method?: 'bank' | 'card' | 'crypto';
    contact_email?: string;
    contact_phone?: string;
    contact_company?: string;
    wallet_address?: string;
    nft_discount_applied?: boolean;
    notes?: string;
    // User request specific fields
    client_name?: string;
    client_email?: string;
    data?: any;
    // Common fields
    user_id?: string;
    updated_at?: string;
  }

  // Helper function to format NFT name and get token ID
  const formatNFTName = async (nftIdentifier: string, walletAddress?: string): Promise<string> => {
    if (!nftIdentifier) return 'Unknown NFT';

    const formatTokenId = (tokenId: string): string => {
      // Clean temp_ prefix if present
      const cleanId = tokenId.startsWith('temp_') ? tokenId.replace('temp_', '') : tokenId;
      // If it's a number, pad with leading zeros to 3 digits
      if (cleanId.match(/^\d+$/)) {
        return cleanId.padStart(3, '0');
      }
      return cleanId;
    };

    // If it starts with "temp_", extract the number after it
    if (nftIdentifier.startsWith('temp_')) {
      const tokenId = nftIdentifier.replace('temp_', '');
      return `PCX Membership Card ${formatTokenId(tokenId)}`;
    }

    // If it's a simple numeric token ID, use it directly
    if (nftIdentifier.match(/^\d{1,6}$/)) {
      return `PCX Membership Card ${formatTokenId(nftIdentifier)}`;
    }

    // If it looks like a UUID, try to look up the token ID from database
    if (nftIdentifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      try {
        const { data: nftData, error } = await supabase
          .from('user_nfts')
          .select('nft_token_id')
          .eq('id', nftIdentifier)
          .maybeSingle();

        if (!error && nftData) {
          const tokenId = nftData.nft_token_id;
          if (tokenId) {
            return `PCX Membership Card ${formatTokenId(tokenId)}`;
          }
        }
      } catch (err) {
        console.log('Could not look up NFT token ID:', err);
      }
    }

    // Fallback: use the identifier as-is but clean temp_ prefix if present
    return `PCX Membership Card ${formatTokenId(nftIdentifier)}`;
  };

  const [userRequests, setUserRequests] = useState<UnifiedRequest[]>([]);
  const [co2CertificateRequests, setCo2CertificateRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [formattedNFTName, setFormattedNFTName] = useState<string>('');

  // Load both booking requests and user requests
  useEffect(() => {
    const loadAllRequests = async () => {
      try {
        setIsLoadingRequests(true);

        // Get current user first
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('User not authenticated');
        }

        // Fetch booking requests (flight bookings)
        const { data: bookingRequests, error: bookingError } = await bookingService.getUserBookingRequests(user.id);

        // Fetch user requests (other service types)
        const { data: serviceRequests, error: serviceError } = await supabase
          .from('user_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (serviceError) {
          console.error('Error loading service requests:', serviceError);
        }
        
        const userServiceRequests = serviceRequests || [];

        // Fetch CO2 certificate requests
        const { data: co2Requests, error: co2Error } = await supabase
          .from('co2_certificate_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (co2Error) {
          console.error('Error loading CO2 certificate requests:', co2Error);
          setCo2CertificateRequests([]);
        } else {
          setCo2CertificateRequests(co2Requests || []);
        }

        // Transform and combine all types
        const unifiedRequests: UnifiedRequest[] = [];

        // Add flight booking requests
        if (bookingRequests && !bookingError) {
          bookingRequests.forEach((booking: BookingRequest) => {
            unifiedRequests.push({
              id: booking.id!,
              type: 'flight_booking',
              status: booking.status || 'pending',
              created_at: booking.created_at!,
              contact_name: booking.contact_name,
              origin_airport_code: booking.origin_airport_code,
              destination_airport_code: booking.destination_airport_code,
              departure_date: booking.departure_date,
              departure_time: booking.departure_time,
              passengers: booking.passengers,
              luggage: booking.luggage,
              pets: booking.pets,
              selected_jet_category: booking.selected_jet_category,
              aviation_services: booking.aviation_services,
              luxury_services: booking.luxury_services,
              carbon_option: booking.carbon_option,
              carbon_nft_wallet: booking.carbon_nft_wallet,
              total_price: booking.total_price,
              currency: booking.currency,
              payment_method: booking.payment_method,
              contact_email: booking.contact_email,
              contact_phone: booking.contact_phone,
              contact_company: booking.contact_company,
              wallet_address: booking.wallet_address,
              nft_discount_applied: booking.nft_discount_applied,
              notes: booking.notes,
              user_id: booking.user_id,
              updated_at: booking.updated_at
            });
          });
        }


        // Add user service requests
        userServiceRequests.forEach((request: any) => {
          // Map user_requests types to filter types
          let mappedType: UnifiedRequest['type'] = request.type;
          if (request.type === 'private_jet_charter') mappedType = 'jets';
          if (request.type === 'empty_leg') mappedType = 'emptyleg';
          if (request.type === 'helicopter_charter') mappedType = 'helicopter';
          if (request.type === 'luxury_car_rental') mappedType = 'cars';
          if (request.type === 'fixed_offer') mappedType = 'adventures';

          unifiedRequests.push({
            id: request.id,
            type: mappedType,
            status: request.status,
            created_at: request.created_at,
            client_name: request.client_name,
            client_email: request.client_email,
            data: request.data,
            user_id: request.user_id,
            updated_at: request.updated_at
          });
        });

        // Sort by creation date (newest first)
        unifiedRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Debug logging to help diagnose search issues
        console.log('📋 Unified Requests loaded:', unifiedRequests.length);
        if (unifiedRequests.length > 0) {
          console.log('📋 Sample request data:', {
            id: unifiedRequests[0].id,
            type: unifiedRequests[0].type,
            contact_name: unifiedRequests[0].contact_name,
            client_name: unifiedRequests[0].client_name,
            status: unifiedRequests[0].status,
            origin: unifiedRequests[0].origin_airport_code,
            destination: unifiedRequests[0].destination_airport_code
          });
        }

        setUserRequests(unifiedRequests);

      } catch (error) {
        console.error('Failed to load requests:', error);
      } finally {
        setIsLoadingRequests(false);
      }
    };

    loadAllRequests();
  }, []);

  // Debug CO2 certificate requests data structure
  useEffect(() => {
    if (co2CertificateRequests.length > 0) {
      console.log('🌱 CO2 Certificate Requests Debug:', {
        count: co2CertificateRequests.length,
        firstRequest: co2CertificateRequests[0],
        allFields: Object.keys(co2CertificateRequests[0] || {})
      });
    }
  }, [co2CertificateRequests]);

  const [co2Stats, setCo2Stats] = useState<UserCO2Stats | null>(null);

  // Load CO2 stats
  useEffect(() => {
    const loadCO2Stats = async () => {
      if (!user?.id) return;

      try {
        const { data: co2Requests } = await supabase
          .from('co2_certificate_requests')
          .select('status, total_emissions_kg, total_cost, created_at')
          .eq('user_id', user.id);

        if (co2Requests) {
          const totalRequests = co2Requests.length;
          const pendingRequests = co2Requests.filter(r => r.status === 'pending').length;
          const completedCertificates = co2Requests.filter(r => r.status === 'completed' || r.status === 'delivered').length;
          const totalCO2OffsetKg = co2Requests.reduce((sum, r) => sum + (r.total_emissions_kg || 0), 0);
          const totalSpent = co2Requests.reduce((sum, r) => sum + (r.total_cost || 0), 0);
          const totalTreesEquivalent = Math.round(totalCO2OffsetKg / 22); // Approximate: 22kg CO2 per tree

          setCo2Stats({
            id: user.id,
            user_id: user.id,
            total_requests: totalRequests,
            pending_requests: pendingRequests,
            completed_certificates: completedCertificates,
            total_co2_offset_kg: totalCO2OffsetKg,
            total_trees_equivalent: totalTreesEquivalent,
            total_spent: totalSpent,
            last_request_date: co2Requests.length > 0 ? co2Requests[0].created_at : undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error loading CO2 stats:', error);
      }
    };

    loadCO2Stats();
  }, [user?.id]);

  const [userStats, setUserStats] = useState({
    totalRequests: 0,
    totalSpent: 0,
    co2Requests: 0,
    memberSince: ''
  });

  // States
  const [selectedRequest, setSelectedRequest] = useState<UnifiedRequest | null>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);

  // Filter States
  const [requestFilter, setRequestFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Profile Settings handled by ProfileSettings component

  // KYC States
  const [kycStatus, setKycStatus] = useState<'not_started' | 'pending' | 'verified'>('not_started');
  const [showKycForm, setShowKycForm] = useState(false);

  // Fetch KYC status on component mount
  useEffect(() => {
    const fetchKycStatus = async () => {
      if (!user?.id) return;

      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('kyc_status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && profile?.kyc_status) {
          setKycStatus(profile.kyc_status as 'not_started' | 'pending' | 'verified');
        }
      } catch (error) {
        console.error('Error fetching KYC status:', error);
      }
    };

    fetchKycStatus();
  }, [user?.id]);

  // Fetch wallet assets when wallet is connected
  useEffect(() => {
    if (walletConnected && walletAddress && chain?.id === 8453) {
      fetchWalletAssets(walletAddress);
    } else if (!walletConnected) {
      // Reset wallet assets when disconnected
      setWalletAssets({ nfts: [], walletCertificates: [], balance: '0' });
    }
  }, [walletConnected, walletAddress, chain?.id]);

  // Format NFT name when selected request changes
  useEffect(() => {
    const loadNFTName = async () => {
      if (selectedRequest &&
        (selectedRequest.type === 'nft_discount_empty_leg' || selectedRequest.type === 'nft_free_flight') &&
        selectedRequest.data?.nft_used) {
        const formatted = await formatNFTName(selectedRequest.data.nft_used, selectedRequest.data.wallet_address);
        setFormattedNFTName(formatted);
      } else {
        setFormattedNFTName('');
      }
    };

    loadNFTName();
  }, [selectedRequest]);

  // Wallet Assets State
  const [walletAssets, setWalletAssets] = useState<WalletAssets>({
    nfts: [],
    walletCertificates: [],
    balance: '0'
  });

  // Category configurations with images
  const categoryConfig = {
    jets: {
      name: 'Private Jets',
      image: '🛩️',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    emptyleg: {
      name: 'Empty Leg',
      image: '⚡',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600'
    },
    helicopter: {
      name: 'Helicopters',
      image: '🚁',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    cars: {
      name: 'Luxury Cars',
      image: '🚗',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    adventures: {
      name: 'Adventures',
      image: '🏔️',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    'co2-certificate': {
      name: 'CO2 Certificate',
      image: '🌱',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    }
  };

  // Fetch location and IP data with browser geolocation
  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        // Request browser geolocation permission
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;

              // Fetch city/country from reverse geocoding API
              try {
                const response = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                );
                const data = await response.json();

                // Get IP address
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipResponse.json();

                setLocationData({
                  city: data.city || data.locality || 'Unknown',
                  country: data.countryName || 'Unknown',
                  ip: ipData.ip || '0.0.0.0',
                  latitude,
                  longitude,
                  loading: false
                });
              } catch (geoError) {
                console.error('Error fetching location details:', geoError);
                setLocationData({
                  city: 'Unknown',
                  country: 'Unknown',
                  ip: '0.0.0.0',
                  latitude,
                  longitude,
                  loading: false
                });
              }
            },
            (error) => {
              console.error('Geolocation error:', error);
              // Fallback to IP-based location
              setLocationData({
                city: 'Sofia',
                country: 'Bulgaria',
                ip: '185.94.188.123',
                loading: false
              });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        } else {
          // Fallback if geolocation not available
          setLocationData({
            city: 'Sofia',
            country: 'Bulgaria',
            ip: '185.94.188.123',
            loading: false
          });
        }
      } catch (error) {
        console.error('Error fetching location:', error);
        setLocationData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchLocationData();
  }, []);

  // NAVIGATION ITEMS
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'requests', label: 'My Requests', icon: History, badge: userRequests.length },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'tokenized-assets', label: 'Tokenized Assets', icon: Gem },
    { id: 'dao', label: 'DAO', icon: Users },
    { id: 'co2-certificates', label: 'CO2 Certificates', icon: Leaf, badge: co2Stats?.total_requests || 0 },
    { id: 'wallet', label: 'Wallet & NFTs', icon: Wallet, badge: walletAssets.nfts.length },
    { id: 'chat-support', label: 'Chat Support', icon: MessageCircle },
    { id: 'kyc', label: 'KYC Verification', icon: Shield, badge: kycStatus === 'not_started' ? 1 : undefined },
    { id: 'profiles', label: 'Profile Settings', icon: User }
  ].filter(item => {
    // Hide KYC tab if already verified
    if (item.id === 'kyc' && kycStatus === 'verified') {
      return false;
    }
    return true;
  });

  // Get category info based on request type
  const getCategoryInfoForRequest = (type: string) => {
    switch (type) {
      case 'flight_booking':
        return { name: 'Flight Booking', bgColor: 'bg-blue-50', image: '✈️' };
      case 'jets':
      case 'private_jet_charter':
        return { name: 'Private Jet', bgColor: 'bg-purple-50', image: '🛩️' };
      case 'emptyleg':
      case 'empty_leg':
      case 'nft_discount_empty_leg':
      case 'nft_free_flight':
        return { name: 'Empty Leg', bgColor: 'bg-green-50', image: '🎯' };
      case 'helicopter':
      case 'helicopter_charter':
        return { name: 'Helicopter', bgColor: 'bg-orange-50', image: '🚁' };
      case 'cars':
      case 'luxury_car_rental':
        return { name: 'Luxury Car', bgColor: 'bg-gray-50', image: '🚗' };
      case 'adventures':
        return { name: 'Adventures', bgColor: 'bg-yellow-50', image: '⛰️' };
      case 'co2-certificate':
        return { name: 'CO2 Certificate', bgColor: 'bg-emerald-50', image: '🌱' };
      case 'fixed_offer':
        return { name: 'Fixed Offer', bgColor: 'bg-indigo-50', image: '💎' };
      default:
        return { name: 'Request', bgColor: 'bg-gray-50', image: '📄' };
    }
  };

  // Search helper function
  const searchInRequest = (request: UnifiedRequest, searchTerm: string): boolean => {
    if (!searchTerm) return true;

    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;

    // Create array of searchable fields, filtering out null/undefined values
    const searchableFields = [
      request.contact_name,
      request.client_name,
      request.client_email,
      request.contact_email,
      request.origin_airport_code,
      request.destination_airport_code,
      request.status,
      request.type,
      request.id
    ].filter(field => field != null && field !== '');

    // Add airport names for flight bookings
    if (request.origin_airport_code) {
      const originAirport = getAirportByCode(request.origin_airport_code);
      if (originAirport) {
        searchableFields.push(originAirport.name, originAirport.city, originAirport.country);
      }
    }

    if (request.destination_airport_code) {
      const destinationAirport = getAirportByCode(request.destination_airport_code);
      if (destinationAirport) {
        searchableFields.push(destinationAirport.name, destinationAirport.city, destinationAirport.country);
      }
    }

    // Also search in nested data object for user requests
    if (request.data && typeof request.data === 'object') {
      Object.values(request.data).forEach(value => {
        if (value && typeof value === 'string') {
          searchableFields.push(value);
        }
      });
    }

    // Search for matches
    return searchableFields.some(field => {
      if (typeof field === 'string') {
        return field.toLowerCase().includes(search);
      }
      return false;
    });
  };

  // Handle request details
  const openRequestDetails = (request: UnifiedRequest) => {
    setSelectedRequest(request);
    setShowRequestDetails(true);
  };

  const closeRequestDetails = () => {
    setSelectedRequest(null);
    setShowRequestDetails(false);
  };

  // Since wallet connection is handled by WalletMenu, we don't need connectWallet function

  // Handle wallet connection error
  const handleWalletError = (error: string) => {
    console.error('Wallet connection error:', error);
  };

  // Fetch wallet assets
  const fetchWalletAssets = async (address: string) => {
    try {
      console.log('Fetching wallet assets for:', address);

      // Get balance
      const balance = await web3Service.getBalance(address as `0x${string}`);

      // Get NFTs 
      const nfts = await web3Service.getUserNFTs(address as `0x${string}`);

      // Get CO2 certificates
      const co2Certificates = await web3Service.getUserCO2Certificates(address as `0x${string}`);

      // Convert web3 NFTs to Dashboard NFT format
      const dashboardNFTs: NFTMembership[] = nfts.map(nft => ({
        tokenId: nft.tokenId,
        tier: 'VIP', // All PCX NFTs are VIP tier
        benefits: {
          emptyLegDiscount: nft.discountPercent,
          freeTransfers: 1,
          priorityBooking: true,
          conciergeService: true,
          loungeAccess: true
        },
        acquired: new Date().toISOString().split('T')[0], // Use current date as we don't have acquisition date
        expiresAt: '' // No expiration
      }));

      // Convert CO2 certificates to Dashboard format
      const dashboardCertificates = co2Certificates.map(cert => ({
        tokenId: cert.tokenId,
        flightRoute: cert.name || `Certificate #${cert.tokenId}`,
        offsetAmount: cert.carbonOffset || 'N/A',
        issuedDate: cert.offsetDate || new Date().toISOString().split('T')[0]
      }));

      setWalletAssets({
        nfts: dashboardNFTs,
        walletCertificates: dashboardCertificates,
        balance: balance
      });

    } catch (error) {
      console.error('Error fetching wallet assets:', error);
      setWalletAssets({ nfts: [], walletCertificates: [], balance: '0' });
    }
  };

  // Disconnect Wallet
  const disconnectWallet = () => {
    disconnect();
    setWalletAssets({ nfts: [], walletCertificates: [], balance: '0' });
  };

  // Calculate user statistics
  useEffect(() => {
    const co2RequestsCount = co2CertificateRequests.length;

    setUserStats({
      totalRequests: userRequests.length + co2RequestsCount,
      totalSpent: 0,
      co2Requests: co2RequestsCount,
      memberSince: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2024'
    });
  }, [userRequests, co2CertificateRequests, user?.created_at]);

  // Weather Card Component
  const WeatherCard: React.FC<{ latitude: number; longitude: number; city: string; country: string }> = ({ latitude, longitude, city, country }) => {
    const [weather, setWeather] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchWeather = async () => {
        try {
          const API_KEY = 'bd5e378503939ddaee76f12ad7a97608';
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
          );

          if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
          }

          const data = await response.json();
          setWeather(data);
        } catch (error) {
          console.error('Weather fetch error:', error);
          setWeather(null);
        } finally {
          setLoading(false);
        }
      };
      fetchWeather();
    }, [latitude, longitude]);

    if (loading) {
      return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 h-full flex items-center justify-center">
          <RefreshCw className="animate-spin h-8 w-8 text-gray-400" />
        </div>
      );
    }

    if (!weather || !weather.main || !weather.weather || !weather.weather[0]) {
      return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 h-full flex items-center justify-center text-gray-400">
          Weather unavailable
        </div>
      );
    }

    const getWeatherIcon = (icon: string) => {
      if (!icon) return '🌫️';
      if (icon.includes('01')) return '☀️';
      if (icon.includes('02') || icon.includes('03')) return '⛅';
      if (icon.includes('04')) return '☁️';
      if (icon.includes('09') || icon.includes('10')) return '🌧️';
      if (icon.includes('11')) return '⛈️';
      if (icon.includes('13')) return '❄️';
      return '🌫️';
    };

    return (
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium">{city}</h3>
            <p className="text-sm text-blue-100 capitalize">{weather.weather[0]?.description || 'N/A'}</p>
          </div>
          <div className="text-4xl">{getWeatherIcon(weather.weather[0]?.icon || '')}</div>
        </div>

        <div className="mb-6">
          <div className="text-5xl font-bold mb-1">{Math.round(weather.main.temp)}°C</div>
          <div className="text-sm text-blue-100">Feels like {Math.round(weather.main.feels_like)}°C</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Wind size={16} className="text-blue-200" />
            <div>
              <div className="text-xs text-blue-100">Wind</div>
              <div className="text-sm font-medium">{weather.wind?.speed ? Math.round(weather.wind.speed * 3.6) : 0} km/h</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-blue-200" />
            <div>
              <div className="text-xs text-blue-100">Humidity</div>
              <div className="text-sm font-medium">{weather.main.humidity}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Gauge size={16} className="text-blue-200" />
            <div>
              <div className="text-xs text-blue-100">Pressure</div>
              <div className="text-sm font-medium">{weather.main.pressure} hPa</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-blue-200" />
            <div>
              <div className="text-xs text-blue-100">Visibility</div>
              <div className="text-sm font-medium">{weather.visibility ? Math.round(weather.visibility / 1000) : 0} km</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Format currency
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
      case 'approved':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'pending':
        return 'bg-gray-200 text-gray-900 border-gray-400';
      case 'processing':
        return 'bg-gray-300 text-gray-900 border-gray-500';
      case 'cancelled':
      case 'rejected':
        return 'bg-gray-400 text-white border-gray-500';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Get category display info
  const getCategoryInfo = (type: string) => {
    return categoryConfig[type as keyof typeof categoryConfig] || {
      name: type,
      image: '📄',
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-600'
    };
  };

  // Render Overview Tab
  const renderOverview = () => (
    <div className="p-8 space-y-8">
      {/* KYC Verification Banner - Minimal */}
      {kycStatus === 'not_started' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-gray-600" />
              <span className="text-sm text-gray-900">Identity verification required</span>
            </div>
            <button
              onClick={() => setCurrentView('kyc')}
              className="text-sm text-black hover:underline"
            >
              Verify now
            </button>
          </div>
        </div>
      )}

      {kycStatus === 'pending' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-blue-600" />
            <span className="text-sm text-blue-900">KYC under review - we'll notify you within 24 hours</span>
          </div>
        </div>
      )}

      {kycStatus === 'verified' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-sm text-green-900">Identity verified</span>
          </div>
        </div>
      )}

      {/* Account Summary - N26 Style */}
      <div className="bg-black rounded-2xl text-white p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium mb-1">
              {user?.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-gray-400 text-sm">Account Overview</p>
            {walletAssets.nfts.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-yellow-200 text-sm font-medium">
                  {walletAssets.nfts[0].tier} Member
                </span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-xs mb-1">Member since</div>
            <div className="text-sm font-medium">{userStats.memberSince}</div>
          </div>
        </div>

        {/* Stats - Clean N26 style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-gray-400 text-xs mb-1">Total Requests</div>
            <div className="text-2xl font-light">{userStats.totalRequests}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">CO2 Requests</div>
            <div className="text-2xl font-light">{userStats.co2Requests}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Certificates</div>
            <div className="text-2xl font-light">{co2Stats?.completed_certificates || 0}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">NFT Benefits</div>
            <div className="text-2xl font-light">{walletAssets.nfts.length}</div>
          </div>
        </div>
      </div>

      {/* Location Tracker & Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Location Map */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-medium text-gray-900">Your Location</h3>
            <p className="text-sm text-gray-500">Current position tracked</p>
          </div>
          <div className="relative h-64">
            {locationData.latitude && locationData.longitude ? (
              <>
                <MapboxMap
                  origin={{
                    lat: locationData.latitude,
                    lng: locationData.longitude,
                    address: `${locationData.city}, ${locationData.country}`
                  }}
                  destination={null}
                  isReturn={false}
                  stops={[]}
                  showOfficeLocations={false}
                  showControls={false}
                  hideLabels={true}
                />
                {/* Blue blinking point overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    {/* Pulsing ring */}
                    <div className="absolute inset-0 rounded-full bg-blue-500 opacity-30 animate-ping" style={{ width: '32px', height: '32px', margin: '-8px' }}></div>
                    {/* Static outer ring */}
                    <div className="absolute rounded-full bg-blue-500/40" style={{ width: '24px', height: '24px', margin: '-4px' }}></div>
                    {/* Blue dot */}
                    <div className="relative w-4 h-4 bg-blue-600 rounded-full shadow-lg border-2 border-white animate-pulse"></div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Globe size={32} className="mx-auto mb-2" />
                  <p>Loading location...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weather Card */}
        {locationData.latitude && locationData.longitude && (
          <WeatherCard
            latitude={locationData.latitude}
            longitude={locationData.longitude}
            city={locationData.city}
            country={locationData.country}
          />
        )}
      </div>

      {/* Recent Activity - N26 Transaction Style */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            <button
              onClick={() => setCurrentView('requests')}
              className="text-gray-600 hover:text-black text-sm font-medium"
            >
              View all
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {isLoadingRequests ? (
            <div className="text-center py-8">
              <RefreshCw className="animate-spin h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Loading requests...</p>
            </div>
          ) : (() => {
            // Combine user requests and CO2 certificate requests
            const allRequests = [
              ...userRequests.map(req => ({
                ...req,
                requestType: 'flight_booking',
                sortDate: req.created_at
              })),
              ...co2CertificateRequests.map(req => ({
                ...req,
                requestType: 'co2_certificate',
                sortDate: req.created_at,
                client_name: req.company_name,
                contact_name: req.company_name
              }))
            ].sort((a, b) => new Date(b.sortDate || '').getTime() - new Date(a.sortDate || '').getTime()).slice(0, 6);

            return allRequests.length > 0 ? (
              allRequests.map((request) => {
                const isCO2Request = request.requestType === 'co2_certificate';

                // Get proper category info based on request type
                let categoryInfo;
                if (isCO2Request) {
                  categoryInfo = { name: 'CO2 Certificate', bgColor: 'bg-emerald-50', image: '🌱' };
                } else {
                  categoryInfo = getCategoryInfoForRequest(request.type);
                }

                // Get proper route info based on request type
                let routeInfo;
                if (isCO2Request) {
                  routeInfo = `${request.origin || ''} → ${request.destination || ''}`;
                } else if (request.type === 'flight_booking') {
                  routeInfo = `${request.origin_airport_code || ''} → ${request.destination_airport_code || ''}`;
                } else if (request.type === 'emptyleg' || request.type === 'empty_leg') {
                  routeInfo = `${request.data?.departure_iata || ''} → ${request.data?.arrival_iata || ''}`;
                } else if (request.type === 'adventures') {
                  routeInfo = `${request.data?.origin || ''} → ${request.data?.destination || ''}`;
                } else if (request.data?.from && request.data?.to) {
                  routeInfo = `${request.data.from} → ${request.data.to}`;
                } else {
                  routeInfo = request.client_name || request.contact_name || 'Service Request';
                }

                return (
                  <div
                    key={`${request.requestType}-${request.id}`}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (isCO2Request) {
                        setSelectedRequest(request as any);
                        setShowRequestDetails(true);
                      } else {
                        openRequestDetails(request);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${categoryInfo.bgColor} rounded-xl flex items-center justify-center text-2xl`}>
                          {categoryInfo.image}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{categoryInfo.name}</p>
                          <p className="text-sm text-gray-500">
                            {routeInfo || request.client_name || request.contact_name || 'Service Request'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status || 'pending')}`}>
                          {request.status || 'pending'}
                        </span>
                        <div className="text-right">
                          <div className="text-sm text-gray-900">{request.created_at ? formatDate(request.created_at) : ''}</div>
                          <div className="text-xs text-gray-500">{request.created_at ? formatTime(request.created_at) : ''}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <History size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No activity yet</p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Wallet Status</h4>
            <Wallet size={20} className="text-gray-400" />
          </div>
          {walletConnected ? (
            <div>
              <div className="text-sm text-gray-600 mb-1">Connected</div>
              <div className="text-xs text-gray-500 font-mono">
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {walletAssets.balance} ETH • {walletAssets.nfts.length} NFTs
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm text-gray-600 mb-1">Not connected</div>
              <span className="text-xs text-gray-400">
                Use wallet menu above
              </span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">CO2 Impact</h4>
            <Leaf size={20} className="text-gray-400" />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">
              {co2Stats ? `${(co2Stats.total_co2_offset_kg / 1000).toFixed(1)} tonnes offset` : 'No data'}
            </div>
            <div className="text-xs text-gray-500">
              {co2Stats ? `${co2Stats.total_trees_equivalent} trees equivalent` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Requests Tab
  const renderRequests = () => (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 mb-1">My Requests</h1>
          <p className="text-gray-500 text-sm">
            {(() => {
              if (searchTerm) {
                const filteredCount = userRequests.filter(request => {
                  const matchesFilter = requestFilter === 'all' || request.type === requestFilter;
                  const matchesSearch = searchInRequest(request, searchTerm);
                  return matchesFilter && matchesSearch;
                }).length;

                return `${filteredCount} result${filteredCount !== 1 ? 's' : ''} found for "${searchTerm}"`;
              }

              const filteredCount = requestFilter === 'all'
                ? userRequests.length
                : userRequests.filter(r => r.type === requestFilter).length;

              return requestFilter === 'all'
                ? `${userRequests.length} total requests`
                : `${filteredCount} ${requestFilter} request${filteredCount !== 1 ? 's' : ''}`;
            })()}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-black border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4">
        {/* Filter Row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm text-gray-700 font-medium">Filter by type:</span>
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={requestFilter}
              onChange={(e) => setRequestFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-300 focus:border-black focus:ring-0 transition-colors cursor-pointer"
            >
              <option value="all">All Requests</option>
              <option value="flight_booking">Flight Bookings</option>
              {/* <option value="jets">Private Jets</option> */}
              <option value="emptyleg">Empty Legs</option>
              <option value="helicopter">Helicopters</option>
              {/* <option value="cars">Luxury Cars</option> */}
              <option value="adventures">Adventures</option>
              {/* <option value="co2-certificate">CO2 Certificates</option> */}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Search Row */}
        {/* <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-gray-500" />
            <span className="text-sm text-gray-700 font-medium">Search:</span>
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, airport, status, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 bg-white border border-gray-200 rounded-lg focus:border-black focus:ring-0 text-sm transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div> */}
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {userRequests.length === 0 ? (
          <div className="text-center py-12">
            <History size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-2">No requests yet</p>
            <p className="text-gray-500">Your request history will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {userRequests
              .filter(request => {
                // Filter by request type
                const matchesFilter = requestFilter === 'all' || request.type === requestFilter;

                // Search using the helper function
                const matchesSearch = searchInRequest(request, searchTerm);

                return matchesFilter && matchesSearch;
              })
              .map((request) => {
                const categoryInfo = getCategoryInfoForRequest(request.type);
                return (
                  <div
                    key={request.id}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => openRequestDetails(request)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${categoryInfo.bgColor} rounded-xl flex items-center justify-center text-2xl`}>
                          {categoryInfo.image}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{categoryInfo.name} Request</h3>
                          <p className="text-sm text-gray-500">
                            {request.type === 'flight_booking'
                              ? `${request.origin_airport_code || ''} → ${request.destination_airport_code || ''}`
                              : request.client_name || request.contact_name || 'Service Request'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status || 'pending')}`}>
                          {request.status || 'pending'}
                        </span>
                        <button className="p-1 hover:bg-gray-100 rounded-md">
                          <ChevronRight size={16} className="text-gray-400" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Submitted</div>
                        <div className="text-gray-900">{formatDate(request.created_at)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Type</div>
                        <div className="text-gray-900">
                          {request.type === 'flight_booking'
                            ? request.selected_jet_category || 'TBD'
                            : request.type.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Contact</div>
                        <div className="text-gray-900">{request.contact_name}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">ID</div>
                        <div className="text-gray-900 font-mono text-xs">{request.id?.toString().slice(0, 8) || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );

  // Render CO2 Certificates Tab
  const renderCO2Certificates = () => {
    const co2Requests = co2CertificateRequests;

    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-gray-900 mb-1">CO2 Certificates</h1>
            <p className="text-gray-500 text-sm">Track your environmental impact</p>
          </div>
        </div>

        {/* Stats Overview */}
        {co2Stats && (
          <div className="bg-black rounded-2xl text-white p-6">
            <h3 className="text-lg font-medium mb-4">Your CO2 Impact</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-gray-400 text-xs mb-1">Total Requests</div>
                <div className="text-2xl font-light">{co2Stats.total_requests}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Completed</div>
                <div className="text-2xl font-light">{co2Stats.completed_certificates}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">CO2 Offset</div>
                <div className="text-2xl font-light">{(co2Stats.total_co2_offset_kg / 1000).toFixed(1)}t</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Trees Equivalent</div>
                <div className="text-2xl font-light">{co2Stats.total_trees_equivalent}</div>
              </div>
            </div>
          </div>
        )}

        {/* Issued Certificates */}
        {(() => {
          const issuedCertificates = co2Requests.filter(request => 
            request.certificate_pdf_url && request.certificate_issued_at
          );
          
          if (issuedCertificates.length > 0) {
            return (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900">Issued Certificates</h3>
                  <p className="text-sm text-gray-500">Your completed CO2 offset certificates</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {issuedCertificates.map((certificate) => (
                    <div key={certificate.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                            <Award size={20} className="text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              Certificate #{certificate.request_id}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {certificate.origin || 'N/A'} → {certificate.destination || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-400">
                              Issued: {certificate.certificate_issued_at && formatDate(certificate.certificate_issued_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Certificate Issued
                          </span>
                          <button
                            onClick={async () => {
                              try {
                                const { data, error } = await supabase.functions.invoke('generate-signed-urls', {
                                  body: { 
                                    paths: [certificate.certificate_pdf_url],
                                    expiresIn: 300
                                  }
                                });
                                
                                if (error) throw error;
                                
                                if (data?.urls && data.urls.length > 0) {
                                  const link = document.createElement('a');
                                  link.href = data.urls[0];
                                  link.download = `CO2_Certificate_${certificate.request_id}.pdf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }
                              } catch (error) {
                                console.error('Error downloading certificate:', error);
                                alert('Failed to download certificate. Please try again.');
                              }
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            <Download size={16} />
                            Download PDF
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500 text-xs mb-1">CO2 Offset</div>
                          <div className="text-gray-900">{certificate.total_emissions_kg ? `${(certificate.total_emissions_kg / 1000).toFixed(1)}t CO₂` : 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs mb-1">Aircraft Type</div>
                          <div className="text-gray-900">{certificate.aircraft_type || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs mb-1">Flight Date</div>
                          <div className="text-gray-900">{certificate.first_flight_date && formatDate(certificate.first_flight_date)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs mb-1">Certificate Type</div>
                          <div className="text-gray-900 capitalize">{certificate.certification_type || 'Standard'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* CO2 Requests List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-medium text-gray-900">CO2 Certificate Requests</h3>
            <p className="text-sm text-gray-500">Track your certification requests and progress</p>
          </div>
          {co2Requests.length === 0 ? (
            <div className="text-center py-12">
              <Leaf size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-600 mb-2">No certificate requests yet</p>
              <p className="text-gray-500">Your CO2 certificate history will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {co2Requests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openRequestDetails({ ...request, type: 'co2-certificate' })}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <Leaf size={20} className="text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {request.origin || 'N/A'} → {request.destination || 'N/A'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {request.first_flight_date && formatDate(request.first_flight_date)} • {request.metadata?.form_data?.flightDuration || 'N/A'}h
                        </p>
                        <p className="text-xs text-gray-400">
                          {request.aircraft_type || 'N/A'} • {request.passenger_count || 0} pax • {request.metadata?.form_data?.tailNumber || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      {request.status === 'completed' && request.wallet_address && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const explorerUrl = request.metadata?.form_data?.blockchainChain === 'ethereum'
                              ? `https://etherscan.io/address/${request.wallet_address}`
                              : `https://basescan.org/address/${request.wallet_address}`;
                            window.open(explorerUrl, '_blank');
                          }}
                          className="text-black hover:underline text-sm"
                        >
                          View on Explorer
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Certificate Type</div>
                      <div className="text-gray-900">{request.certification_type || 'Standard'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Emissions</div>
                      <div className="text-gray-900">{request.total_emissions_kg ? `${(request.total_emissions_kg / 1000).toFixed(1)}t CO₂` : 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Offset Cost</div>
                      <div className="text-gray-900">€{request.carbon_offset_cost || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Total Cost</div>
                      <div className="text-gray-900">€{request.total_cost || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Blockchain</div>
                      <div className="text-gray-900 capitalize">{request.metadata?.form_data?.blockchainChain || 'Ethereum'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Rush Processing</div>
                      <div className="text-gray-900">{request.urgency === 'rush' ? 'Yes' : 'No'}</div>
                    </div>
                  </div>

                  {request.metadata?.form_data?.specialInstructions && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-gray-500 text-xs mb-1">Special Instructions</div>
                      <div className="text-gray-900 text-sm">{request.metadata.form_data.specialInstructions}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NFT CO2 Certificates */}
        {walletConnected && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">NFT CO2 Certificates</h3>
            {walletAssets.walletCertificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {walletAssets.walletCertificates.map((cert, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Leaf size={16} className="text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Certificate #{cert.tokenId}</p>
                        <p className="text-sm text-gray-600">{cert.flightRoute}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{cert.offsetAmount} • {cert.issuedDate}</p>
                    <button
                      onClick={() => window.open(`https://basescan.org/token/0x123/${cert.tokenId}`, '_blank')}
                      className="text-xs text-black hover:underline"
                    >
                      View on Blockchain Explorer
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Leaf size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No NFT certificates in connected wallet</p>
                <p className="text-gray-500 text-sm">Complete CO2 certificate requests to receive NFTs</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render Wallet Tab
  const renderWallet = () => (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 mb-1">Wallet & NFT Memberships</h1>
          <p className="text-gray-500 text-sm">Connect your wallet to view exclusive benefits</p>
        </div>
        {walletConnected ? (
          <button
            onClick={disconnectWallet}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-black border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <X size={16} />
            Disconnect
          </button>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Use the wallet menu above to connect</p>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
              <Wallet size={16} />
              <span>Wallet Not Connected</span>
            </div>
          </div>
        )}
      </div>

      {!walletConnected ? (
        <>
          <div className="bg-gray-50 rounded-2xl p-8 text-center">
            <Wallet size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Connect your Web3 wallet to check for NFT memberships and unlock exclusive benefits
            </p>
            <p className="text-sm text-gray-500">
              Use the wallet menu in the header to connect your wallet
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">NFT Membership Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gray-200 rounded-lg mx-auto mb-2"></div>
                <h4 className="font-medium text-gray-900 text-sm">Empty Leg</h4>
                <p className="text-xs text-gray-600">10% Discount</p>
              </div>
              <div className="text-center p-4 bg-gray-100 rounded-lg">
                <div className="w-8 h-8 bg-gray-300 rounded-lg mx-auto mb-2"></div>
                <h4 className="font-medium text-gray-900 text-sm">Airport Transfer</h4>
                <p className="text-xs text-gray-600">Free Transfer</p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <div className="w-8 h-8 bg-gray-600 rounded-lg mx-auto mb-2"></div>
                <h4 className="font-medium text-white text-sm">24/7 Support</h4>
                <p className="text-xs text-gray-300">Priority Support</p>
              </div>
              <div className="text-center p-4 bg-black rounded-lg">
                <div className="w-8 h-8 bg-gray-700 rounded-lg mx-auto mb-2"></div>
                <h4 className="font-medium text-white text-sm">Global Events</h4>
                <p className="text-xs text-gray-300">Special Access</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="bg-gray-50 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Wallet Connected</h3>
                <p className="text-gray-600 text-sm font-mono">
                  {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                  <span>{walletAssets.balance} ETH</span>
                  <span>{walletAssets.nfts.length} NFTs</span>
                  <span>{walletAssets.walletCertificates.length} Certificates</span>
                </div>
              </div>
              <CheckCircle size={24} className="text-gray-600" />
            </div>
          </div>

          {walletAssets.nfts.length > 0 ? (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Your NFT Memberships</h3>

              {walletAssets.nfts.map((nft) => (
                <div key={nft.tokenId} className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                        <Crown size={20} className="text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">PVCX Membership NFT</h4>
                        <p className="text-gray-600 text-sm">Token #{nft.tokenId}</p>
                        <p className="text-xs text-gray-500">
                          From: Creator Address 0x742d...5f1c
                        </p>
                        <p className="text-xs text-gray-500">
                          Acquired: {formatDate(nft.acquired)}
                          {nft.expiresAt && ` • Expires: ${formatDate(nft.expiresAt)}`}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-black text-white">
                      Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Percent size={16} className="text-gray-600 mx-auto mb-1" />
                      <div className="font-medium text-gray-900 text-sm">10%</div>
                      <div className="text-xs text-gray-600">Empty Leg Discount</div>
                    </div>

                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Car size={16} className="text-gray-600 mx-auto mb-1" />
                      <div className="font-medium text-gray-900 text-sm">Free</div>
                      <div className="text-xs text-gray-600">Airport Transfer</div>
                    </div>

                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Gift size={16} className="text-gray-600 mx-auto mb-1" />
                      <div className="font-medium text-gray-900 text-sm">Yes</div>
                      <div className="text-xs text-gray-600">Giveaway Access</div>
                    </div>

                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Coins size={16} className="text-gray-600 mx-auto mb-1" />
                      <div className="font-medium text-gray-900 text-sm">???</div>
                      <div className="text-xs text-gray-600">PVCX TOKEN</div>
                    </div>

                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Users size={16} className="text-gray-600 mx-auto mb-1" />
                      <div className="font-medium text-gray-900 text-sm">24/7</div>
                      <div className="text-xs text-gray-600">Priority Support</div>
                    </div>

                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Zap size={16} className="text-gray-600 mx-auto mb-1" />
                      <div className="font-medium text-gray-900 text-sm">1 Free</div>
                      <div className="text-xs text-gray-600">Empty Leg Flight</div>
                    </div>

                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Globe size={16} className="text-gray-600 mx-auto mb-1" />
                      <div className="font-medium text-gray-900 text-sm">Global</div>
                      <div className="text-xs text-gray-600">Special Events</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Crown size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-2">No NFT Memberships Found</p>
              <p className="text-gray-500">This wallet doesn't contain any NFT memberships</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Render Transactions Section
  const renderTransactions = () => (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 mb-1">Transactions</h1>
          <p className="text-gray-500 text-sm">View your transaction history and wallet activity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Balance Card - Black Background */}
        <div className="bg-black rounded-2xl p-6 text-white shadow-xl border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <Wallet size={20} />
            <span className="text-xs bg-white/10 px-2 py-1 rounded-full font-medium">Balance</span>
          </div>
          <p className="text-3xl font-medium mb-1">{walletAssets.balance || '0'} ETH</p>
          <p className="text-sm text-gray-400">Total Wallet Balance</p>
        </div>

        {/* Total Transactions Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <CreditCard size={20} className="text-gray-600" />
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">Activity</span>
          </div>
          <p className="text-3xl font-medium text-gray-900 mb-1">0</p>
          <p className="text-sm text-gray-500">Total Transactions</p>
        </div>

        {/* Pending Transactions Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock size={20} className="text-gray-600" />
            <span className="text-xs bg-orange-100 px-2 py-1 rounded-full text-orange-600">Pending</span>
          </div>
          <p className="text-3xl font-medium text-gray-900 mb-1">0</p>
          <p className="text-sm text-gray-500">Pending Transactions</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
          <p className="text-sm text-gray-500">All wallet transactions and activities</p>
        </div>
        <div className="text-center py-12">
          <CreditCard size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-600 mb-2">No Transactions Yet</p>
          <p className="text-gray-500">Your transaction history will appear here</p>
        </div>
      </div>
    </div>
  );

  // Render Tokenized Assets Section
  const renderTokenizedAssets = () => (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 mb-1">Tokenized Assets</h1>
          <p className="text-gray-500 text-sm">Manage your digital assets and investments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Assets Card */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Gem size={20} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Portfolio</span>
          </div>
          <p className="text-3xl font-medium mb-1">$0.00</p>
          <p className="text-sm text-purple-200">Total Asset Value</p>
        </div>

        {/* NFTs Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <Crown size={20} className="text-gray-600" />
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">NFTs</span>
          </div>
          <p className="text-3xl font-medium text-gray-900 mb-1">{walletAssets.nfts.length}</p>
          <p className="text-sm text-gray-500">NFT Holdings</p>
        </div>

        {/* Certificates Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <Leaf size={20} className="text-gray-600" />
            <span className="text-xs bg-green-100 px-2 py-1 rounded-full text-green-600">CO2</span>
          </div>
          <p className="text-3xl font-medium text-gray-900 mb-1">{walletAssets.walletCertificates.length}</p>
          <p className="text-sm text-gray-500">CO2 Certificates</p>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Your Assets</h3>
          <p className="text-sm text-gray-500">Digital assets and tokenized investments</p>
        </div>
        <div className="text-center py-12">
          <Gem size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-600 mb-2">No Assets Found</p>
          <p className="text-gray-500">Your tokenized assets will appear here</p>
        </div>
      </div>
    </div>
  );

  // Render DAO Section
  const renderDAO = () => (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 mb-1">DAO Governance</h1>
          <p className="text-gray-500 text-sm">Participate in platform governance and voting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Voting Power Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users size={20} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Power</span>
          </div>
          <p className="text-3xl font-medium mb-1">0</p>
          <p className="text-sm text-blue-200">Voting Power</p>
        </div>

        {/* Active Proposals Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <FileText size={20} className="text-gray-600" />
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">Active</span>
          </div>
          <p className="text-3xl font-medium text-gray-900 mb-1">0</p>
          <p className="text-sm text-gray-500">Active Proposals</p>
        </div>

        {/* Your Votes Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle size={20} className="text-gray-600" />
            <span className="text-xs bg-green-100 px-2 py-1 rounded-full text-green-600">Voted</span>
          </div>
          <p className="text-3xl font-medium text-gray-900 mb-1">0</p>
          <p className="text-sm text-gray-500">Your Votes</p>
        </div>
      </div>

      {/* Proposals List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Governance Proposals</h3>
          <p className="text-sm text-gray-500">Vote on platform decisions and improvements</p>
        </div>
        <div className="text-center py-12">
          <Users size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-600 mb-2">No Active Proposals</p>
          <p className="text-gray-500">Governance proposals will appear here</p>
        </div>
      </div>
    </div>
  );

  // Render Chat Support Section
  const renderChatSupport = () => {
    const [messages, setMessages] = useState([
      {
        id: '1',
        from: 'support',
        text: 'Hello! Welcome to PrivateCharterX support. How can we help you today?',
        timestamp: new Date().toISOString()
      }
    ]);
    const [newMessage, setNewMessage] = useState('');

    const sendMessage = () => {
      if (!newMessage.trim()) return;

      const userMessage = {
        id: Date.now().toString(),
        from: 'user',
        text: newMessage,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');

      // Simulate support response
      setTimeout(() => {
        const supportMessage = {
          id: (Date.now() + 1).toString(),
          from: 'support',
          text: 'Thank you for your message. Our support team will respond shortly.',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, supportMessage]);
      }, 1000);
    };

    return (
      <div className="p-8 h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-medium text-gray-900 mb-1">Chat Support</h1>
          <p className="text-gray-500 text-sm">Get instant help from our support team</p>
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full flex items-center justify-center text-white text-sm font-medium">
                PCX
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">PrivateCharterX Support</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.from === 'user'
                        ? 'bg-black text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${message.from === 'user' ? 'text-gray-300' : 'text-gray-500'}`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm placeholder-gray-400 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      {/* Compact Header with Icons */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MenuIcon size={18} className="text-gray-600" />
          </button>

          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-900">{user?.name || 'User Dashboard'}</h2>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-2">
          {/* Location Badges */}
          <div className="hidden md:flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg">
              <MapPin size={10} className="text-gray-500" />
              <span className="text-xs text-gray-700">{locationData.city || 'Loading...'}</span>
            </div>
            {walletConnected && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-700">Connected</span>
              </div>
            )}
          </div>

          {/* Favorites Icon */}
          <button className="relative w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors">
            <Heart size={16} className="text-gray-600" />
            {favorites.length > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] text-white font-medium">{favorites.length}</span>
              </div>
            )}
          </button>

          {/* Notifications Icon */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell size={16} className="text-gray-600" />
            {notifications.filter(n => n.unread).length > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] text-white font-medium">{notifications.filter(n => n.unread).length}</span>
              </div>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-14 right-4 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
              <div className="p-3 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                      notif.unread ? 'bg-blue-50' : ''
                    }`}
                  >
                    <p className="text-xs text-gray-900">{notif.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Collapsible Black Sidebar - Compact Style */}
        <aside className={`hidden md:block bg-black text-white transition-all duration-300 flex-shrink-0 ${
          sidebarCollapsed ? 'w-16' : 'w-48'
        }`}>
          <nav className={`p-3 space-y-0.5 ${sidebarCollapsed ? 'px-2' : ''}`}>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  title={sidebarCollapsed ? item.label : ''}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-left relative ${
                    currentView === item.id
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="text-xs font-medium flex-1">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-700 text-gray-300">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-white font-medium">{item.badge}</span>
                    </div>
                  )}
                </button>
              );
            })}

            <div className={`pt-2 mt-2 border-t border-gray-800 ${sidebarCollapsed ? 'px-0' : ''}`}>
              <button
                onClick={() => signOut()}
                title={sidebarCollapsed ? 'Logout' : ''}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`}
              >
                <LogOut size={16} className="flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-xs font-medium">Sign Out</span>}
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 pb-16">
          {currentView === 'overview' && renderOverview()}
          {currentView === 'requests' && renderRequests()}
          {currentView === 'transactions' && renderTransactions()}
          {currentView === 'tokenized-assets' && renderTokenizedAssets()}
          {currentView === 'dao' && renderDAO()}
          {currentView === 'co2-certificates' && renderCO2Certificates()}
          {currentView === 'wallet' && renderWallet()}
          {currentView === 'chat-support' && renderChatSupport()}
          {currentView === 'kyc' && (
            <KYCForm
              onComplete={() => {
                setKycStatus('pending');
                setCurrentView('overview');
              }}
            />
          )}
          {currentView === 'profiles' && (
            <div className="max-h-full overflow-y-auto">
              <ProfileSettings />
            </div>
          )}
        </main>
      </div>

      {/* Request Details Modal */}
      {showRequestDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-pdf-content="request-details">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${getCategoryInfoForRequest(selectedRequest.type).bgColor} rounded-xl flex items-center justify-center text-2xl`}>
                  {getCategoryInfoForRequest(selectedRequest.type).image}
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {getCategoryInfoForRequest(selectedRequest.type).name} Request
                    {(selectedRequest.type === 'nft_discount_empty_leg' || selectedRequest.type === 'nft_free_flight') && (
                      <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                        {selectedRequest.type === 'nft_free_flight' ? 'NFT FREE' : 'NFT 10% OFF'}
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-600">ID: {selectedRequest.id.slice(0, 8)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={closeRequestDetails}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Request Details</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Status</div>
                        <div className="text-sm font-medium text-gray-900">{selectedRequest.status}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Type</div>
                        <div className="text-sm font-medium text-gray-900">{selectedRequest.type}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Route/Destination</div>
                      <div className="text-sm font-medium text-gray-900">
                        {selectedRequest.type === 'flight_booking'
                          ? `${selectedRequest.origin_airport_code || ''} → ${selectedRequest.destination_airport_code || ''}`
                          : (selectedRequest.type === 'emptyleg' || selectedRequest.type === 'empty_leg' || selectedRequest.type === 'nft_discount_empty_leg' || selectedRequest.type === 'nft_free_flight')
                            ? `${selectedRequest.data?.departure_iata || ''} → ${selectedRequest.data?.arrival_iata || ''}`
                            : selectedRequest.type === 'adventures'
                              ? `${selectedRequest.data?.origin || ''} → ${selectedRequest.data?.destination || ''}`
                              : (selectedRequest.type === 'co2-certificate' || selectedRequest.service_type === 'carbon_offset_certificate')
                                ? `${selectedRequest.origin || ''} → ${selectedRequest.destination || ''}`
                                : selectedRequest.data?.from && selectedRequest.data?.to
                                  ? `${selectedRequest.data?.from} → ${selectedRequest.data?.to}`
                                  : 'N/A'
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Submitted</div>
                      <div className="text-sm font-medium text-gray-900">{formatDate(selectedRequest.created_at)}</div>
                    </div>
                  </div>
                </div>

                {/* Flight Booking Specific Details */}
                {selectedRequest.type === 'flight_booking' && (
                  <>
                    {/* Route Information with Map */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Flight Route</h3>
                      {(() => {
                        const { origin, destination } = getRouteCoordinates(
                          selectedRequest.origin_airport_code || '',
                          selectedRequest.destination_airport_code || ''
                        );
                        const distance = calculateDistance(
                          selectedRequest.origin_airport_code || '',
                          selectedRequest.destination_airport_code || ''
                        );
                        const originAirport = getAirportByCode(selectedRequest.origin_airport_code || '');
                        const destinationAirport = getAirportByCode(selectedRequest.destination_airport_code || '');

                        return (
                          <div className="space-y-4">
                            {/* Route Preview Map */}
                            <RoutePreviewMap
                              origin={origin}
                              destination={destination}
                              className="h-48"
                            />

                            {/* Airport Details */}
                            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                              {/* Origin Airport */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                  <div className="text-xs font-medium text-gray-700">DEPARTURE</div>
                                </div>
                                <div className="ml-5">
                                  <div className="text-sm font-medium text-gray-900">
                                    {originAirport?.name || selectedRequest.origin_airport_code || 'Unknown Airport'}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {originAirport ? `${originAirport.city}, ${originAirport.country}` : 'Location unknown'}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    IATA: {selectedRequest.origin_airport_code || 'N/A'}
                                    {originAirport?.icao && ` • ICAO: ${originAirport.icao}`}
                                  </div>
                                </div>
                              </div>

                              {/* Route Info */}
                              {distance && (
                                <div className="flex items-center justify-center py-2">
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <div className="flex-1 h-px bg-gray-300"></div>
                                    <span className="px-2 bg-gray-100 rounded-full">
                                      {distance.toLocaleString()} km
                                    </span>
                                    <div className="flex-1 h-px bg-gray-300"></div>
                                  </div>
                                </div>
                              )}

                              {/* Destination Airport */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                  <div className="text-xs font-medium text-gray-700">ARRIVAL</div>
                                </div>
                                <div className="ml-5">
                                  <div className="text-sm font-medium text-gray-900">
                                    {destinationAirport?.name || selectedRequest.destination_airport_code || 'Unknown Airport'}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {destinationAirport ? `${destinationAirport.city}, ${destinationAirport.country}` : 'Location unknown'}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    IATA: {selectedRequest.destination_airport_code || 'N/A'}
                                    {destinationAirport?.icao && ` • ICAO: ${destinationAirport.icao}`}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Flight Details</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Departure Date</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.departure_date ? formatDate(selectedRequest.departure_date) : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Departure Time</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.departure_time || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Passengers</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.passengers || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Luggage</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.luggage || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Pets</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.pets || '0'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Aircraft Category</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.selected_jet_category || 'TBD'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Services & Options</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Aviation Services</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.aviation_services && selectedRequest.aviation_services.length > 0
                                ? selectedRequest.aviation_services.join(', ')
                                : 'None selected'
                              }
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Luxury Services</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.luxury_services && selectedRequest.luxury_services.length > 0
                                ? selectedRequest.luxury_services.join(', ')
                                : 'None selected'
                              }
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Carbon Offset</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.carbon_option === 'full' ? 'Full Offset' : 'None'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Payment Method</div>
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {selectedRequest.payment_method || 'N/A'}
                            </div>
                          </div>
                        </div>
                        {selectedRequest.carbon_nft_wallet && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Carbon NFT Wallet</div>
                            <div className="text-sm font-medium text-gray-900 font-mono break-all">
                              {selectedRequest.carbon_nft_wallet}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Pricing Information</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Total Price</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.total_price
                                ? `${new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: selectedRequest.currency || 'EUR'
                                }).format(selectedRequest.total_price)}`
                                : 'Quote on request'
                              }
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Currency</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.currency || 'EUR'}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">NFT Discount Applied</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.nft_discount_applied ? 'Yes' : 'No'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Wallet Connected</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.wallet_address ? 'Yes' : 'No'}
                            </div>
                          </div>
                        </div>
                        {selectedRequest.wallet_address && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Wallet Address</div>
                            <div className="text-sm font-medium text-gray-900 font-mono break-all">
                              {selectedRequest.wallet_address}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Contact Information</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Contact Name</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.contact_name || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Email</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.contact_email || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Phone</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.contact_phone || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Company</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.contact_company || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedRequest.notes && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-4">Additional Notes</h3>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-sm text-gray-900">
                            {selectedRequest.notes}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Empty Leg Specific Details */}
                {(selectedRequest.type === 'emptyleg' || selectedRequest.type === 'empty_leg' || selectedRequest.type === 'nft_discount_empty_leg' || selectedRequest.type === 'nft_free_flight') && selectedRequest.data && (
                  <>
                    {/* Route Information with Map */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Flight Route</h3>
                      {(() => {
                        // Use departure_iata and arrival_iata from the data structure
                        const originCode = selectedRequest.data.departure_iata;
                        const destinationCode = selectedRequest.data.arrival_iata;

                        if (originCode && destinationCode) {
                          const { origin, destination } = getRouteCoordinates(originCode, destinationCode);
                          const distance = calculateDistance(originCode, destinationCode);
                          const originAirport = getAirportByCode(originCode);
                          const destinationAirport = getAirportByCode(destinationCode);

                          return (
                            <div className="space-y-4">
                              {/* Route Preview Map */}
                              <RoutePreviewMap
                                origin={origin}
                                destination={destination}
                                className="h-48"
                              />

                              {/* Airport Details */}
                              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                                {/* Origin Airport */}
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <div className="text-xs font-medium text-gray-700">DEPARTURE</div>
                                  </div>
                                  <div className="ml-5">
                                    <div className="text-sm font-medium text-gray-900">
                                      {originAirport?.name || originCode || 'Unknown Airport'}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      {originAirport ? `${originAirport.city}, ${originAirport.country}` : 'Location unknown'}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      IATA: {originCode}
                                      {originAirport?.icao && ` • ICAO: ${originAirport.icao}`}
                                    </div>
                                  </div>
                                </div>

                                {/* Route Info */}
                                {distance && (
                                  <div className="flex items-center justify-center py-2">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <div className="flex-1 h-px bg-gray-300"></div>
                                      <span className="px-2 bg-gray-100 rounded-full">
                                        {distance.toLocaleString()} km
                                      </span>
                                      <div className="flex-1 h-px bg-gray-300"></div>
                                    </div>
                                  </div>
                                )}

                                {/* Destination Airport */}
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <div className="text-xs font-medium text-gray-700">ARRIVAL</div>
                                  </div>
                                  <div className="ml-5">
                                    <div className="text-sm font-medium text-gray-900">
                                      {destinationAirport?.name || destinationCode || 'Unknown Airport'}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      {destinationAirport ? `${destinationAirport.city}, ${destinationAirport.country}` : 'Location unknown'}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      IATA: {destinationCode}
                                      {destinationAirport?.icao && ` • ICAO: ${destinationAirport.icao}`}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          // Fallback if no airport codes found
                          return (
                            <div className="bg-gray-50 rounded-xl p-4">
                              <div className="text-sm font-medium text-gray-900">
                                {selectedRequest.data.flight_route || selectedRequest.data.offer_title || 'Route information not available'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Airport codes not available in request data
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Flight Information</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Flight Route</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.data.flight_route || `${selectedRequest.data.offer_title || 'N/A'}`}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Departure Date</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.data.departure_date ? formatDate(selectedRequest.data.departure_date) : 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Departure Time</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.data.departure_time || 'TBD'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Aircraft Type</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.data.aircraft_type || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Capacity</div>
                            <div className="text-sm font-medium text-gray-900">
                              Up to {selectedRequest.data.capacity || 'N/A'} passengers
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Offer ID</div>
                            <div className="text-sm font-medium text-gray-900 font-mono">
                              {selectedRequest.data.offer_id || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Pricing Information</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Currency</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.data.currency || 'EUR'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Total Price</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.data.price
                                ? `${selectedRequest.data.currency || 'EUR'} ${selectedRequest.data.price.toLocaleString()}`
                                : 'N/A'
                              }
                            </div>
                          </div>
                        </div>
                        {selectedRequest.data.pricing_breakdown && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Base Price</div>
                                <div className="text-sm font-medium text-gray-900">
                                  {selectedRequest.data.pricing_breakdown.base
                                    ? `${selectedRequest.data.currency || 'EUR'} ${selectedRequest.data.pricing_breakdown.base.toLocaleString()}`
                                    : 'N/A'
                                  }
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Tax (8.1%)</div>
                                <div className="text-sm font-medium text-gray-900">
                                  {selectedRequest.data.pricing_breakdown.tax
                                    ? `${selectedRequest.data.currency || 'EUR'} ${selectedRequest.data.pricing_breakdown.tax.toLocaleString()}`
                                    : 'N/A'
                                  }
                                </div>
                              </div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="text-xs text-green-600 mb-1 font-medium">Savings</div>
                              <div className="text-sm font-medium text-green-700">
                                Save up to 75% compared to regular charter
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* NFT Benefits Section - Only show for NFT request types */}
                    {(selectedRequest.type === 'nft_discount_empty_leg' || selectedRequest.type === 'nft_free_flight') && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-4">NFT Benefits Applied</h3>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                              🎫
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-gray-900">
                                  {selectedRequest.type === 'nft_free_flight' ? 'FREE FLIGHT' : '10% DISCOUNT'}
                                </div>
                                <div className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                                  NFT MEMBER
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">Original Price</div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {selectedRequest.data?.original_price
                                      ? `${selectedRequest.data.currency || 'EUR'} ${selectedRequest.data.original_price.toLocaleString()}`
                                      : 'N/A'
                                    }
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">Final Price</div>
                                  <div className="text-sm font-medium text-green-700">
                                    {selectedRequest.data?.final_price !== undefined
                                      ? selectedRequest.data.final_price === 0
                                        ? 'FREE'
                                        : `${selectedRequest.data.currency || 'EUR'} ${selectedRequest.data.final_price.toLocaleString()}`
                                      : 'N/A'
                                    }
                                  </div>
                                </div>
                              </div>

                              {selectedRequest.data?.nft_used && (
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">NFT Used</div>
                                  <div className="text-sm font-medium text-gray-900 bg-white rounded px-2 py-1 border">
                                    {formattedNFTName || selectedRequest.data.nft_used}
                                  </div>
                                </div>
                              )}

                              {selectedRequest.data?.wallet_address && (
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">Wallet Address</div>
                                  <div className="text-xs font-mono text-gray-700 bg-white rounded px-2 py-1 border break-all">
                                    {selectedRequest.data.wallet_address}
                                  </div>
                                </div>
                              )}

                              {selectedRequest.data?.booking_reference && (
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">Booking Reference</div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {selectedRequest.data.booking_reference}
                                  </div>
                                </div>
                              )}

                              <div className="text-xs text-gray-600 bg-gray-100 rounded-lg p-2">
                                ✨ This booking used PrivateCharterX NFT benefits for {selectedRequest.type === 'nft_free_flight' ? 'a completely free flight' : 'a 10% discount'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Customer Information</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        {(() => {
                          // Try to get customer details from various possible locations in the data structure
                          const customerDetails = selectedRequest.data.customer_details ||
                            selectedRequest.data.formData ||
                            selectedRequest.data;

                          const name = customerDetails?.name || selectedRequest.client_name || selectedRequest.contact_name;
                          const email = customerDetails?.email || selectedRequest.client_email || selectedRequest.contact_email;
                          const phone = customerDetails?.phone || selectedRequest.contact_phone;
                          const currency = customerDetails?.currency || selectedRequest.data.currency;
                          const message = customerDetails?.message || selectedRequest.notes;

                          return (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Name</div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {name || 'N/A'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Email</div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {email || 'N/A'}
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Phone</div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {phone || 'N/A'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Preferred Currency</div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {currency || 'EUR'}
                                  </div>
                                </div>
                              </div>
                              {message && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Special Requests / Notes</div>
                                  <div className="text-sm text-gray-900 p-3 bg-white rounded-lg border">
                                    {message}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </>
                )}

                {/* Adventures/Fixed Offer Specific Details */}
                {selectedRequest.type === 'adventures' && selectedRequest.data && (
                  <>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Package Information</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Package Title</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.data.offer_title || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Package Type</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.data.package_type || 'Adventure'}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Origin</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.data.origin || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Destination</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.data.destination || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Duration</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.data.duration || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Difficulty Level</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.data.difficulty_level || 'N/A'}
                            </div>
                          </div>
                        </div>
                        {selectedRequest.data.offer_description && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Description</div>
                            <div className="text-sm text-gray-900 p-3 bg-white rounded-lg border max-h-32 overflow-y-auto">
                              {selectedRequest.data.offer_description}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Booking Details</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Departure Date</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.data.departure_date
                                ? formatDate(selectedRequest.data.departure_date)
                                : selectedRequest.data.departure_date_formatted || 'N/A'
                              }
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Passengers</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.data.passengers || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Selected Currency</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.data.selected_currency || 'EUR'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Offer ID</div>
                            <div className="text-sm font-medium text-gray-900 font-mono">
                              {selectedRequest.data.offer_id || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Pricing Information</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Price on Request</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.data.price_on_request ? 'Yes' : 'No'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Original Currency</div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedRequest.data.original_currency || 'EUR'}
                            </div>
                          </div>
                        </div>
                        {selectedRequest.data.original_price && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Original Price</div>
                              <div className="text-sm font-medium text-gray-900">
                                {selectedRequest.data.original_currency || 'EUR'} {selectedRequest.data.original_price.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Converted Price</div>
                              <div className="text-sm font-medium text-gray-900">
                                {selectedRequest.data.selected_currency || 'EUR'} {selectedRequest.data.converted_price?.toLocaleString() || 'N/A'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Package Inclusions</h3>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          {selectedRequest.data.includes_wifi && (
                            <div className="flex items-center gap-2">
                              <Check size={14} className="text-green-600" />
                              <span className="text-gray-900">WiFi Included</span>
                            </div>
                          )}
                          {selectedRequest.data.includes_catering && (
                            <div className="flex items-center gap-2">
                              <Check size={14} className="text-green-600" />
                              <span className="text-gray-900">Catering Included</span>
                            </div>
                          )}
                          {selectedRequest.data.includes_ground_transport && (
                            <div className="flex items-center gap-2">
                              <Check size={14} className="text-green-600" />
                              <span className="text-gray-900">Ground Transport</span>
                            </div>
                          )}
                          {selectedRequest.data.includes_accommodation && (
                            <div className="flex items-center gap-2">
                              <Check size={14} className="text-green-600" />
                              <span className="text-gray-900">Accommodation</span>
                            </div>
                          )}
                          {selectedRequest.data.includes_concierge && (
                            <div className="flex items-center gap-2">
                              <Check size={14} className="text-green-600" />
                              <span className="text-gray-900">Concierge Service</span>
                            </div>
                          )}
                          {selectedRequest.data.includes_photography && (
                            <div className="flex items-center gap-2">
                              <Check size={14} className="text-green-600" />
                              <span className="text-gray-900">Photography</span>
                            </div>
                          )}
                          {selectedRequest.data.includes_helicopter && (
                            <div className="flex items-center gap-2">
                              <Check size={14} className="text-green-600" />
                              <span className="text-gray-900">Helicopter Experience</span>
                            </div>
                          )}
                          {selectedRequest.data.includes_yacht && (
                            <div className="flex items-center gap-2">
                              <Check size={14} className="text-green-600" />
                              <span className="text-gray-900">Yacht Charter</span>
                            </div>
                          )}
                          {selectedRequest.data.includes_safari && (
                            <div className="flex items-center gap-2">
                              <Check size={14} className="text-green-600" />
                              <span className="text-gray-900">Safari Experience</span>
                            </div>
                          )}
                          {selectedRequest.data.guide_included && (
                            <div className="flex items-center gap-2">
                              <Check size={14} className="text-green-600" />
                              <span className="text-gray-900">Professional Guide</span>
                            </div>
                          )}
                          {selectedRequest.data.equipment_provided && (
                            <div className="flex items-center gap-2">
                              <Check size={14} className="text-green-600" />
                              <span className="text-gray-900">Equipment Provided</span>
                            </div>
                          )}
                          {selectedRequest.data.insurance_included && (
                            <div className="flex items-center gap-2">
                              <Check size={14} className="text-green-600" />
                              <span className="text-gray-900">Travel Insurance</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Customer Information</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        {(() => {
                          const clientInfo = selectedRequest.data.client_info || {};
                          const name = clientInfo.name || selectedRequest.client_name || selectedRequest.contact_name;
                          const email = clientInfo.email || selectedRequest.client_email || selectedRequest.contact_email;
                          const phone = clientInfo.phone || selectedRequest.contact_phone;

                          return (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Name</div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {name || 'N/A'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Email</div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {email || 'N/A'}
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Phone</div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {phone || 'N/A'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Booking Source</div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {selectedRequest.data.booking_source?.replace('_', ' ') || 'Website'}
                                  </div>
                                </div>
                              </div>
                              {selectedRequest.data.message && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Special Requests / Message</div>
                                  <div className="text-sm text-gray-900 p-3 bg-white rounded-lg border">
                                    {selectedRequest.data.message}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </>
                )}

                {/* CO2 Certificate Specific Details */}
                {(selectedRequest.type === 'co2-certificate' || selectedRequest.service_type === 'carbon_offset_certificate') && (
                  <>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Flight Information</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Flight Date</div>
                            <div className="text-sm font-medium text-gray-900">{formatDate(selectedRequest.first_flight_date)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Flight Duration</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.metadata?.form_data?.flightDuration || 'N/A'}h</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Aircraft Type</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.aircraft_type}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Tail Number</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.metadata?.form_data?.tailNumber || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Passengers</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.passenger_count}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Total Emissions</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.total_emissions_kg ? `${(selectedRequest.total_emissions_kg / 1000).toFixed(1)}t CO₂` : 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Certificate Details</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Certificate Type</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.certification_type}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Offset Percentage</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.metadata?.form_data?.offsetPercentage || '100'}%</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Carbon Offset Cost</div>
                            <div className="text-sm font-medium text-gray-900">€{selectedRequest.carbon_offset_cost || 0}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Total Cost</div>
                            <div className="text-sm font-medium text-gray-900">€{selectedRequest.total_cost || 0}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Certificate Format</div>
                            <div className="text-sm font-medium text-gray-900 uppercase">{selectedRequest.metadata?.form_data?.certificateFormat || 'PDF'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Rush Processing</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.urgency === 'rush' ? 'Yes' : 'No'}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Blockchain</div>
                            <div className="text-sm font-medium text-gray-900 capitalize">{selectedRequest.metadata?.form_data?.blockchainChain || 'Ethereum'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Payment Method</div>
                            <div className="text-sm font-medium text-gray-900 capitalize">{selectedRequest.metadata?.form_data?.paymentMethod?.replace('_', ' ') || 'Card'}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Wants Blockchain NFT</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.wants_blockchain_nft ? 'Yes' : 'No'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Wants Email PDF</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.wants_email_pdf ? 'Yes' : 'No'}</div>
                          </div>
                        </div>
                        {selectedRequest.wallet_address && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Receiver Wallet</div>
                            <div className="text-sm font-medium text-gray-900 font-mono break-all">{selectedRequest.wallet_address}</div>
                          </div>
                        )}
                        {selectedRequest.metadata?.form_data?.specialInstructions && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Special Instructions</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.metadata.form_data.specialInstructions}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Company & Billing Information</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Company Name</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.company_name}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Contact Name</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.metadata?.form_data?.contactName || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Email</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.contact_email}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Phone</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.metadata?.form_data?.phone || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Request ID</div>
                            <div className="text-sm font-medium text-gray-900 font-mono">{selectedRequest.request_id}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Service Type</div>
                            <div className="text-sm font-medium text-gray-900 capitalize">{selectedRequest.service_type?.replace('_', ' ')}</div>
                          </div>
                        </div>
                        {selectedRequest.metadata?.form_data?.billingAddress && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Billing Address</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.metadata.form_data.billingAddress}</div>
                          </div>
                        )}
                        {selectedRequest.metadata?.form_data?.taxId && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Tax ID</div>
                            <div className="text-sm font-medium text-gray-900">{selectedRequest.metadata.form_data.taxId}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
