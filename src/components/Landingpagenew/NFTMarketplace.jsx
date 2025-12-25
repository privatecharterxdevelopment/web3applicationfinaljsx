import React from 'react';
import { ExternalLink, Check, Shield, Crown, Sparkles, Zap, Plus, ChevronRight, BadgeCheck } from 'lucide-react';

export default function NFTMarketplace({ onCreateNFT }) {
  const nftVideoUrl = "https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivateCharterX_transparent-_3_.mp4";
  const openSeaUrl = "https://opensea.io/collection/privatecharterx-membership-card";

  // PrivateCharterX NFT Data
  const nft = {
    name: "PrivateCharterX Membership",
    collection: "PrivateCharterX Official",
    description: "Exclusive membership NFT with lifetime aviation benefits and VIP privileges",
    supply: 100,
    minted: 47,
    network: "Base",
    price: "1.0 ETH",
    category: "Utility Token"
  };

  return (
    <div className="w-full h-full overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">NFT Marketplace</h1>
          <p className="text-gray-600">Exclusive digital collectibles with real-world utility</p>
        </div>

        {/* NFT Grid - matching My SPVs layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* PrivateCharterX NFT Card - Glassmorphic Design */}
          <div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(120, 120, 130, 0.15) 0%, rgba(80, 80, 90, 0.12) 50%, rgba(100, 100, 110, 0.18) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -1px 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.12)'
            }}
          >
            {/* Top edge highlight */}
            <div
              className="absolute top-0 left-0 right-0 h-[1px]"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.25) 70%, rgba(255,255,255,0.05) 100%)'
              }}
            />
            {/* Left edge highlight */}
            <div
              className="absolute top-0 left-0 bottom-0 w-[1px]"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)'
              }}
            />
            {/* Bottom edge subtle highlight */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[1px]"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.02) 100%)'
              }}
            />

            {/* NFT Video */}
            <div className="aspect-square bg-gray-900/80 rounded-xl mb-4 overflow-hidden relative">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              >
                <source src={nftVideoUrl} type="video/mp4" />
              </video>
              {/* Verified Badge */}
              <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1">
                <BadgeCheck size={12} />
                Verified
              </div>
              {/* Limited Badge */}
              <div className="absolute top-3 left-3 px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black rounded-lg text-[10px] font-bold">
                Limited
              </div>
            </div>

            {/* NFT Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Collection</p>
                  <p className="text-sm font-medium text-gray-900">{nft.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Network</p>
                  <p className="text-sm font-medium text-gray-900">{nft.network}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-400/20">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Price</p>
                  <p className="text-lg font-medium text-gray-900">{nft.price}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Discounts</p>
                  <p className="text-lg font-medium text-green-600">10% Off</p>
                </div>
              </div>

              {/* View on OpenSea */}
              <a
                href={openSeaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 mt-3 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <ExternalLink size={14} />
                <span>View on OpenSea</span>
              </a>
            </div>
          </div>

          {/* Create New NFT Button */}
          <button
            onClick={onCreateNFT}
            className="bg-white/60 backdrop-blur-xl border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-gray-400 hover:bg-white/80 transition-all flex flex-col items-center justify-center min-h-[200px] group"
          >
            <div className="w-12 h-12 bg-gray-100 group-hover:bg-gray-200 rounded-lg flex items-center justify-center mb-3 transition-colors">
              <Plus size={24} className="text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Create your NFT</p>
            <p className="text-xs text-gray-500 mt-1">(Utility Token)</p>
          </button>
        </div>
      </div>
    </div>
  );
}
