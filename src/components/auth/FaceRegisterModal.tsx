import React, { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Portal from '../Portal';
import FaceCaptureCamera from './FaceCaptureCamera';
import { supabase } from '../../lib/supabase';

interface FaceRegisterModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
  onSkip?: () => void;
}

export default function FaceRegisterModal({
  userId,
  userName,
  onClose,
  onSuccess,
  onSkip
}: FaceRegisterModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleFaceDetected = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('✅ Face registered with AWS Rekognition for user:', userId);

      // Update user_profiles to mark face registration complete
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          face_registration_completed: true,
          face_login_enabled: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (profileError) {
        throw profileError;
      }

      console.log('✅ User profile updated successfully');
      setShowSuccess(true);

      // Show success for 2 seconds, then close
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error('❌ Error updating user profile:', err);
      setError(err.message || 'Failed to save face registration. Please try again.');
      setIsProcessing(false);
    }
  };

  if (showSuccess) {
    return (
      <Portal>
        <div className="fixed inset-0 bg-gray-100 z-[9999] flex items-center justify-center p-6">
          <div className="w-full h-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden flex">

            {/* LEFT SIDEBAR: Success Message */}
            <div className="w-2/5 bg-white p-8 flex flex-col items-center justify-center">
              <CheckCircle size={64} className="text-emerald-500 mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Face Registered!</h1>
              <p className="text-gray-600 text-center mb-6">
                Your face has been securely registered. You can now use Face Login.
              </p>
              <div className="text-sm text-gray-500">
                Redirecting...
              </div>
            </div>

            {/* RIGHT SIDE: Success Animation */}
            <div className="w-3/5 bg-gradient-to-br from-emerald-400 to-emerald-600 relative overflow-hidden flex items-center justify-center">
              <CheckCircle size={200} className="text-white opacity-20" />
            </div>

          </div>
        </div>
      </Portal>
    );
  }

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
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <div className="w-2 h-2 bg-black rounded-full" />
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="mt-16 mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Biometric Verification
              </h1>
              <p className="text-sm text-gray-600">
                Place your face directly into the camera, and we'll scan it.
              </p>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 mb-8 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {userName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{userName}</span>
                  <CheckCircle size={16} className="text-blue-500" />
                </div>
                <span className="text-sm text-gray-500">Registering Face ID</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="flex-1 space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Tips for best results:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Ensure good lighting</li>
                  <li>• Remove glasses if possible</li>
                  <li>• Face the camera directly</li>
                  <li>• Keep a neutral expression</li>
                </ul>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {isProcessing && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm text-emerald-800 font-medium">
                    Processing and encrypting face data...
                  </p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="mt-8 space-y-3">
              {onSkip && (
                <button
                  onClick={onSkip}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 font-medium"
                >
                  Skip for now
                </button>
              )}

              <div className="flex justify-between items-center text-xs text-gray-500">
                <button onClick={() => window.open('/support', '_blank')}>
                  Contact support
                </button>
                <span>© PrivateCharterX 2025</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Camera View */}
          <div className="w-3/5 relative">
            <FaceCaptureCamera
              onFaceDetected={handleFaceDetected}
              onError={(err) => setError(err)}
              userName={userName}
              userId={userId}
              mode="register"
              manualCapture={true}
            />
          </div>

        </div>
      </div>
    </Portal>
  );
}
