import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import Portal from '../Portal';
import FaceCaptureCamera from './FaceCaptureCamera';
import { verifyFaceForUser } from '../../services/faceAuthService';

interface FaceLoginModalProps {
  userId: string;
  userName?: string;
  userAvatar?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FaceLoginModal({
  userId,
  userName,
  userAvatar,
  onClose,
  onSuccess
}: FaceLoginModalProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'pending' | 'success' | 'failed'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [similarity, setSimilarity] = useState<number>(0);

  const handleFaceDetected = async (descriptor: Float32Array) => {
    setIsVerifying(true);
    setError(null);

    try {
      console.log('🔍 Verifying face for user:', userId);

      const result = await verifyFaceForUser(userId, descriptor);

      if (result.success) {
        console.log('✅ Face verified successfully');
        setVerificationResult('success');
        setSimilarity(result.similarity || 1);

        // Show success for 2 seconds, then proceed
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        console.log('❌ Face verification failed');
        setVerificationResult('failed');
        setSimilarity(result.similarity || 0);
        setError(result.error || 'Face does not match. Please try again.');

        // Reset after 3 seconds
        setTimeout(() => {
          setVerificationResult('pending');
          setIsVerifying(false);
        }, 3000);
      }
    } catch (err: any) {
      console.error('❌ Error verifying face:', err);
      setVerificationResult('failed');
      setError(err.message || 'Verification failed. Please try again.');
      setIsVerifying(false);
    }
  };

  // Success Screen
  if (verificationResult === 'success') {
    return (
      <Portal>
        <div className="fixed inset-0 bg-gray-100 z-[9999] flex items-center justify-center p-6">
          <div className="w-full h-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden flex">

            {/* LEFT SIDEBAR: Success Message */}
            <div className="w-2/5 bg-white p-8 flex flex-col items-center justify-center">
              {/* User Avatar/Initial */}
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-4xl mb-6 relative">
                {userAvatar ? (
                  <img src={userAvatar} alt={userName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  userName?.charAt(0).toUpperCase() || 'U'
                )}
                {/* Black OK Badge */}
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-black rounded-full flex items-center justify-center">
                  <CheckCircle size={24} className="text-white" fill="white" stroke="black" strokeWidth={2} />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">Verified!</h1>
              <p className="text-gray-600 text-center mb-4">
                Welcome back, {userName || 'User'}!
              </p>
              <div className="text-emerald-600 font-semibold text-lg">
                {Math.round(similarity * 100)}% Match
              </div>
              <div className="text-sm text-gray-500 mt-4">
                Signing you in...
              </div>
            </div>

            {/* RIGHT SIDE: Success Animation */}
            <div className="w-3/5 bg-gradient-to-br from-emerald-400 to-emerald-600 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle size={200} className="text-white opacity-20" />
              </div>
              {/* 100% badge */}
              <div className="absolute top-8 right-8 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
                <span className="font-bold text-gray-900 text-lg">100%</span>
              </div>
            </div>

          </div>
        </div>
      </Portal>
    );
  }

  // Failed Screen
  if (verificationResult === 'failed') {
    return (
      <Portal>
        <div className="fixed inset-0 bg-gray-100 z-[9999] flex items-center justify-center p-6">
          <div className="w-full h-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden flex">

            {/* LEFT SIDEBAR: Error Message */}
            <div className="w-2/5 bg-white p-8 flex flex-col items-center justify-center">
              <XCircle size={64} className="text-red-500 mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Verification Failed</h1>
              <p className="text-gray-600 text-center mb-4">
                {error || 'Face does not match. Please try again.'}
              </p>
              {similarity > 0 && (
                <div className="text-red-600 font-semibold">
                  {Math.round(similarity * 100)}% Match (60% required)
                </div>
              )}
              <button
                onClick={() => {
                  setVerificationResult('pending');
                  setIsVerifying(false);
                }}
                className="mt-6 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
            </div>

            {/* RIGHT SIDE: Error Visual */}
            <div className="w-3/5 bg-gradient-to-br from-red-400 to-red-600 relative overflow-hidden flex items-center justify-center">
              <XCircle size={200} className="text-white opacity-20" />
            </div>

          </div>
        </div>
      </Portal>
    );
  }

  // Verification Screen
  return (
    <Portal>
      <div className="fixed inset-0 bg-gray-100 z-[9999] flex items-center justify-center p-6">

        {/* Main Split-Screen Container */}
        <div className="w-full h-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden flex">

          {/* LEFT SIDEBAR: Instructions */}
          <div className="w-2/5 bg-white p-8 flex flex-col relative">

            {/* Back Button */}
            <button
              onClick={onClose}
              className="absolute left-6 top-6 p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2 text-gray-600 hover:text-black"
            >
              <ArrowLeft size={20} />
            </button>

            {/* Progress Dots */}
            <div className="absolute right-6 top-6 flex items-center gap-2">
              <div className="w-2 h-2 bg-black rounded-full" />
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="mt-16 mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Biometric Verification
              </h1>
              <p className="text-sm text-gray-600">
                Place your face directly into the camera, and we'll verify your identity.
              </p>
            </div>

            {/* User Info */}
            {userName && (
              <div className="flex items-center gap-3 mb-8 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {userAvatar ? (
                    <img src={userAvatar} alt={userName} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    userName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{userName}</span>
                    <CheckCircle size={16} className="text-blue-500" />
                  </div>
                  <span className="text-sm text-gray-500">Verifying identity...</span>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="flex-1 space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Verification tips:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Look directly at the camera</li>
                  <li>• Ensure good lighting</li>
                  <li>• Remove any face coverings</li>
                  <li>• Stay still during scanning</li>
                </ul>
              </div>

              {isVerifying && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800 font-medium">
                    Comparing face data securely...
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
              <button onClick={() => window.open('/support', '_blank')}>
                Contact support
              </button>
              <span>© PrivateCharterX 2025</span>
            </div>
          </div>

          {/* RIGHT SIDE: Camera View */}
          <div className="w-3/5 relative">
            <FaceCaptureCamera
              onFaceDetected={handleFaceDetected}
              onError={(err) => setError(err)}
              userName={userName}
              mode="verify"
              autoCapture={true}
            />
          </div>

        </div>
      </div>
    </Portal>
  );
}
