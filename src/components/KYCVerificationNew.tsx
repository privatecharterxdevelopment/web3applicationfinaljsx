import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, Check, AlertTriangle, FileText, User, Calendar, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../../thefinalwebapplicationpcx-main/src/context/AuthContext';

interface KYCVerificationProps {
  onBack: () => void;
  onComplete: () => void;
}

export default function KYCVerification({ onBack, onComplete }: KYCVerificationProps) {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState<'not_started' | 'submitted' | 'verified' | 'rejected'>('not_started');
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check KYC status on mount
  React.useEffect(() => {
    const checkKycStatus = async () => {
      if (!user?.id) return;

      try {
        const { data: kycDoc, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .eq('document_type', 'kyc_form')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && kycDoc) {
          console.log('📋 KYC Status:', kycDoc);
          setKycStatus(kycDoc.status === 'verified' ? 'verified' : 'submitted');
          if (kycDoc.verification_notes) {
            try {
              setSubmittedData(JSON.parse(kycDoc.verification_notes));
            } catch (e) {
              console.error('Error parsing KYC data:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error checking KYC status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkKycStatus();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading KYC status...</p>
        </div>
      </div>
    );
  }

  // If KYC is submitted or verified, show status view
  if (kycStatus === 'submitted' || kycStatus === 'verified') {
    return (
      <div className="w-full h-full overflow-y-auto p-6">
        {/* Header Section - Similar to Jets/Empty Legs */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={onBack}
                  className="w-8 h-8 border border-gray-300 bg-white rounded flex items-center justify-center text-sm hover:bg-gray-50"
                >
                  ←
                </button>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">KYC VERIFICATION</span>
                    <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-medium">
                      <CheckCircle2 size={14} />
                      <span>{kycStatus === 'verified' ? 'VERIFIED' : 'SUBMITTED'}</span>
                    </div>
                  </div>
                  <h1 className="text-2xl font-semibold text-gray-900">Identity Verification</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Your KYC submission has been {kycStatus === 'verified' ? 'verified' : 'received and is under review'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="bg-white/35 rounded-lg border border-gray-300/50 p-6 mb-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
            <h3 className="text-sm font-semibold text-black mb-4">Verification Status</h3>
            
            <div className="space-y-4">
              {kycStatus === 'verified' ? (
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Verification Complete</h4>
                    <p className="text-green-800 text-sm mt-1">
                      Your identity has been successfully verified. You have full access to all platform features.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <AlertTriangle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Under Review</h4>
                    <p className="text-blue-800 text-sm mt-1">
                      Your KYC submission is currently being reviewed by our compliance team. This process typically takes 1-2 business days.
                    </p>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Verification Timeline</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Documents Submitted</p>
                      <p className="text-xs text-gray-500">All required documents received</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      kycStatus === 'verified' ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {kycStatus === 'verified' && <Check size={14} className="text-white" />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${kycStatus === 'verified' ? 'text-gray-900' : 'text-gray-500'}`}>
                        {kycStatus === 'verified' ? 'Verification Complete' : 'Under Review'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {kycStatus === 'verified' ? 'Identity verified successfully' : 'Compliance team reviewing your documents'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submitted Information */}
          {submittedData && (
            <div className="bg-white/35 rounded-lg border border-gray-300/50 p-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
              <h3 className="text-sm font-semibold text-black mb-4">Submitted Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {submittedData.firstName} {submittedData.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Nationality</p>
                  <p className="text-sm font-medium text-gray-900">{submittedData.nationality || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                  <p className="text-sm font-medium text-gray-900">{submittedData.dateOfBirth || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Passport Number</p>
                  <p className="text-sm font-medium text-gray-900">{submittedData.passportNumber || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Address</p>
                  <p className="text-sm font-medium text-gray-900">
                    {submittedData.address}, {submittedData.city}, {submittedData.country} {submittedData.postalCode}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If not submitted, show form (you can keep the existing form here or create a new one)
  return (
    <div className="w-full h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-300 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="w-8 h-8 border border-gray-300 bg-white rounded flex items-center justify-center text-sm hover:bg-gray-50"
            >
              ←
            </button>
            <div>
              <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">KYC VERIFICATION</span>
              <h1 className="text-2xl font-semibold text-gray-900 mt-2">Complete Your Verification</h1>
              <p className="text-sm text-gray-600 mt-1">Required for all users to access platform features</p>
            </div>
          </div>
        </div>

        <div className="bg-white/35 rounded-lg border border-gray-300/50 p-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <AlertTriangle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Verification Required</h4>
              <p className="text-blue-800 text-sm mt-1">
                You need to complete KYC verification to access all platform features. Please provide your identity documents and personal information.
              </p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-4">Contact support to initiate the verification process</p>
            <button
              onClick={onBack}
              className="bg-black text-white px-6 py-2 rounded text-sm hover:bg-gray-800"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
