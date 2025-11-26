import React, { useState } from 'react';
import { Shield, ExternalLink, X, Plane, Lock, Globe, CheckCircle } from 'lucide-react';

export default function EscrowPage() {
  const [showRedirectModal, setShowRedirectModal] = useState(false);

  const handleCreateEscrow = () => {
    setShowRedirectModal(true);
  };

  const handleConfirmRedirect = () => {
    window.open('https://escrow.privatecharterx.com', '_blank');
    setShowRedirectModal(false);
  };

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8 pt-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-xl rounded-full border border-gray-300/50 mb-4">
            <Shield className="w-3 h-3 text-gray-700" />
            <span className="text-[10px] font-medium text-gray-700 uppercase tracking-wider">World's First</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl font-light text-gray-900 mb-3 leading-tight tracking-tight">
            Private Aviation Friendly <span className="text-gray-500">Escrow Service</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-gray-600 mb-1">
            Secured on Blockchain
          </p>
          <p className="text-xs text-gray-500 mb-6">
            by <span className="font-medium text-gray-700">PrivateCharterX</span>
          </p>

          {/* CTA Button */}
          <button
            onClick={handleCreateEscrow}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Shield className="w-3.5 h-3.5" />
            Create Escrow Now
            <ExternalLink className="w-3 h-3 opacity-60" />
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <div className="bg-white/15 backdrop-blur-xl rounded-lg border border-gray-300/50 p-4 text-center">
            <div className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5 text-gray-700" />
            </div>
            <h3 className="text-xs font-medium text-gray-900 mb-1">Secure & Transparent</h3>
            <p className="text-[10px] text-gray-600 leading-relaxed">
              Smart contract secured transactions with full blockchain transparency
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-xl rounded-lg border border-gray-300/50 p-4 text-center">
            <div className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Plane className="w-5 h-5 text-gray-700" />
            </div>
            <h3 className="text-xs font-medium text-gray-900 mb-1">Aviation Specialized</h3>
            <p className="text-[10px] text-gray-600 leading-relaxed">
              Built specifically for private jet charters and aviation transactions
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-xl rounded-lg border border-gray-300/50 p-4 text-center">
            <div className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Globe className="w-5 h-5 text-gray-700" />
            </div>
            <h3 className="text-xs font-medium text-gray-900 mb-1">Global Access</h3>
            <p className="text-[10px] text-gray-600 leading-relaxed">
              Borderless transactions powered by blockchain technology
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="bg-white/10 backdrop-blur-xl rounded-lg border border-gray-300/30 p-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-gray-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span>Smart Contract Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span>Base Network</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span>Dispute Resolution</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span>Multi-Currency Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Redirect Confirmation Modal */}
      {showRedirectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gray-50 border-b border-gray-200 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">External Redirect</h3>
                  <p className="text-[10px] text-gray-500">Leaving PrivateCharterX</p>
                </div>
              </div>
              <button
                onClick={() => setShowRedirectModal(false)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <ExternalLink className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-xs text-gray-700 mb-1">
                  You are leaving this site and opening
                </p>
                <p className="text-sm font-medium text-gray-900 mb-0.5">
                  EscrowX.app
                </p>
                <p className="text-[10px] text-gray-500">
                  by PrivateCharterX
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 mb-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Secure destination</span>
                </div>
                <code className="text-[10px] font-mono text-gray-800 break-all">
                  escrow.privatecharterx.com
                </code>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowRedirectModal(false)}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRedirect}
                  className="flex-1 px-3 py-2 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  Continue
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
