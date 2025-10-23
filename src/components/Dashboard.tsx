import React, { useState, useEffect, useRef } from 'react';
import { bookingService } from '../services/bookingService';
import { BookingRequest } from '../types/booking';
import { supabase } from '../lib/supabase';
import { useAuth } from '../../thefinalwebapplicationpcx-main/src/context/AuthContext';
import TransactionService from '../services/transactionService';
import { web3Service, WalletTransaction } from '../lib/web3';
import ChatSupport from './ChatSupport';
import LaunchpadTransactions from './Landingpagenew/LaunchpadTransactions';
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
  Rocket,
  Mail,
  Crown,
  Gem,
  Sparkles,
  ChevronRight,
  MoreHorizontal,
  Bell,
  Heart,
  MessageCircle,
  Menu as MenuIcon
} from 'lucide-react';
import { getAirportByCode, getRouteCoordinates, calculateDistance } from '../utils/airportLookup';
import RoutePreviewMap from './RoutePreviewMap';
import ProfileSettings from './ProfileSettings';
import ReferralPage from './Landingpagenew/ReferralPage';
import { useAccount, useDisconnect } from 'wagmi';

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
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 max-w-md mx-4 text-center border border-gray-600/40">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
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
  console.log('Dashboard initialTab:', initialTab);
  const { user, isAuthenticated, signOut } = useAuth();
  const { address: walletAddress, isConnected: walletConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const [currentView, setCurrentView] = useState(initialTab || 'overview');
  const [loading, setLoading] = useState(false);
  
  // Determine if we're in Web 3.0 mode - for now, default to RWS services mode (no Web 3.0 features)
  const isWeb3Mode = false; // Set to true to enable Web 3.0 features like tokenized assets, transactions, wallet NFTs

  // Update view when initialTab changes
  useEffect(() => {
    if (initialTab) {
      setCurrentView(initialTab);
      // Hide card grid when coming from external navigation
      if (initialTab !== 'overview') {
        setShowCardGrid(false);
      }
    }
  }, [initialTab]);

  // UI States for compact dashboard
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCardGrid, setShowCardGrid] = useState(!initialTab || initialTab === 'overview'); // Show card menu only for overview or no initialTab
  console.log('showCardGrid:', showCardGrid, 'initialTab:', initialTab);
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
    type: 'flight_booking' | 'jets' | 'emptyleg' | 'helicopter' | 'cars' | 'adventures' | 'co2-certificate' | 'private_jet_charter' | 'fixed_offer' | 'empty_leg' | 'helicopter_charter' | 'luxury_car_rental' | 'nft_discount_empty_leg' | 'nft_free_flight' | 'spv_formation' | 'tokenization';
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
  const [blockchainTransactions, setBlockchainTransactions] = useState<WalletTransaction[]>([]);
  const [isLoadingBlockchainTxs, setIsLoadingBlockchainTxs] = useState(false);

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
  const [messageFilter, setMessageFilter] = useState('all');

  // Pagination States for My Requests
  const [currentRequestPage, setCurrentRequestPage] = useState(1);
  const requestsPerPage = 6;

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

  // Fetch blockchain transactions when wallet is connected and viewing transactions
  useEffect(() => {
    const loadBlockchainTransactions = async () => {
      if (!walletAddress || currentView !== 'transactions') {
        return;
      }

      try {
        setIsLoadingBlockchainTxs(true);
        console.log('🔗 Fetching blockchain transactions for:', walletAddress);

        const txs = await web3Service.getRecentTransactions(walletAddress as `0x${string}`, 50);
        setBlockchainTransactions(txs);

        console.log(`✅ Loaded ${txs.length} blockchain transactions`);
      } catch (error) {
        console.error('Failed to fetch blockchain transactions:', error);
        setBlockchainTransactions([]);
      } finally {
        setIsLoadingBlockchainTxs(false);
      }
    };

    loadBlockchainTransactions();
  }, [walletAddress, currentView]);

  // Wallet Assets State
  const [walletAssets, setWalletAssets] = useState<WalletAssets>({
    nfts: [],
    walletCertificates: [],
    balance: '0'
  });

  // Support ticket states
  const [tickets, setTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [ticketStats, setTicketStats] = useState({ total: 0, open: 0, closed: 0, recent: 0 });
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [showCreateTicketForm, setShowCreateTicketForm] = useState(false);

  // Load support tickets when component mounts or when switching to chat support
  useEffect(() => {
    const loadTickets = async () => {
      if (currentView !== 'chat-support') return;
      
      try {
        setIsLoadingTickets(true);
        
        // Get current user
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !currentUser) {
          console.log('No user found, showing empty state');
          setTickets([]);
          setTicketStats({ total: 0, open: 0, closed: 0, recent: 0 });
          return;
        }

        console.log('Loading tickets for user:', currentUser.id);

        // Load tickets from database
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (ticketsError) {
          console.error('Error loading tickets:', ticketsError);
          // If table doesn't exist yet, show empty state
          setTickets([]);
          setTicketStats({ total: 0, open: 0, closed: 0, recent: 0 });
          return;
        }

        console.log('Loaded tickets:', ticketsData);

        // Calculate stats
        const total = ticketsData?.length || 0;
        const open = ticketsData?.filter(t => ['open', 'pending'].includes(t.status))?.length || 0;
        const closed = ticketsData?.filter(t => ['solved', 'closed'].includes(t.status))?.length || 0;
        const recent = ticketsData?.filter(t => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(t.created_at) > weekAgo;
        })?.length || 0;

        setTickets(ticketsData || []);
        setTicketStats({ total, open, closed, recent });
        
      } catch (error) {
        console.error('Failed to load support tickets:', error);
        setTickets([]);
        setTicketStats({ total: 0, open: 0, closed: 0, recent: 0 });
      } finally {
        setIsLoadingTickets(false);
      }
    };

    loadTickets();
  }, [currentView]);

  // Load messages when ticket is selected
  useEffect(() => {
    if (!selectedTicket) {
      setTicketMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        
        console.log('Loading messages for ticket:', selectedTicket.id);

        // Load messages from database
        const { data: messagesData, error: messagesError } = await supabase
          .from('support_ticket_messages')
          .select('*')
          .eq('ticket_id', selectedTicket.id)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Error loading messages:', messagesError);
          setTicketMessages([]);
          return;
        }

        console.log('Loaded messages:', messagesData);
        setTicketMessages(messagesData || []);
        
      } catch (error) {
        console.error('Failed to load ticket messages:', error);
        setTicketMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedTicket]);

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

  // Fetch location and IP data
  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        // Simulate API call for location data
        setTimeout(() => {
          setLocationData({
            city: 'Sofia',
            country: 'Bulgaria',
            ip: '185.94.188.123',
            loading: false
          });
        }, 1000);
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
    { id: 'messages', label: 'Notifications', icon: Bell, badge: notifications.filter(n => n.unread).length },
    // Web 3.0 only items
    ...(isWeb3Mode ? [
      { id: 'transactions', label: 'Transactions', icon: CreditCard },
      { id: 'tokenized-assets', label: 'Tokenized Assets', icon: Gem },
      { id: 'wallet', label: 'Wallet & NFTs', icon: Wallet, badge: walletAssets.nfts.length },
    ] : []),
    { id: 'co2-certificates', label: 'CO2 Certificates', icon: Leaf, badge: co2Stats?.total_requests || 0 },
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
      case 'spv_formation':
        return { name: 'SPV Formation', bgColor: 'bg-violet-50', image: '🏢' };
      case 'tokenization':
        return { name: 'Tokenization', bgColor: 'bg-cyan-50', image: '💠' };
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
    // Only show modal if NOT in requests tab (requests tab shows inline)
    if (currentView !== 'requests') {
      setShowRequestDetails(true);
    } else {
      setShowRequestDetails(true); // Still set to true for inline view to work
    }
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
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Dashboard</h2>
        <p className="text-sm text-gray-600">Welcome back, {user?.name?.split(' ')[0] || 'User'}</p>
      </div>

      {/* KYC Verification Banner - Minimal */}
      {kycStatus === 'not_started' && (
        <div className="bg-white/20 backdrop-blur-md border border-gray-600/40 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-gray-700" />
              <span className="text-sm text-gray-800">Identity verification required</span>
            </div>
            <button
              onClick={() => setCurrentView('kyc')}
              className="text-sm text-gray-900 hover:underline font-medium"
            >
              Verify now
            </button>
          </div>
        </div>
      )}

      {kycStatus === 'pending' && (
        <div className="bg-blue-500/20 backdrop-blur-md border border-blue-600/40 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-blue-700" />
            <span className="text-sm text-blue-900">KYC under review - we'll notify you within 24 hours</span>
          </div>
        </div>
      )}

      {kycStatus === 'verified' && (
        <div className="bg-green-500/20 backdrop-blur-md border border-green-600/40 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle size={16} className="text-green-700" />
            <span className="text-sm text-green-900">Identity verified</span>
          </div>
        </div>
      )}

      {/* Account Summary - Clean Style */}
      <div className="bg-gray-50/60 rounded-xl p-6 border border-gray-200/40">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {user?.name || 'User'}
            </h3>
            {walletAssets.nfts.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                <span className="text-yellow-700 text-xs font-medium">
                  {walletAssets.nfts[0].tier} Member
                </span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-gray-500 text-xs mb-1">Member since</div>
            <div className="text-sm font-medium text-gray-900">{userStats.memberSince}</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white/60 rounded-lg border border-gray-200/30">
            <div className="text-gray-600 text-xs mb-1">Total Requests</div>
            <div className="text-xl font-semibold text-gray-900">{userStats.totalRequests}</div>
          </div>
          <div className="text-center p-3 bg-white/60 rounded-lg border border-gray-200/30">
            <div className="text-gray-600 text-xs mb-1">CO2 Requests</div>
            <div className="text-xl font-semibold text-gray-900">{userStats.co2Requests}</div>
          </div>
          <div className="text-center p-3 bg-white/60 rounded-lg border border-gray-200/30">
            <div className="text-gray-600 text-xs mb-1">Certificates</div>
            <div className="text-xl font-semibold text-gray-900">{co2Stats?.completed_certificates || 0}</div>
          </div>
          <div className="text-center p-3 bg-white/60 rounded-lg border border-gray-200/30">
            <div className="text-gray-600 text-xs mb-1">NFT Benefits</div>
            <div className="text-xl font-semibold text-gray-900">{walletAssets.nfts.length}</div>
          </div>
        </div>
      </div>

      {/* Recent Activity - Clean Style */}
      <div className="bg-gray-50/60 rounded-xl border border-gray-200/40 overflow-hidden">
        <div className="p-6 border-b border-gray-200/30">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            <button
              onClick={() => setCurrentView('requests')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
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
                } else if (request.type === 'spv_formation') {
                  routeInfo = `${request.data?.company_name || 'SPV'} - ${request.data?.jurisdiction || 'Formation'}`;
                } else if (request.type === 'tokenization') {
                  routeInfo = `${request.data?.asset_name || 'Asset'} - ${request.data?.token_type || 'Token'}`;
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

    </div>
  );

  // Render Requests Tab
  const renderRequests = () => (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-800 mb-1">My Requests</h1>
          <p className="text-gray-600 text-xs">
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
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-700 hover:text-gray-900 bg-white/20 backdrop-blur-md border border-gray-600/40 rounded-lg hover:bg-white/30 transition-all">
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4">
        {/* Filter Row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-600" />
            <span className="text-xs text-gray-700 font-medium">Filter by type:</span>
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={requestFilter}
              onChange={(e) => setRequestFilter(e.target.value)}
              className="appearance-none bg-white/20 backdrop-blur-md border border-gray-600/40 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-gray-800 hover:bg-white/30 focus:border-gray-600/60 focus:ring-0 transition-all cursor-pointer"
            >
              <option value="all">All Requests</option>
              <option value="flight_booking">Flight Bookings</option>
              {/* <option value="jets">Private Jets</option> */}
              <option value="emptyleg">Empty Legs</option>
              <option value="helicopter">Helicopters</option>
              {/* <option value="cars">Luxury Cars</option> */}
              <option value="adventures">Adventures</option>
              <option value="spv_formation">SPV Formation</option>
              <option value="tokenization">Tokenization</option>
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

      {/* Requests List or Detail View */}
      {selectedRequest && showRequestDetails ? (
        /* Inline Detail View - Only for My Requests Tab */
        <div className="space-y-4">
          {/* Back Button */}
          <button
            onClick={closeRequestDetails}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 bg-white/20 backdrop-blur-md border border-gray-600/40 rounded-lg hover:bg-white/30 transition-all"
          >
            <ArrowLeft size={16} />
            Back to Requests
          </button>

          {/* Request Details - Inline */}
          <div className="bg-gray-50/60 rounded-xl border border-gray-200/40 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${getCategoryInfoForRequest(selectedRequest.type).bgColor} rounded-xl flex items-center justify-center text-2xl`}>
                  {getCategoryInfoForRequest(selectedRequest.type).image}
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {getCategoryInfoForRequest(selectedRequest.type).name} Request
                  </h2>
                  <p className="text-sm text-gray-600">ID: {selectedRequest.id.slice(0, 8)}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
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
                        : (selectedRequest.type === 'emptyleg' || selectedRequest.type === 'empty_leg')
                          ? `${selectedRequest.data?.departure_iata || ''} → ${selectedRequest.data?.arrival_iata || ''}`
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
            </div>
          </div>
        </div>
      ) : (
        /* Requests List with Pagination */
        <div className="space-y-3">
          {userRequests.length === 0 ? (
            <div className="text-center py-16 bg-gray-100/40 rounded-xl">
              <History size={40} className="text-gray-400 mx-auto mb-3" />
              <p className="text-base text-gray-700 mb-1">No requests yet</p>
              <p className="text-xs text-gray-600">Your request history will appear here</p>
            </div>
          ) : (
            <>
              {userRequests
                .filter(request => {
                  // Filter by request type
                  const matchesFilter = requestFilter === 'all' || request.type === requestFilter;
                  // Search using the helper function
                  const matchesSearch = searchInRequest(request, searchTerm);
                  return matchesFilter && matchesSearch;
                })
                .slice((currentRequestPage - 1) * requestsPerPage, currentRequestPage * requestsPerPage)
                .map((request) => {
              const categoryInfo = getCategoryInfoForRequest(request.type);
              return (
                <div
                  key={request.id}
                  className="p-4 bg-gray-50/60 hover:bg-gray-100/60 rounded-xl border border-gray-200/40 transition-colors cursor-pointer"
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

              {/* Pagination Controls */}
              {(() => {
                const filteredRequests = userRequests.filter(request => {
                  const matchesFilter = requestFilter === 'all' || request.type === requestFilter;
                  const matchesSearch = searchInRequest(request, searchTerm);
                  return matchesFilter && matchesSearch;
                });
                const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);

                if (totalPages <= 1) return null;

                return (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                      onClick={() => setCurrentRequestPage(prev => Math.max(1, prev - 1))}
                      disabled={currentRequestPage === 1}
                      className="px-3 py-1.5 text-xs bg-white/20 backdrop-blur-md border border-gray-600/40 rounded-lg hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentRequestPage(page)}
                          className={`w-8 h-8 text-xs rounded-lg transition-all ${
                            currentRequestPage === page
                              ? 'bg-gray-900 text-white'
                              : 'bg-white/20 backdrop-blur-md border border-gray-600/40 hover:bg-white/30'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentRequestPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentRequestPage === totalPages}
                      className="px-3 py-1.5 text-xs bg-white/20 backdrop-blur-md border border-gray-600/40 rounded-lg hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );

  // Render Tokenized Assets Tab
  const renderTokenizedAssets = () => (
    <div className="p-8 space-y-6">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Tokenized Assets</h2>
        <p className="text-sm text-gray-600">View and manage your tokenized assets</p>
      </div>

      {/* Content */}
      <div className="bg-gray-100/40 rounded-xl p-8 text-center">
        <Sparkles size={48} className="text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Tokenized Assets Yet</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Your tokenized assets will appear here once you create them
        </p>
      </div>
    </div>
  );

  // Render Chat Support Tab
  const renderChatSupport = () => {
    return (
      <div className="h-full w-full">
        <ChatSupport user={user} />
      </div>
    );
  };

  const renderChatSupport_old = () => {
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'open':
        case 'pending':
          return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'solved':
        case 'closed':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'hold':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getTicketTypeIcon = (ticketData) => {
      if (ticketData?.type === 'consultation') return '🎯';
      if (ticketData?.type === 'technical') return '⚙️';
      if (ticketData?.type === 'urgent') return '🚨';
      return '💬';
    };

    const handleCreateNewTicket = () => {
      setShowCreateTicketForm(true);
      setSelectedTicket(null);
    };

    return (
      <div className="h-full w-full flex flex-col bg-gray-50 rounded-2xl p-8 overflow-hidden" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        {showCreateTicketForm ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div>
                <h3 className="text-lg font-light text-gray-900">Create Support Ticket</h3>
                <p className="text-xs text-gray-600 mt-1">Fill out the form below to submit a support request</p>
              </div>
              <button
                onClick={() => setShowCreateTicketForm(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:text-gray-900 bg-white/80 border border-gray-300 rounded-xl hover:bg-white transition-all font-light"
              >
                <ArrowLeft size={14} />
                Back
              </button>
            </div>

            <div className="flex-1 min-h-0">
              <CreateTicketForm 
                user={user}
                onTicketCreated={() => {
                  setShowCreateTicketForm(false);
                  if (user) loadTickets();
                }}
                onCancel={() => setShowCreateTicketForm(false)}
              />
            </div>
          </div>
        ) : selectedTicket ? (
          <div className="space-y-4">
            <button
              onClick={() => setSelectedTicket(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 bg-gray-100 border border-gray-300 rounded-2xl hover:bg-gray-50 transition-all"
            >
              <ArrowLeft size={16} />
              Back to Tickets
            </button>

            <div className="bg-gray-100 rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{getTicketTypeIcon(selectedTicket.ticket_data)}</div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{selectedTicket.subject}</h3>
                    <p className="text-sm text-gray-600">Ticket #{selectedTicket.id.slice(0, 8)}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 font-medium text-gray-900">{formatDate(selectedTicket.created_at)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Priority:</span>
                  <span className="ml-2 font-medium text-gray-900 capitalize">{selectedTicket.priority || 'Normal'}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">Conversation</h4>
              </div>
              
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {isLoadingMessages ? (
                  <div className="text-center py-8">
                    <RefreshCw className="animate-spin h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Loading messages...</p>
                  </div>
                ) : ticketMessages.length > 0 ? (
                  ticketMessages.map((message, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        message.author_email === user?.email ? 'bg-blue-600' : 'bg-gray-600'
                      }`}>
                        {message.author_name?.charAt(0)?.toUpperCase() || 'A'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {message.author_name || 'Support Agent'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle size={32} className="text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No messages yet</p>
                    <p className="text-xs text-gray-500 mt-1">Our support team will respond soon</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 space-y-6">
            {/* Title Section */}
            <div className="flex-shrink-0">
              <h2 className="text-3xl font-light text-gray-900 mb-1">Support Tickets</h2>
              <p className="text-sm text-gray-600 font-light">Track and manage all your support requests</p>
            </div>

            {/* Main Stats Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-gray-300 rounded-3xl p-8 flex-shrink-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-gray-600 mb-3 font-medium">Total Tickets</p>
                  <p className="text-5xl font-light text-gray-900 mb-2">{ticketStats.total}</p>
                  <div className="h-px w-8 bg-gray-300" />
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-gray-600 mb-3 font-medium">Open</p>
                  <p className="text-5xl font-light text-gray-900 mb-2">{ticketStats.open}</p>
                  <div className="h-px w-8 bg-gray-300" />
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-gray-600 mb-3 font-medium">Resolved</p>
                  <p className="text-5xl font-light text-gray-900 mb-2">{ticketStats.closed}</p>
                  <div className="h-px w-8 bg-gray-300" />
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-gray-600 mb-3 font-medium">This Week</p>
                  <p className="text-5xl font-light text-gray-900 mb-2">{ticketStats.recent}</p>
                  <div className="h-px w-8 bg-gray-300" />
                </div>
              </div>
            </div>

            {/* Tickets List Section */}
            <div className="flex-1 bg-white/80 backdrop-blur-xl border border-gray-300 rounded-3xl p-8 min-h-0 flex flex-col">
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <p className="text-[10px] tracking-[0.3em] uppercase text-gray-600 font-light">Support Tickets</p>
                <button
                  onClick={handleCreateNewTicket}
                  className="px-6 py-3 rounded-2xl bg-gray-900 text-white transition-all flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-light hover:bg-gray-800"
                  title="New Support Ticket"
                >
                  <Plus size={14} />
                  New Ticket
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-auto">
                {isLoadingTickets ? (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-300">
                    <RefreshCw className="animate-spin h-6 w-6 text-gray-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 font-light">Loading support tickets...</p>
                  </div>
                ) : tickets.length > 0 ? (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="p-6 bg-white/60 hover:bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-300 hover:border-gray-400 transition-all cursor-pointer"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="text-2xl text-gray-700">{getTicketTypeIcon(ticket.ticket_data)}</div>
                            <div className="flex-1">
                              <h4 className="text-sm font-light text-gray-900 mb-2">{ticket.subject}</h4>
                              <p className="text-xs text-gray-600 font-light line-clamp-2 mb-3">{ticket.description}</p>
                              <div className="flex items-center gap-4 text-[10px] text-gray-500">
                                <span>#{ticket.id.slice(0, 8)}</span>
                                <span>{formatDate(ticket.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-light border ${getStatusColor(ticket.status)}`}>
                              {ticket.status}
                            </span>
                            <ChevronRight size={14} className="text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-300">
                    <MessageCircle size={40} className="text-gray-400 mx-auto mb-4" />
                    <h3 className="text-sm font-light text-gray-900 mb-2">No Support Tickets</h3>
                    <p className="text-xs text-gray-600 font-light">You haven't created any support tickets yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Wallet & NFTs Tab
  const renderWalletNFTs = () => (
    <div className="p-8 space-y-6">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Wallet & NFTs</h2>
        <p className="text-sm text-gray-600">Manage your wallet and NFT collection</p>
      </div>
    </div>
  );

  // Render KYC Verification Tab
  const renderKYCVerification = () => (
    <div className="p-8 space-y-6">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">KYC Verification</h2>
        <p className="text-sm text-gray-600">Complete your identity verification</p>
      </div>

      <div className="bg-gray-100/40 rounded-xl p-8 text-center">
        <Shield size={48} className="text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Identity Verification</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Please complete your KYC verification to unlock all features
        </p>
        <button className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
          Start Verification
        </button>
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

  // Render Messages/Notifications Tab
  const renderMessages = () => {
    // Sample notifications data
    const messages = [
      {
        id: 1,
        type: 'booking',
        title: 'Booking Confirmed',
        message: 'Your booking for Gulfstream G650 has been confirmed',
        timestamp: '2 hours ago',
        read: false,
        priority: 'high'
      },
      {
        id: 2,
        type: 'transaction',
        title: 'Payment Received',
        message: 'Payment of $15,000 has been processed successfully',
        timestamp: '5 hours ago',
        read: false,
        priority: 'medium'
      },
      {
        id: 3,
        type: 'system',
        title: 'KYC Verification Pending',
        message: 'Please complete your KYC verification to unlock all features',
        timestamp: '1 day ago',
        read: true,
        priority: 'high'
      },
      {
        id: 4,
        type: 'offer',
        title: 'New Empty Leg Available',
        message: 'Zurich to London - Save 40% on this empty leg flight',
        timestamp: '2 days ago',
        read: true,
        priority: 'low'
      },
      {
        id: 5,
        type: 'booking',
        title: 'Upcoming Flight Reminder',
        message: 'Your flight to Monaco is in 3 days',
        timestamp: '3 days ago',
        read: true,
        priority: 'medium'
      }
    ];

    const filteredMessages = messageFilter === 'all'
      ? messages
      : messageFilter === 'unread'
      ? messages.filter(m => !m.read)
      : messages.filter(m => m.type === messageFilter);

    const unreadCount = messages.filter(m => !m.read).length;

    return (
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-medium text-gray-800 mb-1">Notifications</h1>
            <p className="text-gray-600 text-xs">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All notifications read'}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-300/50 pb-2">
          <button
            onClick={() => setMessageFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              messageFilter === 'all'
                ? 'bg-gray-200/60 text-gray-900'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/40'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setMessageFilter('unread')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              messageFilter === 'unread'
                ? 'bg-gray-200/60 text-gray-900'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/40'
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            onClick={() => setMessageFilter('booking')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              messageFilter === 'booking'
                ? 'bg-gray-200/60 text-gray-900'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/40'
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setMessageFilter('transaction')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              messageFilter === 'transaction'
                ? 'bg-gray-200/60 text-gray-900'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/40'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setMessageFilter('offer')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              messageFilter === 'offer'
                ? 'bg-gray-200/60 text-gray-900'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/40'
            }`}
          >
            Offers
          </button>
          <button
            onClick={() => setMessageFilter('system')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              messageFilter === 'system'
                ? 'bg-gray-200/60 text-gray-900'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/40'
            }`}
          >
            System
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12 bg-gray-100/40 rounded-xl">
              <History size={40} className="text-gray-400 mx-auto mb-3" />
              <p className="text-base text-gray-700 mb-1">No notifications</p>
              <p className="text-xs text-gray-600">Your notifications will appear here</p>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-xl transition-all cursor-pointer border ${
                  !msg.read
                    ? 'bg-blue-50/30 border-blue-200/40 hover:bg-blue-50/40'
                    : 'bg-gray-100/40 border-gray-200/30 hover:bg-gray-100/60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`mt-1 p-2 rounded-lg ${
                      msg.type === 'booking' ? 'bg-blue-100 text-blue-600' :
                      msg.type === 'transaction' ? 'bg-green-100 text-green-600' :
                      msg.type === 'offer' ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {msg.type === 'booking' && <Calendar size={16} />}
                      {msg.type === 'transaction' && <Award size={16} />}
                      {msg.type === 'offer' && <Sparkles size={16} />}
                      {msg.type === 'system' && <Bell size={16} />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">{msg.title}</h3>
                        {!msg.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        {msg.priority === 'high' && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded-full">
                            HIGH PRIORITY
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 mb-2 leading-relaxed">{msg.message}</p>
                      <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!msg.read && (
                      <button className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">
                        Mark read
                      </button>
                    )}
                    <button className="text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mark all as read button */}
        {unreadCount > 0 && filteredMessages.length > 0 && (
          <div className="flex justify-center pt-4">
            <button className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-200/60 hover:bg-gray-200/80 rounded-lg transition-all">
              Mark all as read
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render Transactions Tab
  const renderTransactions = () => {
    const swapTransactions = walletAddress ? TransactionService.getTransactions(walletAddress) : [];
    const hasBlockchainTxs = blockchainTransactions.length > 0;
    const hasSwapTxs = swapTransactions.length > 0;
    const hasSomeTxs = hasBlockchainTxs || hasSwapTxs;

    return (
      <div className="p-8 space-y-6">
        {/* Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Transactions</h2>
          <p className="text-sm text-gray-600">
            {walletAddress
              ? 'All your wallet and swap transactions in one place'
              : 'Connect your wallet to view transaction history'}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLoadingBlockchainTxs && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RefreshCw className="animate-spin" size={14} />
                Loading blockchain transactions...
              </div>
            )}
          </div>
          {hasSwapTxs && (
            <button
              onClick={() => {
                if (walletAddress && confirm('Are you sure you want to clear all swap transaction history?')) {
                  TransactionService.clearTransactions(walletAddress);
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:border-red-300 transition-colors"
            >
              <Trash2 size={16} />
              Clear Swap History
            </button>
          )}
        </div>

        {!walletAddress ? (
          <div className="bg-gray-100/40 rounded-xl p-8 text-center">
            <Wallet size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Connect your wallet to view your transaction history from the blockchain
            </p>
          </div>
        ) : !hasSomeTxs && !isLoadingBlockchainTxs ? (
          <div className="bg-gray-100/40 rounded-xl p-8 text-center">
            <History size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Your transactions will appear here once you start using your wallet
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Launchpad Transactions Section */}
            <LaunchpadTransactions showHeader={true} />

            {/* Blockchain Transactions Section */}
            {hasBlockchainTxs && (
              <div className="bg-gray-50/60 rounded-xl border border-gray-200/40 overflow-hidden">
                <div className="px-6 py-4 bg-gray-100/60 border-b border-gray-200/30">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Wallet Transactions ({blockchainTransactions.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100/40 border-b border-gray-200/20">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From/To</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {blockchainTransactions.map((tx) => (
                        <tr key={tx.hash} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(tx.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(tx.timestamp).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tx.type === 'receive' ? 'bg-green-100 text-green-800' :
                              tx.type === 'send' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {tx.type === 'receive' && '📥'}
                              {tx.type === 'send' && '📤'}
                              {tx.type === 'contract' && '📜'}
                              {' '}{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-mono text-gray-900">
                              {tx.type === 'send' && tx.to ? (
                                <>To: {tx.to.slice(0, 6)}...{tx.to.slice(-4)}</>
                              ) : (
                                <>From: {tx.from.slice(0, 6)}...{tx.from.slice(-4)}</>
                              )}
                            </div>
                            {tx.tokenTransfers && tx.tokenTransfers.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Token: {tx.tokenTransfers[0].tokenSymbol}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {tx.tokenTransfers && tx.tokenTransfers.length > 0 ? (
                              <div className="text-sm text-gray-900">
                                {tx.tokenTransfers[0].valueFormatted}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-900">
                                {parseFloat(tx.valueInEth).toFixed(6)} ETH
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tx.status === 'success' ? 'bg-green-100 text-green-800' :
                              tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {tx.status === 'success' && <CheckCircle size={12} className="mr-1" />}
                              {tx.status === 'failed' && <AlertCircle size={12} className="mr-1" />}
                              {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a
                              href={tx.etherscanUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                            >
                              <code className="font-mono text-xs">
                                {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                              </code>
                              <ExternalLink size={12} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Swap Transactions Section */}
            {hasSwapTxs && (
              <div className="bg-gray-50/60 rounded-xl border border-gray-200/40 overflow-hidden">
                <div className="px-6 py-4 bg-gray-100/60 border-b border-gray-200/30">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Swap Transactions ({swapTransactions.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100/40 border-b border-gray-200/20">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Swap</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {swapTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(tx.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(tx.timestamp).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{tx.sellToken}</span>
                              <ArrowRight size={14} className="text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">{tx.buyToken}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{tx.sellAmount} {tx.sellToken}</div>
                            <div className="text-xs text-gray-500">→ {tx.buyAmount} {tx.buyToken}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tx.status === 'success' ? 'bg-green-100 text-green-800' :
                              tx.status === 'confirming' ? 'bg-yellow-100 text-yellow-800' :
                              tx.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {tx.status === 'success' && <CheckCircle size={12} className="mr-1" />}
                              {tx.status === 'confirming' && <Loader2 size={12} className="mr-1 animate-spin" />}
                              {tx.status === 'failed' && <AlertCircle size={12} className="mr-1" />}
                              {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a
                              href={tx.etherscanUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                            >
                              <code className="font-mono text-xs">
                                {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                              </code>
                              <ExternalLink size={12} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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


  return (
    <div className="w-full h-screen overflow-hidden flex flex-col">
      {/* Compact Header with Icons */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
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
        {showCardGrid ? (
          <main className="flex-1 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Greeting Section */}
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold text-gray-900">
                  Good evening, {user?.first_name || user?.name || 'Guest'}
                </h1>
                <p className="text-lg text-gray-600">How can I help you?</p>
              </div>

              {/* Menu Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id);
                        setShowCardGrid(false);
                      }}
                      className="group relative bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100 hover:border-gray-200 text-left"
                    >
                      {/* Icon */}
                      <div className="w-16 h-16 bg-gray-100 group-hover:bg-gray-200 rounded-xl flex items-center justify-center mb-6 transition-colors">
                        <Icon size={28} className="text-gray-700" />
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {item.label}
                      </h3>

                      {/* Badge */}
                      {item.badge !== undefined && item.badge > 0 && (
                        <div className="absolute top-6 right-6">
                          <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                            {item.badge}
                          </span>
                        </div>
                      )}

                      {/* Arrow indicator on hover */}
                      <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        <ChevronRight size={20} className="text-gray-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </main>
        ) : (
          <>
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

                {/* User Profile Section */}
                <div className={`pt-2 mt-auto border-t border-gray-800 ${sidebarCollapsed ? 'px-0' : ''}`}>
                  <button
                    onClick={() => setCurrentView('referrals')}
                    title={sidebarCollapsed ? user?.name || 'Profile' : ''}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors mb-1 ${
                      sidebarCollapsed ? 'justify-center' : ''
                    } ${currentView === 'referrals' ? 'bg-white/10 text-white' : ''}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                    {!sidebarCollapsed && (
                      <div className="flex-1 text-left">
                        <div className="text-xs font-medium text-white">{user?.name || user?.email?.split('@')[0] || 'User'}</div>
                        <div className="text-[10px] text-gray-400">Referrals</div>
                      </div>
                    )}
                    {!sidebarCollapsed && <ChevronRight size={12} className="text-gray-500" />}
                  </button>
                  
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
            <main className="flex-1 min-h-0 max-h-full">
              {currentView === 'overview' && renderOverview()}
              {currentView === 'requests' && renderRequests()}
              {currentView === 'messages' && renderMessages()}
              {/* Web 3.0 only views */}
              {isWeb3Mode && currentView === 'transactions' && renderTransactions()}
              {isWeb3Mode && currentView === 'tokenized-assets' && renderTokenizedAssets()}
              {isWeb3Mode && currentView === 'wallet' && renderWalletNFTs()}
              {/* Common views */}
              {currentView === 'co2-certificates' && renderCO2Certificates()}
              {currentView === 'chat-support' && renderChatSupport()}
              {currentView === 'kyc' && renderKYCVerification()}

              {currentView === 'profiles' && (
                <div>
                  <ProfileSettings />
                </div>
              )}

              {currentView === 'referrals' && (
                <div className="max-h-full overflow-y-auto">
                  <ReferralPage />
                </div>
              )}
            </main>
          </>
        )}
      </div>

      {/* Request Details Modal */}
      {showRequestDetails && selectedRequest && currentView !== 'requests' && (
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
