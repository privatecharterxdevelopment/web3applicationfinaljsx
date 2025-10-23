import React from 'react';
import { ExternalLink, Check, Shield, Crown, Sparkles, Zap } from 'lucide-react';

export default function NFTsPage() {
  const nftVideoUrl = "https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivateCharterX_transparent-_3_.mp4";
  const openSeaUrl = "https://opensea.io"; // Replace with actual OpenSea collection URL

  const benefits = [
    { icon: Shield, text: "Up to 50% Discount on Empty Legs" },
    { icon: Crown, text: "Priority Booking Access" },
    { icon: Sparkles, text: "Exclusive Member Events" },
    { icon: Zap, text: "Free Upgrades & Amenities" },
    { icon: Check, text: "VIP Concierge Service" },
    { icon: Check, text: "Access to Private Terminals" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-['DM_Sans'] p-8">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PrivateCharterX NFT Collection</h1>
          <p className="text-gray-600">
            Own a piece of luxury aviation with exclusive benefits and access
          </p>
        </div>

        {/* NFT Card */}
        <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden shadow-lg">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left Side - Animated Video */}
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 flex items-center justify-center">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '40px 40px'
                }} />
              </div>

              {/* Video */}
              <div className="relative z-10 w-full max-w-sm">
                <div className="aspect-square bg-black/20 rounded-xl overflow-hidden backdrop-blur-sm border border-white/20">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  >
                    <source src={nftVideoUrl} type="video/mp4" />
                  </video>
                </div>

                {/* Edition Badge */}
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                  Limited Edition
                </div>
              </div>
            </div>

            {/* Right Side - Benefits & CTA */}
            <div className="p-8">
              <div className="mb-6">
                <div className="inline-block bg-black text-white px-3 py-1 rounded-full text-xs font-semibold mb-4">
                  EXCLUSIVE NFT
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  PrivateCharterX Founder's NFT
                </h2>
                <p className="text-gray-600 text-sm">
                  Join our exclusive community of aviation enthusiasts with lifetime benefits
                </p>
              </div>

              {/* Benefits List */}
              <div className="space-y-3 mb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Member Benefits:</h3>
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center flex-shrink-0">
                      <benefit.icon size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 font-medium">{benefit.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <a
                href={openSeaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-black text-white py-4 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm group"
              >
                <span>View on OpenSea</span>
                <ExternalLink size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              {/* Secondary Info */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Supply</div>
                    <div className="text-sm font-bold text-gray-900">1,000</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Minted</div>
                    <div className="text-sm font-bold text-gray-900">247</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Network</div>
                    <div className="text-sm font-bold text-gray-900">Ethereum</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-300">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Shield size={24} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">Verified Collection</h3>
            <p className="text-xs text-gray-600">
              Official PrivateCharterX NFT collection verified on OpenSea
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-300">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Crown size={24} className="text-purple-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">Lifetime Access</h3>
            <p className="text-xs text-gray-600">
              Benefits never expire - hold the NFT to maintain your privileges
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-300">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-green-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">Growing Utility</h3>
            <p className="text-xs text-gray-600">
              More benefits and perks added as the platform grows
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
