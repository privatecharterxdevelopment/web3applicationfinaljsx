import React, { useRef, useEffect, useState } from 'react';
import { Camera, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { registerFaceWithAWS, verifyFaceWithAWS } from '../../services/awsFaceService';

interface FaceCaptureCameraProps {
  onFaceDetected: (userId?: string) => void;
  onError?: (error: string) => void;
  userName?: string;
  userId?: string; // For registration
  mode: 'register' | 'verify';
  manualCapture?: boolean; // Show manual capture button
}

export default function FaceCaptureCamera({
  onFaceDetected,
  onError,
  userName,
  userId,
  mode,
  manualCapture = true
}: FaceCaptureCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [faceDetectionStatus, setFaceDetectionStatus] = useState<'none' | 'detecting' | 'found' | 'error'>('none');
  const [detectionMessage, setDetectionMessage] = useState('Position your face in center and click capture');
  const [initializationFailed, setInitializationFailed] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    startCamera();

    return () => {
      // Cleanup camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Wait for video to be ready
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              setIsCameraReady(true);
              resolve(true);
            };
          }
        });
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setInitializationFailed(true);
      setDetectionMessage('Camera access denied or not available');
      if (onError) onError('Camera access denied or not available');
    }
  };

  const handleManualCapture = async () => {
    if (!videoRef.current || !isCameraReady || isCapturing) {
      return;
    }

    setIsCapturing(true);
    setFaceDetectionStatus('detecting');
    setDetectionMessage('Capturing and analyzing face...');

    try {
      if (mode === 'register') {
        // Register face with AWS Rekognition
        if (!userId) {
          throw new Error('User ID is required for registration');
        }

        const result = await registerFaceWithAWS(userId, videoRef.current);

        if (result.success) {
          setFaceDetectionStatus('found');
          setDetectionMessage('Face registered successfully!');
          onFaceDetected();
        } else {
          setFaceDetectionStatus('error');
          setDetectionMessage(result.error || 'Failed to register face');
          if (onError) onError(result.error || 'Failed to register face');
        }
      } else {
        // Verify face with AWS Rekognition
        const result = await verifyFaceWithAWS(videoRef.current);

        if (result.success && result.userId) {
          setFaceDetectionStatus('found');
          setDetectionMessage(`Face verified! Confidence: ${result.confidence?.toFixed(1)}%`);
          onFaceDetected(result.userId);
        } else {
          setFaceDetectionStatus('error');
          setDetectionMessage(result.error || 'Face not recognized');
          if (onError) onError(result.error || 'Face not recognized');
        }
      }
    } catch (error: any) {
      console.error('Face capture error:', error);
      setFaceDetectionStatus('error');
      setDetectionMessage('Failed to capture face. Please try again.');
      if (onError) onError(error.message);
    } finally {
      setIsCapturing(false);
    }
  };

  const StatusIcon = () => {
    switch (faceDetectionStatus) {
      case 'found':
        return <CheckCircle size={24} className="text-emerald-500" />;
      case 'error':
        return <XCircle size={24} className="text-red-500" />;
      case 'detecting':
        return <Loader2 size={24} className="animate-spin text-blue-500" />;
      default:
        return <Camera size={24} className="text-gray-400" />;
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-900 flex items-center justify-center overflow-hidden">
      {/* Video Stream */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        playsInline
      />

      {/* Minimal Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

      {/* Face Guide Circle */}
      {isCameraReady && !initializationFailed && faceDetectionStatus === 'none' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className="w-64 h-80 border-4 border-white/50 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-56 h-72 border-2 border-dashed border-white/30 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Top Status Badge - Minimal Design */}
      {isCameraReady && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2 border border-gray-200">
          <StatusIcon />
          <span className="font-medium text-gray-900 text-xs">
            {faceDetectionStatus === 'found' ? 'Done!' : faceDetectionStatus === 'detecting' ? 'Processing...' : 'Ready'}
          </span>
        </div>
      )}

      {/* Bottom Success Message - Minimal Design */}
      {faceDetectionStatus === 'found' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-emerald-500/95 backdrop-blur-md px-6 py-4 rounded-lg shadow-lg border border-emerald-600 z-20">
          <div className="flex items-center gap-3">
            <CheckCircle size={28} className="text-white" />
            <div className="text-left">
              <div className="text-base font-semibold text-white">
                Face Captured Successfully!
              </div>
              <div className="text-xs text-emerald-50">Processing your face data...</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message - Minimal Design */}
      {faceDetectionStatus === 'error' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md p-4 rounded-lg shadow-lg border border-red-200 text-center max-w-sm">
          <XCircle size={20} className="mx-auto mb-2 text-red-500" />
          <p className="font-medium text-gray-900 text-sm">Face Detection Error</p>
          <p className="text-xs text-gray-600 mt-1">{detectionMessage}</p>
        </div>
      )}

      {/* Loading Overlay - Minimal Design */}
      {!isCameraReady && !initializationFailed && (
        <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="text-center bg-white/95 backdrop-blur-md p-8 rounded-xl shadow-lg border border-gray-200 max-w-sm">
            <Loader2 size={40} className="animate-spin mx-auto mb-4 text-gray-700" />
            <p className="text-base font-semibold text-gray-900">Initializing camera...</p>
            <p className="text-sm text-gray-600 mt-2">{detectionMessage}</p>
            <p className="text-xs text-gray-500 mt-3">This may take a few moments...</p>
          </div>
        </div>
      )}

      {/* Initialization Failed Overlay - Minimal Design */}
      {initializationFailed && (
        <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="text-center bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 max-w-md p-8">
            <XCircle size={48} className="mx-auto mb-4 text-red-500" />
            <p className="text-lg font-semibold text-gray-900 mb-2">Unable to Access Camera</p>
            <p className="text-sm text-gray-600 mb-4">{detectionMessage}</p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600">
                Please use the "Skip for Now" button to proceed without Face ID.
                You can set this up later in your account settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Capture Button */}
      {manualCapture && isCameraReady && !initializationFailed && faceDetectionStatus !== 'found' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3">
          {/* Instructions */}
          <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg">
            <p className="text-white text-sm font-medium">Position your face in the center, then click capture</p>
          </div>

          {/* Capture Button */}
          <button
            onClick={handleManualCapture}
            disabled={isCapturing}
            className="bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 px-10 rounded-xl shadow-2xl border-3 border-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-lg"
          >
            {isCapturing ? (
              <>
                <Loader2 size={28} className="animate-spin" />
                <span>Capturing...</span>
              </>
            ) : (
              <>
                <Camera size={28} />
                <span>Capture My Face</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
