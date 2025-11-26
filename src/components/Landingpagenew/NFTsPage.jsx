import React from 'react';
import { ExternalLink, Check, Shield, Crown, Sparkles, Zap, Wallet } from 'lucide-react';

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
    <div className="min-h-full font-['DM_Sans'] pb-8">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-black mb-2">PrivateCharterX NFT Collection</h1>
          <p className="text-gray-600 text-sm">
            Own a piece of luxury aviation with exclusive benefits and access
          </p>
        </div>

        {/* NFT Card - Glassmorphic */}
        <div className="backdrop-blur-xl bg-white/60 rounded-2xl border border-white/40 overflow-hidden shadow-xl">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left Side - Animated Video */}
            <div className="relative bg-gradient-to-br from-black/90 via-gray-900/90 to-black/80 p-8 flex items-center justify-center">
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
                <div className="absolute -top-3 -right-3 bg-black text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg border border-white/20">
                  Limited Edition
                </div>
              </div>
            </div>

            {/* Right Side - Benefits & CTA */}
            <div className="p-8 bg-white/40 backdrop-blur-sm">
              <div className="mb-6">
                <div className="inline-block bg-black text-white px-3 py-1 rounded-full text-xs font-semibold mb-4">
                  EXCLUSIVE NFT
                </div>
                <h2 className="text-2xl font-bold text-black mb-2">
                  PrivateCharterX Founder's NFT
                </h2>
                <p className="text-gray-600 text-sm">
                  Join our exclusive community of aviation enthusiasts with lifetime benefits
                </p>
              </div>

              {/* Benefits List */}
              <div className="space-y-3 mb-8">
                <h3 className="text-sm font-semibold text-black mb-4">Member Benefits:</h3>
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-white/50 backdrop-blur-sm rounded-lg border border-white/60 hover:border-black/20 transition-colors"
                  >
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
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
                className="w-full bg-black text-white py-4 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm group"
              >
                <span>View on OpenSea</span>
                <ExternalLink size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              {/* Secondary Info */}
              <div className="mt-4 pt-4 pb-4 border-t border-black/10">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Supply</div>
                    <div className="text-sm font-bold text-black">1,000</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Minted</div>
                    <div className="text-sm font-bold text-black">247</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Network</div>
                    <div className="text-sm font-bold text-black">Ethereum</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Section - Glassmorphic */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="backdrop-blur-xl bg-white/60 p-6 rounded-xl border border-white/40 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4">
              <Shield size={24} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-black mb-2">Verified Collection</h3>
            <p className="text-xs text-gray-600">
              Official PrivateCharterX NFT collection verified on OpenSea
            </p>
          </div>

          <div className="backdrop-blur-xl bg-white/60 p-6 rounded-xl border border-white/40 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4">
              <Crown size={24} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-black mb-2">Lifetime Access</h3>
            <p className="text-xs text-gray-600">
              Benefits never expire - hold the NFT to maintain your privileges
            </p>
          </div>

          <div className="backdrop-blur-xl bg-white/60 p-6 rounded-xl border border-white/40 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-black mb-2">Growing Utility</h3>
            <p className="text-xs text-gray-600">
              More benefits and perks added as the platform grows
            </p>
          </div>
        </div>

        {/* Wallet Connection Prompt - Glassmorphic */}
        <div className="mt-8 backdrop-blur-xl bg-white/60 rounded-xl border border-white/40 p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
              <Wallet size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-black mb-1">Connect Your Wallet</h3>
              <p className="text-xs text-gray-600">
                Connect your wallet to view your NFTs and claim exclusive benefits
              </p>
            </div>
            <button className="bg-black text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
