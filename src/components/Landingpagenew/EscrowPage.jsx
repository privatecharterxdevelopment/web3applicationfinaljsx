import React from 'react';
import { Shield, Lock, Globe, CheckCircle, Clock } from 'lucide-react';

export default function EscrowPage() {
  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8 pt-6">
          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-700 rounded-full mb-4">
            <Clock className="w-4 h-4 text-white animate-pulse" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">Coming Soon</span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-xl rounded-full border border-gray-300/50 mb-4 ml-2">
            <Shield className="w-3 h-3 text-gray-700" />
            <span className="text-[10px] font-medium text-gray-700 uppercase tracking-wider">Web 3.0</span>
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

          {/* Coming Soon Button - Disabled */}
          <button
            disabled
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-400 text-white text-xs font-medium rounded-lg cursor-not-allowed opacity-75"
          >
            <Shield className="w-3.5 h-3.5" />
            Coming Soon
            <Clock className="w-3 h-3" />
          </button>

          <p className="text-xs text-gray-500 mt-3">
            We're building something amazing. Stay tuned!
          </p>
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
              <Shield className="w-5 h-5 text-gray-700" />
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

        {/* Web3 Coming Soon Info */}
        <div className="mt-6 bg-gradient-to-r from-gray-900/5 to-gray-700/5 backdrop-blur-xl rounded-lg border border-gray-300/30 p-4 text-center">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Web 3.0 Escrow - In Development</h3>
          <p className="text-xs text-gray-600 leading-relaxed max-w-lg mx-auto">
            Our blockchain-based escrow service is being built with security-first architecture.
            Smart contracts, multi-signature wallets, and automated dispute resolution - all coming to private aviation.
          </p>
        </div>
      </div>
    </div>
  );
}
