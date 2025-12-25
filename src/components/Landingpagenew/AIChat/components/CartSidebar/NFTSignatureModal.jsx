// NFTSignatureModal - Modal for NFT holder wallet signature before request submission
import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, Sparkles, PenTool } from 'lucide-react';

// PrivateCharterX logo
const PCX_LOGO = 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/PrivatecharterX_logo_vectorized.glb.png';

const NFTSignatureModal = ({
  isOpen,
  onClose,
  onSign,
  onSuccess,
  isSigningInProgress,
  signatureStatus, // 'idle' | 'signing' | 'success' | 'error'
  signatureError,
  walletAddress,
  cartTotal,
  itemCount
}) => {
  const [animationStep, setAnimationStep] = useState(0);

  // Animate steps during signing
  useEffect(() => {
    if (signatureStatus === 'signing') {
      const interval = setInterval(() => {
        setAnimationStep(prev => (prev + 1) % 3);
      }, 800);
      return () => clearInterval(interval);
    } else if (signatureStatus === 'success') {
      setAnimationStep(3);
    } else {
      setAnimationStep(0);
    }
  }, [signatureStatus]);

  if (!isOpen) return null;

  const signingMessages = [
    'Preparing signature request...',
    'Waiting for wallet confirmation...',
    'Please sign in your wallet...'
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-gray-100"
        style={{ backdropFilter: 'blur(20px)' }}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center overflow-hidden">
                <img src={PCX_LOGO} alt="PrivateCharterX" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  NFT Member Verification
                </h3>
                <p className="text-xs text-gray-500">Sign to redeem your benefits</p>
              </div>
            </div>
            {signatureStatus !== 'signing' && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Idle State - Ready to Sign */}
          {signatureStatus === 'idle' && (
            <div className="text-center space-y-6">
              {/* NFT Badge Animation */}
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <img src={PCX_LOGO} alt="PrivateCharterX" className="w-14 h-14 object-contain" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                  <CheckCircle size={12} className="text-white" />
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Verify NFT Ownership
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  As an NFT member, please sign a message with your wallet to verify ownership and redeem your exclusive benefits for this request.
                </p>
              </div>

              {/* Request Summary */}
              <div className="bg-gray-50 rounded-xl p-4 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Items</span>
                  <span className="font-medium text-gray-900">{itemCount} item(s)</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-500">Total Value</span>
                  <span className="font-medium text-gray-900">
                    ${cartTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                  <span className="text-gray-500">Wallet</span>
                  <span className="font-mono text-xs text-gray-700">
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </span>
                </div>
              </div>

              {/* Sign Button */}
              <button
                onClick={onSign}
                className="w-full px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <PenTool size={16} />
                Sign with Wallet
              </button>

              <p className="text-xs text-gray-400">
                This signature is free and does not initiate any transaction
              </p>
            </div>
          )}

          {/* Signing State - Waiting for Wallet */}
          {signatureStatus === 'signing' && (
            <div className="text-center space-y-6 py-4">
              {/* Loading Animation */}
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl" />
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <img src={PCX_LOGO} alt="PrivateCharterX" className="w-14 h-14 object-contain animate-pulse" />
                </div>
                {/* Spinning ring */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-green-500 animate-spin" style={{ animationDuration: '1.5s' }} />
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Waiting for Signature
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {signingMessages[animationStep]}
                </p>
              </div>

              {/* Step Indicators */}
              <div className="flex items-center justify-center gap-2">
                {[0, 1, 2].map((step) => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      animationStep >= step ? 'bg-gray-900 scale-110' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 text-left">
                    Please check your wallet app or browser extension for the signature request.
                    Do not close this window.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Success State */}
          {signatureStatus === 'success' && (
            <div className="text-center space-y-6 py-4">
              {/* Success Animation */}
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl animate-bounce-gentle" />
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <img src={PCX_LOGO} alt="PrivateCharterX" className="w-14 h-14 object-contain" />
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center border-2 border-green-500 shadow-lg">
                  <CheckCircle size={16} className="text-green-500" />
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Signature Verified!
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Your NFT membership has been verified. Submitting your request with exclusive benefits applied...
                </p>
              </div>

              {/* Benefits Applied */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                  <Sparkles size={16} />
                  <span>NFT Member Benefits Applied</span>
                </div>
              </div>

              <Loader2 size={20} className="animate-spin text-gray-400 mx-auto" />
            </div>
          )}

          {/* Error State */}
          {signatureStatus === 'error' && (
            <div className="text-center space-y-6 py-4">
              {/* Error Icon */}
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <X size={40} className="text-white" />
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Signature Failed
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {signatureError || 'The signature was rejected or failed. Please try again.'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={onSign}
                  className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <PenTool size={14} />
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <p className="text-[10px] text-gray-400 text-center">
            Signature data is stored securely and linked to your request for verification
          </p>
        </div>
      </div>

      {/* Custom animation styles */}
      <style>{`
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NFTSignatureModal;
